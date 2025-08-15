export const config = { runtime: 'nodejs' };

export default async function handler() {
  const ver = {
    ts: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    url: process.env.VERCEL_URL || 'unknown',
  };
  return new Response(JSON.stringify({ ok: true, ver }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
