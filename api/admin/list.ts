// api/admin/list.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

function j(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(req: Request) {
  // 1) 어드민 토큰 확인
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token || token !== ADMIN_TOKEN) {
    return j({ ok: false, error: 'Unauthorized' }, 401);
  }

  // 2) 깃허브 이슈 조회(짧은 타임아웃 + 에러 본문 그대로 노출)
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000); // 10초
  try {
    const gh = await fetch(
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=30&sort=created&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lead-inbox-admin-list',
        },
        signal: ctl.signal,
        cache: 'no-store',
      }
    );

    const text = await gh.text();
    clearTimeout(timer);

    if (!gh.ok) {
      // Bad credentials / Resource not accessible / Not Found 등 본문 그대로 확인
      return j({ ok: false, stage: 'github', status: gh.status, body: text }, 502);
    }

    let issues: any[] = [];
    try {
      issues = JSON.parse(text);
    } catch {
      return j({ ok: false, stage: 'parse', body: text.slice(0, 1000) }, 500);
    }

    const items = issues.map((it) => ({
      id: it.id,
      number: it.number,
      title: it.title,
      created_at: it.created_at,
      labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
    }));

    return j({ ok: true, count: items.length, items }, 200);
  } catch (e: any) {
    clearTimeout(timer);
    return j({ ok: false, stage: 'catch', error: String(e?.message || e) }, 500);
  }
}
