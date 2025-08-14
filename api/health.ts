export const config = { runtime: 'edge' };

export default async function handler() {
  const ok = (v: unknown) => Boolean(v);

  return new Response(
    JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      env: {
        GH_TOKEN: ok(process.env.GH_TOKEN),
        GH_REPO_FULLNAME: ok(process.env.GH_REPO_FULLNAME),
        ADMIN_TOKEN: ok(process.env.ADMIN_TOKEN),
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}
