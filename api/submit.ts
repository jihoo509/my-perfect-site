// api/submit.ts
export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;              // 폼에서 넘겨줌 (없으면 fallback)
  name?: string;
  phone?: string;             // 010-xxxx-xxxx 형태 권장
  birth?: string;             // YYMMDD (앞 6자리만)
  gender?: '남' | '여';
};

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!; // e.g. "jihoo509/lead-inbox"

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), { status: 405 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const {
    type,
    site = 'teeth', // 없으면 임시 기본값
    name = '',
    phone = '',
    birth = '',
    gender,
  } = body;

  if (!type || !['phone', 'online'].includes(type)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid type' }), { status: 400 });
  }

  // 제목(마스킹)
  const maskedBirth = birth ? `${birth?.slice(0, 6)}-*******` : '';
  const title = type === 'phone'
    ? `[전화] ${name || ''} ${gender || ''} ${maskedBirth}`
    : `[온라인] ${name || ''} ${gender || ''} ${maskedBirth}`;

  // GitHub Issue 라벨
  const labels = [`type:${type}`, `site:${site}`];

  // 원본 데이터(JSON)를 본문에 저장 (백틱 코드블록)
  const payload = {
    site, type, name, phone, birth, gender,
    ua: (req.headers.get('user-agent') || '').slice(0, 200),
    createdAt: new Date().toISOString(),
  };
  const issueBody = '```json\n' + JSON.stringify(payload) + '\n```';

  // GitHub Issue 생성
  const resp = await fetch(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(JSON.stringify({ ok: false, error: 'GitHub error', detail: text }), { status: 500 });
  }

  const issue = await resp.json();
  return new Response(JSON.stringify({ ok: true, number: issue.number }), { status: 200 });
}
