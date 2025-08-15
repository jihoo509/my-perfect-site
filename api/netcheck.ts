// api/netcheck.ts
export const config = { runtime: 'nodejs' };

export default function handler() {
  return new Response(JSON.stringify({ ok: true, path: '/api/netcheck' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
