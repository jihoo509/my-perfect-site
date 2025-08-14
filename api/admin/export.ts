// api/admin/export.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GH = (path: string) =>
  `https://api.github.com/repos/${process.env.GH_REPO_FULLNAME}${path}`;

function toCsv(rows: any[]): string {
  if (!rows.length) return 'number,title,created_at,site,type,name,phone,birth\n';
  const header = ['number','title','created_at','site','type','name','phone','birth'];
  const esc = (v: any) => {
    const s = (v ?? '').toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map(r => header.map(k => esc(r[k])).join(',')).join('\n');
  return header.join(',') + '\n' + body + '\n';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const qSite = (req.query.site ?? '').toString().trim();   // e.g. 'teeth'
    const qType = (req.query.type ?? '').toString().trim();   // 'online' | 'phone' | ''
    const from = (req.query.from ?? '').toString().trim();    // YYYY-MM-DD
    const to   = (req.query.to   ?? '').toString().trim();    // YYYY-MM-DD
    const format = (req.query.format ?? 'csv').toString().toLowerCase(); // 'csv' | 'json'

    const labels: string[] = [];
    if (qSite) labels.push(`site:${qSite}`);
    if (qType) labels.push(`type:${qType}`);

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
      console.error('GitHub export error:', r.status, text);
      return res.status(500).json({ ok: false, error: 'GitHub API error', status: r.status, detail: text });
    }

    const raw = await r.json();
    let items = (Array.isArray(raw) ? raw : [])
      .filter((it: any) => !it.pull_request)
      .map((it: any) => {
        let payload: any = {};
        try { if (it.body) payload = JSON.parse(it.body); } catch {}
        // 라벨 파싱
        const labels = (it.labels || []).map((l: any) => l.name);
        const siteLabel = labels.find((n: string) => n.startsWith('site:')) || '';
        const typeLabel = labels.find((n: string) => n.startsWith('type:')) || '';
        return {
          number: it.number,
          title: it.title,
          created_at: it.created_at,
          site: siteLabel.replace('site:', ''),
          type: typeLabel.replace('type:', ''),
          name: payload.name || '',
          phone: payload.phone || '',
          birth: payload.birth || payload.birthDate || '',
          labels,
          payload,
        };
      });

    // 날짜 필터(옵션)
    if (from) {
      const fromTs = Date.parse(from);
      items = items.filter(i => Date.parse(i.created_at) >= fromTs);
    }
    if (to) {
      const toTs = Date.parse(to) + 24*60*60*1000 - 1; // inclusive
      items = items.filter(i => Date.parse(i.created_at) <= toTs);
    }

    if (format === 'json') {
      return res.status(200).json({ ok: true, count: items.length, items });
    }

    // CSV (기본)
    const csv = toCsv(items);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.status(200).send(csv);
  } catch (err: any) {
    console.error('admin/export error:', err?.stack || err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
