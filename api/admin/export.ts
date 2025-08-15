import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// --------- utils ----------
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

function parsePayloadFromBody(body?: string) {
  if (!body) return {} as any;
  // ```json ... ``` 사이에 있는 JSON 블록 추출
  const s = body.indexOf('```');
  const e = body.lastIndexOf('```');
  if (s >= 0 && e > s) {
    const inside = body.slice(s + 3, e).trim();
    const js = inside.indexOf('{');
    const je = inside.lastIndexOf('}');
    if (js >= 0 && je > js) {
      try {
        return JSON.parse(inside.slice(js, je + 1));
      } catch { /* ignore */ }
    }
  }
  return {} as any;
}

function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  return BOM + csv;
}
// --------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) 관리자 토큰 검사
  const token = req.query.token as string | undefined;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // 2) 쿼리
  const format = String((req.query.format ?? 'json')).toLowerCase(); // 'json' | 'csv'
  const download = String(req.query.download ?? '').toLowerCase();
  const wantDownload = download === '1' || download === 'true';
  const siteFilter = (req.query.site as string) || '';
  const typeFilter = (req.query.type as string) || '';

  try {
    // 3) GitHub Issues 가져오기 (open 100개, 최신순)
    const apiUrl =
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`;

    const gh = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }, 10000);

    if (!gh.ok) {
      const text = await gh.text().catch(() => '');
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error', detail: text });
    }

    const issues = (await gh.json()) as any[];

    // 4) 가공
    const items = issues.map(it => {
      const site = pickLabel(it.labels, 'site:');
      const type = pickLabel(it.labels, 'type:');
      const payload = parsePayloadFromBody(it.body);

      return {
        number: it.number,
        title: it.title,
        created_at: it.created_at,
        site,
        type,
        name: payload.name ?? '',
        phone: payload.phone ?? payload.phoneNumber ?? '',
        birth: payload.birth ?? payload.birthDate ?? '',
        labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
      };
    }).filter(r => {
      if (siteFilter && r.site !== siteFilter) return false;
      if (typeFilter && r.type !== typeFilter) return false;
      return true;
    });

    // 5) 응답
    if (format === 'csv') {
      const header = ['number', 'title', 'created_at', 'site', 'type', 'name', 'phone', 'birth'];
      const rows = [header, ...items.map(r => [
        String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      return res.status(200).send(csv);
    }

    // 기본: JSON
    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout', detail: 'GitHub call timed out' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message || String(err) });
  }
}
