// api/debug.ts
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  return new Response(
    JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      env: {
        GH_TOKEN: !!process.env.GH_TOKEN,
        GH_REPO_FULLNAME: !!process.env.GH_REPO_FULLNAME,
        ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
      },
    }),
    { headers: { 'content-type': 'application/json; charset=utf-8' } }
  );
}
