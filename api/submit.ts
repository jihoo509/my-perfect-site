export const config = { runtime: 'edge' };

const REPO = process.env.GH_REPO_FULLNAME || '';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const {
    name,
    birthDateFirst,
    birthDateSecond,
    gender,
    phoneNumber,
    consultationType = 'phone',
  } = body || {};

  if (!name || !birthDateFirst || !birthDateSecond || !gender || !phoneNumber) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing required fields' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  // 이슈 제목/본문
  const title = `[${consultationType === 'online' ? '온라인' : '전화'}] ${name} ${gender} ${birthDateFirst}-${String(birthDateSecond).at(0) ?? '*'}******`;
  const issueBody = [
    `이름: ${name}`,
    `주민번호: ${birthDateFirst}-${birthDateSecond}`,
    `성별: ${gender}`,
    `전화: 010-${phoneNumber}`,
    `타입: ${consultationType}`,
    `접수시각: ${new Date().toISOString()}`
  ].join('\n');

  // GitHub Issue 생성
  const gh = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: [`type:${consultationType}`],
    }),
  });

  if (!gh.ok) {
    const detail = await gh.text();
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'GitHub API error',
        status: gh.status,
        detail: detail.slice(0, 400),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const data = await gh.json();
  return new Response(
    JSON.stringify({ ok: true, issue: { number: data.number, url: data.html_url } }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}
