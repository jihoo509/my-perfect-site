// api/admin/export.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// ---- utils ----
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

/** 본문에서 JSON 코드블록/순수 JSON 모두 파싱 */
function parsePayloadFromBody(body?: string): any {
  if (!body || typeof body !== 'string') return {};
  const text = body.trim();

  // 1) fenced code block 우선
  const s = text.indexOf('```');
  const e = text.lastIndexOf('```');
  let inside = text;
  if (s >= 0 && e > s) inside = text.slice(s + 3, e);

  // 2) 블록 내부에서 JSON 객체 구간 추출
  const js = inside.indexOf('{');
  const je = inside.lastIndexOf('}');
  if (js >= 0 && je > js) {
    try {
      return JSON.parse(inside.slice(js, je + 1));
    } catch {}
  }

  // 3) 마지막 시도: 전체를 JSON으로 시도
  try { return JSON.parse(text); } catch {}
  return {};
}

function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return BOM + rows.map(r => r.map(esc).join(',')).join('\n');
}
// ---------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // admin 토큰
  const token = String(req.query.token || '');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase(); // json|csv
  const wantDownload = ['1', 'true'].includes(String(req.query.download || '').toLowerCase());
  const siteFilter = String(req.query.site || '');
  const typeFilter = String(req.query.type || '');

  try {
    const url = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`;

    const gh = await fetchWithTimeout(url, {
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'vercel-admin-export',
      },
    });

    if (!gh.ok) {
      const detail = await gh.text().catch(() => '');
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error', detail });
    }

    const raw = (await gh.json()) as any[];

    // 가공: CSV 요구 포맷에 맞춤
    const items = raw.map((it) => {
      const site = pickLabel(it.labels, 'site:');
      const t = pickLabel(it.labels, 'type:'); // phone|online
      const payload = parsePayloadFromBody(it.body);

      const requestType =
        (t === 'phone' || t === 'online')
          ? (t === 'phone' ? '전화상담' : '온라인분석')
          : (payload?.type === 'phone' ? '전화상담' : payload?.type === 'online' ? '온라인분석' : '');

      // CSV 표시는: phone -> birth, online -> 900101-1******
      let birthOrRrn = '';
      if (t === 'online' || payload?.type === 'online') {
        const f = payload?.rrnFront || '';
        const bm = payload?.rrnBackMasked || ''; // "1******"
        if (f) birthOrRrn = `${f}-${bm || '*******'}`;
        else birthOrRrn = payload?.birthOrRrnMasked || '';
      } else {
        birthOrRrn = payload?.birth || '';
      }

      return {
        site,
        requested_at: it.created_at,
        request_type: requestType,
        name: payload?.name || '',
        birth_or_rrn: birthOrRrn,
        gender: payload?.gender || '',
        phone: payload?.phone || '',
        labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
        type: t,
      };
    }).filter(r => {
      if (siteFilter && r.site !== siteFilter) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      return true;
    });

    if (format === 'csv') {
      const header = ['site', 'requested_at', 'request_type', 'name', 'birth_or_rrn', 'gender', 'phone'];
      const rows = [header, ...items.map(r => [
        r.site, r.requested_at, r.request_type, r.name, r.birth_or_rrn, r.gender, r.phone,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout', detail: 'GitHub call timed out' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message || String(err) });
  }
}
