export const runtime = 'nodejs'; // 또는 'edge'

type Item = {
  id: number;
  url: string;
  title: string;
  body?: string;
  labels?: { name: string }[];
  created_at: string;
};

function toCSV(items: Item[]) {
  const rows = [
    ['id', 'title', 'url', 'labels', 'created_at'],
    ...items.map(i => [
      String(i.id),
      i.title?.replace(/"/g, '""') ?? '',
      i.url,
      (i.labels ?? []).map(l => l.name).join('|'),
      i.created_at
    ])
  ];
  return rows.map(r => r.map(f => `"${(f ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') ?? '';
    const site  = searchParams.get('site') ?? '';
    const type  = searchParams.get('type') ?? '';
    const from  = searchParams.get('from') ?? '';
    const to    = searchParams.get('to') ?? '';
    const format = (searchParams.get('format') ?? 'csv').toLowerCase();

    const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';
    const GH_TOKEN = process.env.GH_TOKEN ?? '';
    const REPO = process.env.GH_REPO_FULLNAME ?? ''; // e.g. "jihoo509/lead-inbox"

    if (!token || token !== ADMIN_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!GH_TOKEN || !REPO) {
      return new Response('Missing GitHub env', { status: 500 });
    }

    // GitHub 이슈(lead) 조회
    const q: string[] = [`repo:${REPO}`, 'is:issue'];
    if (site) q.push(`label:site:${site}`);
    if (type) q.push(`label:type:${type}`);
    if (from) q.push(`created:>=${from}`);
    if (to)   q.push(`created:<=${to}`);

    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q.join(' '))}&per_page=100`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) {
      const text = await res.text();
      return new Response(`GitHub API error: ${res.status} ${text}`, { status: 500 });
    }
    const data = await res.json() as { items: any[] };

    const items: Item[] = (data.items ?? []).map(it => ({
      id: it.number,
      url: it.html_url,
      title: it.title,
      body: it.body,
      labels: (it.labels ?? []).map((l: any) => ({ name: l.name })),
      created_at: it.created_at
    }));

    if (format === 'json') {
      return Response.json({ ok: true, count: items.length, items });
    }

    const csv = toCSV(items);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="export-${Date.now()}.csv"`
      }
    });
  } catch (e: any) {
    return new Response(`Export error: ${e?.message ?? e}`, { status: 500 });
  }
}
