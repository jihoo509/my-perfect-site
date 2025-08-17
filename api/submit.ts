// api/submit.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;
  name?: string;
  phone?: string;
  // 전화상담
  birth?: string;            // YYMMDD or YYYYMMDD
  // 온라인분석
  rrnFront?: string;         // YYMMDD
  rrnBack?: string;          // 7자리(숫자)
  gender?: '남' | '여';
};

const { GH_TOKEN, GH_REPO_FULLNAME } = process.env;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  const body: SubmitBody = req.body || {};
  const {
    type,
    site = 'teeth',
    name = '',
    phone = '',
    birth = '',
    rrnFront = '',
    rrnBack = '',
    gender,
  } = body;

  if (!type || !['phone', 'online'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid type' });
  }

  // ----- 표시용 값(엑셀/제목에 쓰임) -----
  const clean = (s: string) => (s || '').replace(/\D/g, '');
  let birthOrRrnMasked = '';
  if (type === 'phone') {
    const b6 = clean(birth).slice(-6);               // YYMMDD만
    birthOrRrnMasked = b6;                           // 그대로 표시
  } else {
    const f6 = clean(rrnFront).slice(0, 6);
    const b7 = clean(rrnBack).slice(0, 7);
    birthOrRrnMasked = f6 ? `${f6}-${b7 ? b7[0] + '******' : '*******'}` : '';
  }

  const title = `[${type === 'phone' ? '전화' : '온라인'}] ${name || '이름 미입력'} / ${gender || '성별 미선택'} / ${birthOrRrnMasked}`;

  // ----- 본문(payload) 저장: 뒤 7자리는 평문 저장 금지 -----
  const payload = {
    site, type, name, phone, gender,
    // 전화상담
    birth: type === 'phone' ? clean(birth).slice(-6) : undefined,  // YYMMDD
    // 온라인분석(필요하면 해시 추가 가능)
    rrnFront: type === 'online' ? clean(rrnFront).slice(0, 6) : undefined,
    rrnBackMasked: type === 'online' ? (clean(rrnBack) ? clean(rrnBack)[0] + '******' : undefined) : undefined,
    // 공통 표시용
    birthOrRrnMasked,
    requestedAt: new Date().toISOString(),
    ua: (req.headers['user-agent'] || '').slice(0, 200),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };

  const issueBody = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';

  try {
    const resp = await fetchWithTimeout(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body: issueBody, labels: [`type:${type}`, `site:${site}`] }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: 'GitHub error', detail: text });
    }

    const issue = await resp.json();
    return res.status(200).json({ ok: true, number: issue.number });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout from GitHub API' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: e?.message });
  }
}
