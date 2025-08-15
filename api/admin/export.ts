// api/admin/export.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

function ensureAdmin(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token || token !== ADMIN_TOKEN) {
    return false;
  }
  return true;
}

function pickLabel(labels: any[], prefix: string) {
  const hit = labels?.find((l: any) => typeof l.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  // ```json ... ``` 사이 JSON 추출
  const start = body.indexOf('```');
  const end = body.lastIndexOf('```');
  if (start >= 0 && end > start) {
    const inside = body.slice(start + 3, end).trim();
    // inside 가 "json\n{...}" 형태일 수도 있음
    const jsonStart = inside.indexOf('{');
    const jsonEnd = inside.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(inside.slice(jsonStart, jsonEnd + 1));
      } catch {}
    }
  }
  return {};
}

function toCSV(rows: string[][]) {
  // 한글 깨짐 방지 BOM
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  return BOM + csv;
}

export default async function handler(req: Request) {
  if (!ensureAdmin(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(req.url);
  const format = (url.searchParams.get('format') || 'json').toLowerCase(); // json|csv
  const dl = url.searchParams.get('download') === '1';

  // 선택: 필터 값
  const siteFilter = url.searchParams.get('site') || '';   // e.g. teeth
  const typeFilter = url.searchParams.get('type') || '';   // phone|online

  // 이슈 목록 가져오기 (최대 100)
  const gh = await fetch(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!gh.ok) {
    const text = await gh.text();
    return new Response(JSON.stringify({ ok: false, error: 'GitHub fetch failed', detail: text }), { status: 500 });
  }
  const issues = await gh.json();

  const items = (issues as any[]).map(it => {
    const site = pickLabel(it.labels, 'site:');
    const type = pickLabel(it.labels, 'type:');
    const payload = parsePayloadFromBody(it.body);

    return {
      number: it.number,
      title: it.title,
      created_at: it.created_at,
      site,
      type,
      name: payload.name || '',
      phone: payload.phone || '',
      birth: payload.birth || '',
      labels: Array.isArray(it.labels) ? it.labels.map((l: any) => l.name) : [],
      payload,
    };
  }).filter(row => {
    if (siteFilter && row.site !== siteFilter) return false;
    if (typeFilter && row.type !== typeFilter) return false;
    return true;
  });

  if (format === 'csv') {
    const header = ['number', 'title', 'created_at', 'site', 'type', 'name', 'phone', 'birth'];
    const rows = [header, ...items.map(r => [
      String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth,
    ])];
    const csv = toCSV(rows);
    const filename = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        ...(dl ? { 'Content-Disposition': `attachment; filename="${filename}"` } : {}),
      },
    });
  }

  // 기본(JSON)
  return new Response(JSON.stringify({ ok: true, count: items.length, items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
