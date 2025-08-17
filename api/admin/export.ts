import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// ---------- utils ----------
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] | undefined, prefix: string) {
  const arr = Array.isArray(labels) ? labels : [];
  const hit = arr.find(l => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

// 본문에서 JSON을 최대한 안전하게 찾아 파싱
function parsePayloadFromBody(body?: string) {
  if (!body || typeof body !== 'string') return {};
  // 1) ```json ... ``` 형태 우선
  const block = body.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (block?.[1]) {
    const js = block[1].match(/{[\s\S]*}/);
    if (js) {
      try { return JSON.parse(js[0]); } catch {}
    }
  }
  // 2) 본문 전체에서 최초의 { ... } 구간 시도
  const raw = body.match(/{[\s\S]*}/);
  if (raw) {
    try { return JSON.parse(raw[0]); } catch {}
  }
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
// ---------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase();
  const wantDownload = ['1', 'true', 'yes'].includes(String(req.query.download || '').toLowerCase());

  try {
    // 최신 open 100건(필요하면 state=all 로 바꿔도 됨)
    const url = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`;

    const gh = await fetchWithTimeout(url, {
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

    // 고정 컬럼으로 변환
    const items = issues.map((it) => {
      const payload: any = parsePayloadFromBody(it.body);

      const site = pickLabel(it.labels, 'site:') || payload.site || '';
      const type = pickLabel(it.labels, 'type:') || payload.type || ''; // 'phone' | 'online'
      const request_type = type === 'online' ? '온라인분석' : (type === 'phone' ? '전화상담' : '');

      const requested_at = payload.requestedAt || it.created_at || '';
      const name = payload.name || '';

      // 전화상담: birth6 / 온라인: rrnFull (요청하신 대로 주민번호 풀 표시)
      const birth_or_rrn = payload.rrnFull || payload.birth6 || '';

      const gender = payload.gender || '';
      const phone = payload.phone || '';

      return { site, requested_at, request_type, name, birth_or_rrn, gender, phone };
    });

    if (format === 'csv') {
      const header = ['site', 'requested_at', 'request_type', 'name', 'birth_or_rrn', 'gender', 'phone'];
      const rows = [header, ...items.map(r => [
        r.site, r.requested_at, r.request_type, r.name, r.birth_or_rrn, r.gender, r.phone,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0,10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout', detail: 'GitHub call timed out' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: e?.message || String(e) });
  }
}
