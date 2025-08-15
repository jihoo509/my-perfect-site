// api/admin/list.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!; // 예: "jihoo509/lead-inbox"
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

function json(data: any, status = 200) {
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
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  // 2) 깃허브 호출 (짧은 타임아웃)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('timeout')), 10000); // 10초
  try {
    const gh = await fetch(
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=30&sort=created&direction=desc`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lead-inbox-admin-list', // v3는 UA 권장
        },
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    const text = await gh.text(); // 먼저 text로 받아두면 에러본문도 보여줄 수 있음
    clearTimeout(timeout);

    if (!gh.ok) {
      return json(
        { ok: false, stage: 'github', status: gh.status, body: text },
        502
      );
    }

    const issues = JSON.parse(text);
    const items = (issues as any[]).map((it) => ({
      id: it.id,
      number: it.number,
      title: it.title,
      created_at: it.created_at,
      labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
    }));
    return json({ ok: true, count: items.length, items }, 200);
  } catch (err: any) {
    clearTimeout(timeout);
    return json({ ok: false, stage: 'catch', error: String(err?.message || err) }, 500);
  }
}
