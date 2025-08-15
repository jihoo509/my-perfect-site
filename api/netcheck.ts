// api/netcheck.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;

export default async function handler() {
  const r = await fetch('https://api.github.com/rate_limit', {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'lead-inbox-netcheck',
    },
    cache: 'no-store',
  });
  const j = await r.json();
  return new Response(
    JSON.stringify({
      ok: r.ok,
      repo: GH_REPO_FULLNAME,
      core: j?.resources?.core, // {limit, used, remaining, reset}
    }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
}
