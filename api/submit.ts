import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;
  name?: string;
  phone?: string;
  birth?: string;
  gender?: '남' | '여';
};

const { GH_TOKEN, GH_REPO_FULLNAME } = process.env;

// 타임아웃 기능이 포함된 fetch 함수
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  // Vercel 환경에서는 req.body를 바로 사용합니다.
  const body: SubmitBody = req.body;

  const {
    type,
    site = 'teeth', // 없으면 임시 기본값
    name = '',
    phone = '',
    birth = '',
    gender,
  } = body;

  if (!type || !['phone', 'online'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'Invalid type' });
  }

  // 제목(마스킹)
  const maskedBirth = birth ? `${birth.slice(0, 6)}-*******` : '생년월일 미입력';
  const title = `[${type === 'phone' ? '전화' : '온라인'}] ${name || '이름 미입력'} / ${gender || '성별 미선택'} / ${maskedBirth}`;

  // GitHub Issue 라벨
  const labels = [`type:${type}`, `site:${site}`];

  // 원본 데이터(JSON)를 본문에 저장 (백틱 코드블록)
  const payload = {
    site, type, name, phone, birth, gender,
    ua: (req.headers['user-agent'] || '').slice(0, 200),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    createdAt: new Date().toISOString(),
  };
  const issueBody = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';

  try {
    // GitHub Issue 생성 (8초 타임아웃 적용)
    const resp = await fetchWithTimeout(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title,
        body: issueBody,
        labels,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: 'GitHub error', detail: text });
    }

    const issue = await resp.json();
    return res.status(200).json({ ok: true, number: issue.number });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout from GitHub API' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: error.message });
  }
}