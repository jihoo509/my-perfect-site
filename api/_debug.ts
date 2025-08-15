// api/_debug.ts
export const config = { runtime: 'nodejs' };

export default async function handler(_req: Request) {
  return new Response(
    JSON.stringify({ ok: true, now: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
}
