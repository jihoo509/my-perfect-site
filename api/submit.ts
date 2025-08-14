// /api/submit.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GH_TOKEN = process.env.GH_TOKEN!;
const REPO_FULL = process.env.GH_REPO_FULLNAME!; // e.g. "jihoo509/lead-inbox"
const [OWNER, REPO] = REPO_FULL.split('/');

function send(res: VercelResponse, status: number, data: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res.status(status).json(data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  try {
    if (!GH_TOKEN || !OWNER || !REPO) {
      return send(res, 500, { error: 'Server env not configured' });
    }

    const {
      consultationType, // 'online' | 'phone'
      name,
      birthDateFirst,
      birthDateSecond,
      gender,
      phoneNumber,
      extra = {},
    } = req.body || {};

    if (!consultationType || !name || !phoneNumber) {
      return send(res, 400, { error: 'Missing required fields' });
    }

    const labels = [
      consultationType === 'online' ? 'type:online' : 'type:phone',
    ];

    // ensure label exists
    const ensureLabel = async (name: string, color = '0ea5e9') => {
      const get = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/labels/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      });
      if (get.status === 404) {
        await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/labels`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GH_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, color }),
        });
      }
    };
    for (const l of labels) await ensureLabel(l);

    const title = `[${consultationType.toUpperCase()}] ${name} / ${phoneNumber}`;
    const body = [
      `**이름**: ${name}`,
      `**주민번호**: ${birthDateFirst || ''}-${birthDateSecond || ''}`,
      `**성별**: ${gender || ''}`,
      `**전화번호**: ${phoneNumber}`,
      '',
      `**원본 데이터(JSON)**`,
      '```json',
      JSON.stringify({ consultationType, name, birthDateFirst, birthDateSecond, gender, phoneNumber, extra }, null, 2),
      '```',
    ].join('\n');

    const issueResp = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!issueResp.ok) {
      const err = await issueResp.text();
      return send(res, issueResp.status, { error: 'GitHub issue create failed', detail: err });
    }

    const issue = await issueResp.json();
    return send(res, 200, { success: true, number: issue.number, url: issue.html_url });
  } catch (e: any) {
    return send(res, 500, { error: e?.message || 'Unknown error' });
  }
}
