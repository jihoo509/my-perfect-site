// api/debug.ts
// 가장 호환 잘 되는 전통형 핸들러 (VercelRequest/VercelResponse 스타일)

export default function handler(req: any, res: any) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify({
      ok: true,
      ts: new Date().toISOString(),
      env: {
        GH_TOKEN: !!process.env.GH_TOKEN,
        GH_REPO_FULLNAME: !!process.env.GH_REPO_FULLNAME,
        ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
      },
    }));
  } catch (e: any) {
    res.status(500).send(JSON.stringify({ ok: false, error: String(e?.message || e) }));
  }
}
