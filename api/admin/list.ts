// /api/admin/list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GH_TOKEN = process.env.GH_TOKEN!;
const REPO_FULL = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
const [OWNER, REPO] = REPO_FULL.split('/');

function send(res: VercelResponse, status: number, data: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.status(status).json(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== ADMIN_TOKEN) return send(res, 401, { error: 'Unauthorized' });

  try {
    const label = (req.query.label as string) || ''; // e.g. "type:online"
    const state = (req.query.state as string) || 'all';

    const url = new URL(`https://api.github.com/repos/${OWNER}/${REPO}/issues`);
    url.searchParams.set('state', state);
    url.searchParams.set('per_page', '50');
    if (label) url.searchParams.set('labels', label);

    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
    });

    if (!r.ok) {
      const err = await r.text();
      return send(res, r.status, { error: 'GitHub list failed', detail: err });
    }

    const data = await r.json();
    const items = (data as any[]).map((it) => ({
      number: it.number,
      title: it.title,
      state: it.state,
      labels: it.labels?.map((l: any) => l.name),
      created_at: it.created_at,
      url: it.html_url,
      body: it.body,
    }));

    return send(res, 200, { items });
  } catch (e: any) {
    return send(res, 500, { error: e?.message || 'Unknown error' });
  }
}
