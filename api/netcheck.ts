// api/netcheck.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!; // 예: "jihoo509/lead-inbox"

function j(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(req: Request) {
  const urlObj = new URL(req.url);
  const live = urlObj.searchParams.get('live') === '1';

  // 드라이런: 라우팅/ENV만 즉시 확인
  if (!live) {
    return j({
      ok: true,
      mode: 'dry',
      repo: GH_REPO_FULLNAME,
      hasToken: Boolean(GH_TOKEN),
    });
  }

  // 실제 깃허브 호출 (8초 타임아웃, 실패 이유를 즉시 반환)
  try {
    const url = `https://api.github.com/repos/${GH_REPO_FULLNAME}`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'lead-inbox-netcheck',
      },
      signal: ctl.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    clearTimeout(timer);

    return j({
      ok: res.ok,
      status: res.status,
      preview: text.slice(0, 800),
    }, res.ok ? 200 : 502);
  } catch (e: any) {
    return j({ ok: false, stage: 'catch', error: String(e?.message || e) }, 500);
  }
}
