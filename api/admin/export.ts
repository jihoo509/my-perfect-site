// api/admin/export.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

/** 절대 URL 생성 */
function getUrl(req: Request) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(req.url, `${proto}://${host}`);
}

/** 관리자 토큰 검증 */
function ensureAdmin(req: Request) {
  const url = getUrl(req);
  const token = url.searchParams.get('token');
  return Boolean(token && token === ADMIN_TOKEN);
}

/** labels에서 접두사값 추출 */
function pickLabel(labels: any[], prefix: string) {
  const hit = labels?.find((l: any) => typeof l.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

/** 이슈 body의 ```json ... ``` 블록 파싱 */
function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const start = body.indexOf('```');
  const end = body.lastIndexOf('```');
  if (start >= 0 && end > start) {
    const inside = body.slice(start + 3, end).trim();
    const jsonStart = inside.indexOf('{');
    const jsonEnd = inside.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try { return JSON.parse(inside.slice(jsonStart, jsonEnd + 1)); } catch {}
    }
  }
  return {};
}

/** CSV (BOM 포함) */
function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  return BOM + csv;
}

/** 수동 타임아웃 fetch (8초) */
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: Request) {
  try {
    if (!ensureAdmin(req)) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = getUrl(req);

    // ❶ 초고속 진단: 외부 호출 전 즉시 리턴
    if ((url.searchParams.get('probe') || '') === '1') {
      return new Response(JSON.stringify({ ok: true, probe: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ❷ 오프라인 모의 데이터 모드(네트워크 우회) : dry=1
    if ((url.searchParams.get('dry') || '') === '1') {
      const demo = [
        { number: 1, title: '[전화] 홍길동 900101-1******', created_at: new Date().toISOString(), site: 'teeth', type: 'phone', name: '홍길동', phone: '010-1234-5678', birth: '900101' },
      ];
      const format = (url.searchParams.get('format') || 'json').toLowerCase();
      const downloadFlag = (url.searchParams.get('download') || '').toLowerCase();
      const dl = ['1','true','yes'].includes(downloadFlag);
      if (format === 'csv') {
        const header = ['number','title','created_at','site','type','name','phone','birth'];
        const rows = [header, ...demo.map(r => [String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth])];
        const csv = toCSV(rows);
        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            ...(dl ? { 'Content-Disposition': `attachment; filename="leads-demo.csv"` } : {}),
          },
        });
      }
      return new Response(JSON.stringify({ ok: true, count: demo.length, items: demo }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const format = (url.searchParams.get('format') || 'json').toLowerCase(); // json|csv
    const downloadFlag = (url.searchParams.get('download') || '').toLowerCase();
    const dl = ['1','true','yes'].includes(downloadFlag);

    const siteFilter = url.searchParams.get('site') || '';
    const typeFilter = url.searchParams.get('type') || '';

    // GitHub Issues 가져오기 (수동 8초 타임아웃 + UA)
    const ghRes = await fetchWithTimeout(
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lead-inbox-export/1.1'
        },
        cache: 'no-store',
      },
      8000
    );

    if (!ghRes.ok) {
      const text = await ghRes.text().catch(()=>'');
      return new Response(JSON.stringify({ ok: false, error: 'GitHub fetch failed', detail: text || ghRes.statusText }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const issues = (await ghRes.json()) as any[];

    const items = issues
      .map((it) => {
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
      })
      .filter((row) => {
        if (siteFilter && row.site !== siteFilter) return false;
        if (typeFilter && row.type !== typeFilter) return false;
        return true;
      });

    if (format === 'csv') {
      const header = ['number','title','created_at','site','type','name','phone','birth'];
      const rows = [header, ...items.map(r => [String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth])];
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

    return new Response(JSON.stringify({ ok: true, count: items.length, items }), {
      status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal error',
      detail: err?.message ?? String(err),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
