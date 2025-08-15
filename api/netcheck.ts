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

export default async function handler() {
  try {
    const url = `https://api.github.com/repos/${GH_REPO_FULLNAME}`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000); // 8초 타임아웃(호환성 위해 reason 미전달)

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
      url,
      // 본문 일부만 미리보기(권한/에러 메시지 확인 용도)
      preview: text.slice(0, 1000),
    }, res.ok ? 200 : 502);
  } catch (e: any) {
    return j({ ok: false, stage: 'catch', error: String(e?.message || e) }, 500);
  }
}
