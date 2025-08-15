// api/submit.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;
  name?: string;
  phone?: string;
  gender?: '남' | '여';

  // phone 전용
  birth?: string; // YYMMDD 또는 YYYYMMDD

  // online 전용
  rrnFront?: string; // 6자리
  rrnBack?: string;  // 7자리(받아도 본문에는 마스킹해서 저장)
};

const { GH_TOKEN, GH_REPO_FULLNAME } = process.env;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// 숫자만, 길이 제한
const onlyDigits = (v = '') => String(v).replace(/\D/g, '');
const cut = (v = '', n: number) => v.slice(0, n);

function maskRrn(front?: string, back?: string) {
  const f = cut(onlyDigits(front), 6);   // 6
  const b = cut(onlyDigits(back), 7);    // 7
  if (f.length < 6) return '';
  const head = b ? b.charAt(0) : '';     // 성별/세대 첫 글자
  return `${f}-${head ? head + '******' : '*******'}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 필드가 body(JSON)로 오게 확정 (프론트는 POST JSON)
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  const body = (req.body || {}) as SubmitBody;
  const {
    type,
    site = 'teeth',
    name = '',
    phone = '',
    gender,
    birth,          // phone
    rrnFront,       // online
    rrnBack,        // online
  } = body;

  if (!type || !['phone', 'online'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid type' });
  }

  // 화면용 표시값
  const masked =
    type === 'online'
      ? maskRrn(rrnFront, rrnBack)
      : onlyDigits(birth);

  const title = `[${type === 'phone' ? '전화' : '온라인'}] ${name || '이름 미입력'} / ${gender || '성별 미선택'} / ${masked || '생년/주민 미입력'}`;

  // 이슈 라벨
  const labels = [`type:${type}`, `site:${site}`];

  // GitHub 본문: 민감한 값은 마스킹만 저장(뒤 7자리 전체 저장 금지)
  const payload = {
    site, type, name, phone, gender,
    // phone
    birth: onlyDigits(birth),
    // online
    rrnFront: cut(onlyDigits(rrnFront), 6),
    rrnBackMasked: rrnBack ? (cut(onlyDigits(rrnBack), 1) + '******') : undefined,
    // 공통
    birthOrRrnMasked: masked,
    ua: (req.headers['user-agent'] || '').toString().slice(0, 200),
    ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString(),
    createdAt: new Date().toISOString(),
  };
  const issueBody = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';

  try {
    const resp = await fetchWithTimeout(
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GH_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // 일부 네트워크에서 필요한 경우가 있어 User-Agent 지정
          'User-Agent': 'vercel-submit-function',
        },
        body: JSON.stringify({ title, body: issueBody, labels }),
      },
      15000
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: 'GitHub error', detail: text });
    }

    const issue = await resp.json();
    return res.status(200).json({ ok: true, number: issue.number });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout from GitHub API' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: error?.message || String(error) });
  }
}
