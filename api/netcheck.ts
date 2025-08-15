// api/netcheck.ts
export const config = { runtime: 'nodejs' };

export default async function handler(_req: Request) {
  return new Response(JSON.stringify({ ok: true, who: 'netcheck' }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
