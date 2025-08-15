// api/netcheck.ts
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  return new Response(JSON.stringify({ ok: true, path: '/api/netcheck' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
