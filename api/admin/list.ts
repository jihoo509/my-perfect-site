// api/admin/list.ts
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
    if (!res.ok) {
      return { ok: false, status: res.status, text };
    }
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

  const list = (r.json as any[]).map((it) => ({
    id: it.id,
    number: it.number,
    title: it.title,
    created_at: it.created_at,
    labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
  }));

  return new Response(JSON.stringify({ ok: true, count: list.length, items: list }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
