// api/netcheck.ts
export const config = { runtime: 'nodejs' };

function j(data:any, status=200){
  return new Response(JSON.stringify(data), {
    status, headers:{'content-type':'application/json; charset=utf-8'}
  });
}

export default async function handler() {
  const out: any = { ts: new Date().toISOString() };

  try {
    const t0 = Date.now();
    const r1 = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      headers:{ 'User-Agent':'vercel-lead-inbox/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    out.public = { status: r1.status, ms: Date.now() - t0 };
  } catch (e:any) {
    out.public = { error: e.name, message: String(e.message) };
  }

  try {
    const t1 = Date.now();
    const r2 = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      headers:{
        'User-Agent':'vercel-lead-inbox/1.0',
        Authorization: `Bearer ${process.env.GH_TOKEN}`
      },
      signal: AbortSignal.timeout(5000),
    });
    out.auth = { status: r2.status, ms: Date.now() - t1 };
  } catch (e:any) {
    out.auth = { error: e.name, message: String(e.message) };
  }

  return j(out);
}
