// api/admin/list.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token || token !== ADMIN_TOKEN) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    if (!GH_TOKEN || !GH_REPO_FULLNAME) {
      return json({ ok: false, error: 'Missing env' }, 500);
    }

    const url =
      `https://api.github.com/repos/${GH_REPO_FULLNAME}` +
      `/issues?state=open&per_page=30&sort=created&direction=desc`;

    // ⬇️ 핵심: 타임아웃 + User-Agent
    const gh = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'vercel-lead-inbox/1.0',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    const bodyText = await gh.text(); // 에러 메시지 확인용
    if (!gh.ok) {
      // GitHub가 바로 주는 원문을 보여줘서 원인 파악
      return json(
        {
          ok: false,
          step: 'github',
          status: gh.status,
          body: bodyText.slice(0, 500),
        },
        gh.status,
      );
    }

    const issues = JSON.parse(bodyText);
    const items = (issues as any[]).map((i) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      created_at: i.created_at,
    }));

    return json({ ok: true, count: items.length, items });
  } catch (err: any) {
    // 네트워크 타임아웃/차단이면 여기로 들어옴
    return json(
      { ok: false, error: err?.name || 'Error', message: String(err?.message || err) },
      500,
    );
  }
}
