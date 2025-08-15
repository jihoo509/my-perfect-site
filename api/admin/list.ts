import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&sort=created&direction=desc&per_page=100`;

    const githubRes = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      return res.status(githubRes.status).json({ error: 'GitHub API Error', details: errorText });
    }

    const issues = await githubRes.json();
    return res.status(200).json({ ok: true, count: issues.length, issues });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout', details: 'GitHub API call timed out after 8 seconds.' });
    }
    return res.status(500).json({ error: 'Internal Server Error', details: error?.message });
  }
}
