// api/admin/export.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN ?? '';
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME ?? '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';

function buildURL(req: Request) {
  return new URL(req.url, `https://${process.env.VERCEL_URL || 'localhost'}`);
}
function ensureAdmin(req: Request) {
  const url = buildURL(req);
  const token = url.searchParams.get('token');
  return token && token === ADMIN_TOKEN;
}
function pickLabel(labels: any[], prefix: string) {
  const hit = labels?.find((l: any) => typeof l.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}
function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const start = body.indexOf('```');
  const end = body.lastIndexOf('```');
  if (start >= 0 && end > start) {
    const inside = body.slice(start + 3, end).trim();
    const s = inside.startsWith('json') ? inside.slice(4) : inside;
    try {
      return JSON.parse(s);
    } catch {}
  }
  return {};
}
function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return s.includes('"') || s.includes(',') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return BOM + rows.map((r) => r.map(esc).join(',')).join('\n');
}
async function ghJson(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'lead-inbox-vercel',
      },
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, text };
    return { ok: true, json: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false, status: 599, text: e?.name === 'AbortError' ? 'timeout' : String(e) };
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req: Request) {
  if (!ensureAdmin(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  if (!GH_TOKEN || !GH_REPO_FULLNAME) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing env' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const url = buildURL(req);
  const format = (url.searchParams.get('format') || 'json').toLowerCase(); // json|csv
  const dl = url.searchParams.get('download') === '1';
  const siteFilter = url.searchParams.get('site') || '';
  const typeFilter = url.searchParams.get('type') || '';

  const api =
    `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues` +
    `?state=open&per_page=50&sort=created&direction=desc`;

  const r = await ghJson(api);
  if (!r.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'GitHub fetch failed', detail: r.text, status: r.status }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const issues = r.json as any[];
  const items = issues
    .map((it) => {
      const site = pickLabel(it.labels, 'site:');
      const type = pickLabel(it.labels, 'type:');
      const payload = parsePayloadFromBody(it.body);
      return {
        number: it.number,
        title: it.title,
        created_at: it.created_at,
        site,
        type,
        name: payload.name || '',
        phone: payload.phone || '',
        birth: payload.birth || '',
        labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
        payload,
      };
    })
    .filter((row) => (!siteFilter || row.site === siteFilter) && (!typeFilter || row.type === typeFilter));

  if (format === 'csv') {
    const header = ['number', 'title', 'created_at', 'site', 'type', 'name', 'phone', 'birth'];
    const rows = [header, ...items.map((r) => [String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth])];
    const csv = toCSV(rows);
    const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        ...(dl ? { 'content-disposition': `attachment; filename="${filename}"` } : {}),
      },
    });
  }

  return new Response(JSON.stringify({ ok: true, count: items.length, items }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
