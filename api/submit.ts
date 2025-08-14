// /api/submit.ts
export const runtime = 'nodejs'; // Vercel Node 런타임 사용 (ESM)

type Payload = {
  type?: 'online' | 'phone' | string;
  name?: string;
  gender?: string;
  birthDateFirst?: string;
  birthDateSecond?: string;
  phoneNumber?: string; // 8자리
  site?: string;        // 선택: 폼/쿼리로 넘길 때
};

const json = { 'Content-Type': 'application/json' };
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const subdomainOf = (host: string) => {
  if (!host) return '';
  const parts = host.split('.');
  return parts.length > 2 ? parts[0] : ''; // aaa.domain.com -> aaa
};

export default async function handler(req: Request): Promise<Response> {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors } });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...json, ...cors },
    });
  }

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO_FULLNAME; // 예: jihoo509/lead-inbox
  if (!GH_TOKEN || !REPO) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing env (GH_TOKEN/REPO)' }), {
      status: 500,
      headers: { ...json, ...cors },
    });
  }

  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const referer = req.headers.get('referer') || '';
  const ua = req.headers.get('user-agent') || '';

  const body = (await req.json().catch(() => ({}))) as Payload;

  // ① body.site → ② ?site= → ③ 현재 호스트의 서브도메인 → ④ referrer 서브도메인 → ⑤ unknown
  let site =
    (body.site || '').toString().trim().toLowerCase() ||
    (url.searchParams.get('site') || '').toString().trim().toLowerCase() ||
    subdomainOf(host).toLowerCase() ||
    (referer ? subdomainOf(new URL(referer).hostname) : '') ||
    'unknown';

  const type = (body.type || 'unknown').toString().toLowerCase();

  // GitHub 이슈 제목/본문
  const title = `[${type}] ${body.name || '무기명'} (${site})`;
  const md = [
    `Name: ${body.name ?? ''}`,
    `Gender: ${body.gender ?? ''}`,
    `Birth: ${(body.birthDateFirst ?? '')}-${(body.birthDateSecond ?? '')}`,
    `Phone: 010-${body.phoneNumber ?? ''}`,
    `Site: ${site}`,
    `Type: ${type}`,
    `Host: ${host}`,
    `Ref: ${referer}`,
    `UA: ${ua}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n');

  // 라벨에 type, site 둘 다 붙임
  const labels = [`type:${type}`, `site:${site}`];

  const ghRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'lead-inbox',
    },
    body: JSON.stringify({ title, body: md, labels }),
  });

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    return new Response(
      JSON.stringify({ ok: false, error: 'GitHub API error', details: errText }),
      { status: 500, headers: { ...json, ...cors } },
    );
  }

  const issue = await ghRes.json();
  return new Response(
    JSON.stringify({
      ok: true,
      site,
      type,
      issue: { number: issue.number, url: issue.html_url },
    }),
    { status: 200, headers: { ...json, ...cors } },
  );
}
