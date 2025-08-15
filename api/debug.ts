// api/_debug.ts
export const config = { runtime: 'nodejs' };

function buildURL(req: Request) {
  return new URL(req.url, `https://${process.env.VERCEL_URL || 'localhost'}`);
}

export default async function handler(req: Request) {
  const url = buildURL(req);
  return new Response(
    JSON.stringify({
      ok: true,
      now: new Date().toISOString(),
      url: url.toString(),
      vercel_url: process.env.VERCEL_URL || null,
      env: {
        GH_TOKEN: !!process.env.GH_TOKEN,
        GH_REPO_FULLNAME: !!process.env.GH_REPO_FULLNAME,
        ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
      },
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}
