import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    env: {
      hasGH_TOKEN: !!process.env.GH_TOKEN,
      repo: process.env.GH_REPO_FULLNAME || null,
      hasADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
    },
    node: process.version,
  });
}
