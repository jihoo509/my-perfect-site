// api/admin/list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GH = (path: string) =>
  `https://api.github.com/repos/${process.env.GH_REPO_FULLNAME}${path}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const qSite = (req.query.site ?? '').toString().trim();   // e.g. 'teeth'
    const qType = (req.query.type ?? '').toString().trim();   // 'online' | 'phone' | ''
    const labels: string[] = [];
    if (qSite) labels.push(`site:${qSite}`);
    if (qType) labels.push(`type:${qType}`);

    // state=all, PR 제외용 filter, 최대 100건(필요 시 페이지네이션 추가)
    const url = GH(`/issues?state=all&per_page=100${labels.length ? `&labels=${encodeURIComponent(labels.join(','))}` : ''}`);

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        'User-Agent': 'vercel-fn',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('GitHub list error:', r.status, text);
      return res.status(500).json({ ok: false, error: 'GitHub API error', status: r.status, detail: text });
    }

    const raw = await r.json();
    const items = (Array.isArray(raw) ? raw : [])
      // PR은 제외
      .filter((it: any) => !it.pull_request)
      .map((it: any) => {
        let payload: any = {};
        try {
          if (it.body) payload = JSON.parse(it.body);
        } catch {}
        return {
          id: it.id,
          number: it.number,
          title: it.title,
          created_at: it.created_at,
          labels: (it.labels || []).map((l: any) => l.name),
          payload,
        };
      });

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    console.error('admin/list error:', err?.stack || err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
