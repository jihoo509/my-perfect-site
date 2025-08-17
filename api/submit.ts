import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;
  name?: string;
  phone?: string;

  // 전화상담 폼
  birth?: string;          // YYMMDD

  // 온라인 분석 폼
  rrnFront?: string;       // YYMMDD
  rrnBack?: string;        // 7자리
  gender?: '남' | '여';
};

const { GH_TOKEN, GH_REPO_FULLNAME } = process.env;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  const body = req.body as SubmitBody;

  const type = body.type;
  const site = body.site || 'teeth';
  const name = body.name || '';
  const phone = body.phone || '';
  const gender = body.gender;

  if (!type || (type !== 'phone' && type !== 'online')) {
    return res.status(400).json({ ok: false, error: 'Invalid type' });
  }

  // ① 전화상담: birth(YYMMDD)
  const birth6 = type === 'phone' ? (body.birth || '') : (body.rrnFront || '');

  // ② 온라인분석: rrnFront + rrnBack → 900101-1234567
  const rrnFull =
    type === 'online' && body.rrnFront && body.rrnBack
      ? `${body.rrnFront}-${body.rrnBack}`
      : '';

  // 제목은 개인정보 노출 줄이기 위해 마스킹(엑셀은 풀로 보냄 — 아래 export.ts에서)
  const masked = rrnFull ? `${rrnFull.slice(0, 8)}******` : (birth6 ? `${birth6}-*******` : '생년월일 미입력');
  const requestKo = type === 'phone' ? '전화' : '온라인';
  const title = `[${requestKo}] ${name || '이름 미입력'} / ${gender || '성별 미선택'} / ${masked}`;

  // 깃허브 라벨
  const labels = [`type:${type}`, `site:${site}`];

  // 원본 페이로드(엑셀은 여기 값을 씀)
  const payload = {
    site,
    type,
    name,
    phone,
    gender,
    birth6,     // 전화상담 생년월일(또는 온라인의 앞6)
    rrnFull,    // 온라인분석 주민번호 13자리(하이픈 포함)
    requestedAt: new Date().toISOString(),
    ua: (req.headers['user-agent'] || '').toString().slice(0, 200),
    ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString(),
  };

  const bodyMd = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';

  try {
    const resp = await fetchWithTimeout(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body: bodyMd, labels }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: 'GitHub error', detail: text });
    }

    const issue = await resp.json();
    return res.status(200).json({ ok: true, number: issue.number });
  } catch (e: any) {
    if (e?.name === 'AbortError') return res.status(504).json({ ok: false, error: 'Gateway Timeout from GitHub API' });
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: e?.message || String(e) });
  }
}
