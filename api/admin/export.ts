// /api/admin/export.ts
export const runtime = 'nodejs';

type Issue = {
  number: number;
  html_url: string;
  created_at: string;
  body?: string;
  labels?: { name?: string }[];
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function csvEscape(val: string) {
  const v = (val ?? '').toString();
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function parseBody(body: string | undefined) {
  const map = new Map<string, string>();
  if (!body) return { map, birthFirst: '', birthSecond: '' };

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    const i = line.indexOf(':');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const val = line.slice(i + 1).trim();
    map.set(key, val);
  }

  // Birth: 900101-1****** 형태 분리
  const birth = map.get('birth') || '';
  let birthFirst = '', birthSecond = '';
  const m = birth.match(/^(\S+)\s*-\s*(\S+)/);
  if (m) {
    birthFirst = m[1] ?? '';
    birthSecond = m[2] ?? '';
  }
  return { map, birthFirst, birthSecond };
}

function toUtcStart(s?: string | null) {
  if (!s) return undefined;
  const d = new Date(`${s}T00:00:00.000Z`);
  return isNaN(+d) ? undefined : d;
}
function toUtcEnd(s?: string | null) {
  if (!s) return undefined;
  const d = new Date(`${s}T23:59:59.999Z`);
  return isNaN(+d) ? undefined : d;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors } });
  }
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { ...cors } });
  }

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO = process.env.GH_REPO_FULLNAME;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

  if (!GH_TOKEN || !REPO || !ADMIN_TOKEN) {
    return new Response('Missing env', { status: 500, headers: { ...cors } });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  if (token !== ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401, headers: { ...cors } });
  }

  const site = (url.searchParams.get('site') || '').trim().toLowerCase(); // e.g. teeth
  const type = (url.searchParams.get('type') || '').trim().toLowerCase(); // e.g. online/phone
  const from = toUtcStart(url.searchParams.get('from'));
  const to = toUtcEnd(url.searchParams.get('to'));

  // GitHub Issues 조회 (라벨 필터는 API 파라미터로 먼저 거르고, 날짜 상한(to)은 코드에서 2차 필터)
  const labels: string[] = [];
  if (site) labels.push(`site:${site}`);
  if (type) labels.push(`type:${type}`);
  const labelsParam = labels.length ? `&labels=${encodeURIComponent(labels.join(','))}` : '';

  let page = 1;
  const all: Issue[] = [];
  while (true) {
    const gh = await fetch(
      `https://api.github.com/repos/${REPO}/issues?state=all&sort=created&direction=desc&per_page=100&page=${page}${labelsParam}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lead-inbox',
        },
      },
    );
    if (!gh.ok) {
      const txt = await gh.text();
      return new Response(`GitHub API error: ${txt}`, { status: 500, headers: { ...cors } });
    }
    const batch = (await gh.json()) as Issue[];
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
    page++;
    if (page > 50) break; // 안전장치(최대 5,000개)
  }

  // 날짜 필터(UTC 기준, from/to 포함)
  const filtered = all.filter((it) => {
    const created = new Date(it.created_at);
    if (from && created < from) return false;
    if (to && created > to) return false;
    return true;
  });

  // CSV 만들기
  const rows: string[] = [];
  rows.push([
    'created_at(UTC)',
    'site',
    'type',
    'name',
    'gender',
    'birth_first',
    'birth_second',
    'phone',
    'issue_number',
    'issue_url',
  ].join(','));

  for (const it of filtered) {
    // 라벨에서 site/type 우선 추출(없으면 본문에서 보조 추출)
    const labelNames = (it.labels || []).map((l) => (l.name || '').toLowerCase());
    const labelSite = (labelNames.find((l) => l.startsWith('site:')) || '').split(':')[1] || '';
    const labelType = (labelNames.find((l) => l.startsWith('type:')) || '').split(':')[1] || '';

    const { map, birthFirst, birthSecond } = parseBody(it.body);
    const siteVal = labelSite || (map.get('site') || '');
    const typeVal = labelType || (map.get('type') || '');

    const name = map.get('name') || '';
    const gender = map.get('gender') || '';
    const phone = map.get('phone') || '';

    rows.push([
      csvEscape(it.created_at),
      csvEscape(siteVal),
      csvEscape(typeVal),
      csvEscape(name),
      csvEscape(gender),
      csvEscape(birthFirst),
      csvEscape(birthSecond),
      csvEscape(phone),
      csvEscape(String(it.number)),
      csvEscape(it.html_url),
    ].join(','));
  }

  const csv = '\uFEFF' + rows.join('\n'); // BOM 추가(엑셀 한글 깨짐 방지)
  const filename = `export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
