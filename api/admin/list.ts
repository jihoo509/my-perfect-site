// api/admin/list.ts — dry-run (깃허브 호출 없이 URL/토큰만 검증)
export const config = { runtime: 'nodejs' };

const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

// Node(plain object headers) + Web(Request.headers.get) 모두 지원
function getHeader(req: any, key: string): string {
  const h = req?.headers;
  if (!h) return '';
  if (typeof h.get === 'function') {
    return h.get(key) || '';
  }
  const k = key.toLowerCase();
  return h[k] || h[key] || '';
}

// 절대 URL 생성을 항상 보장
function urlFromReq(req: any): URL {
  const raw = (req?.url as string) || '/';
  if (/^https?:\/\//i.test(raw)) return new URL(raw);

  const proto = getHeader(req, 'x-forwarded-proto') || 'https';
  const host  = getHeader(req, 'host') || 'localhost';
  return new URL(raw, `${proto}://${host}`);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export default function handler(req: any) {
  let url: URL;
  try {
    url = urlFromReq(req);
  } catch {
    return json({ ok: false, error: 'Bad URL' }, 400);
  }

  const token = url.searchParams.get('token') || '';

  if (!token || token !== ADMIN_TOKEN) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  // 깃허브 호출 없이 즉시 성공 반환 (드라이런)
  return json({
    ok: true,
    mode: 'dry',
    path: url.pathname,
    q: Object.fromEntries(url.searchParams.entries()),
    ts: new Date().toISOString(),
  });
}
