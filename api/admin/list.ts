// api/admin/list.ts
export const config = { runtime: 'nodejs' };

export default function handler(req: Request) {
  // ✅ Vercel에서는 req.url이 상대경로일 수 있으므로 base를 반드시 붙여준다
  const base =
    `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host') || 'localhost'}`;
  const url = new URL(req.url, base);

  const token = url.searchParams.get('token') || '';

  // 여기선 깃허브 콜 없이 바로 OK만 내려서, URL 파싱 문제가 사라졌는지 검증
  return new Response(
    JSON.stringify({ ok: true, tokenLength: token.length }),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}
