// api/ping.ts
export const config = { runtime: 'nodejs' }; // 유지해도 되고 없어도 됩니다.

export default async function handler(_req: Request) {
  return new Response(
    JSON.stringify({ ok: true, ts: new Date().toISOString() }),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}
