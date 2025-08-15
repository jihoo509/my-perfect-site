// api/admin/ping.ts
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const u = new URL(req.url);
  return new Response(
    JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      path: u.pathname,
      token: u.searchParams.get('token') ?? null,
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}
