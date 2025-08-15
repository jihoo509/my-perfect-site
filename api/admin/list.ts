// api/admin/list.ts  — dry-run only
export const config = { runtime: 'nodejs' };

const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

// Vercel Edge/Node에서 절대경로 보장용
function urlWithBase(req: Request) {
  const base = `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host') || 'localhost'}`;
  return new URL(req.url, base);
}

export default function handler(req: Request) {
  const url = urlWithBase(req);
  const token = url.searchParams.get('token') || '';

  if (!token || token !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ ok:false, error:'Unauthorized' }), {
      status: 401,
      headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' },
    });
  }

  // 깃허브 호출은 전혀 X — URL/토큰만 확인
  return new Response(JSON.stringify({
    ok: true,
    mode: 'dry',
    path: url.pathname,
    q: Object.fromEntries(url.searchParams.entries()),
    ts: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' },
  });
}
