// api/admin/list.ts (임시 더미)
export default async function handler(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (token !== process.env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ ok:false, error:'Unauthorized' }), {
      status: 401, headers:{'content-type':'application/json'}
    });
  }
  return new Response(JSON.stringify({ ok:true, msg:'list-dummy' }), {
    headers:{'content-type':'application/json'}
  });
}
