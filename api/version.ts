// api/version.ts
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  const data = {
    ok: true,
    ts: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    route: new URL(req.url).pathname
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
