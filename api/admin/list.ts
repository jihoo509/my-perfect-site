export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const bearer = req.headers.get('authorization') || '';
  const tokenFromHeader = bearer.replace(/^Bearer\s+/i, '').trim();
  const token = tokenFromHeader || url.searchParams.get('token') || '';

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  const gh = await fetch(
    `https://api.github.com/repos/${process.env.GH_REPO_FULLNAME}/issues?state=open&per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!gh.ok) {
    const detail = await gh.text();
    return new Response(
      JSON.stringify({ ok: false, error: 'GitHub API error', status: gh.status, detail }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const list: any[] = await gh.json();
  const items = list.map((i) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    labels: (i.labels || []).map((l: any) => l.name),
    created_at: i.created_at,
    url: i.html_url,
  }));

  return new Response(JSON.stringify({ ok: true, count: items.length, items }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
