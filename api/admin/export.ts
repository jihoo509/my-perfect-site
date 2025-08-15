// api/admin/export.ts
export const config = { runtime: 'nodejs' };

const GH_TOKEN = process.env.GH_TOKEN!;
const GH_REPO_FULLNAME = process.env.GH_REPO_FULLNAME!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

/** 절대 URL 생성 (프록시/미리보기에서도 안전) */
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

/** labels 배열에서 접두사로 값 추출 (예: 'site:teeth' -> 'teeth') */
function pickLabel(labels: any[], prefix: string) {
  const hit = labels?.find((l: any) => typeof l.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

/** ```json ... ``` 코드블록에서 payload 파싱 */
function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const start = body.indexOf('```');
  const end = body.lastIndexOf('```');
  if (start >= 0 && end > start) {
    const inside = body.slice(start + 3, end).trim(); // "json\n{...}" 가능
    const jsonStart = inside.indexOf('{');
    const jsonEnd = inside.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try { return JSON.parse(inside.slice(jsonStart, jsonEnd + 1)); } catch {}
    }
  }
  return {};
}

/** CSV 생성 (BOM 포함 → 엑셀 한글 깨짐 방지) */
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

export default async function handler(req: Request) {
  try {
    if (!ensureAdmin(req)) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = getUrl(req);
    // 디버그 빠른 확인용: probe=1 이면 GH 호출 건너뛴다 (걸림 여부 즉시 체크)
    if ((url.searchParams.get('probe') || '') === '1') {
      return new Response(JSON.stringify({ ok: true, probe: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    const format = (url.searchParams.get('format') || 'json').toLowerCase(); // json|csv
    const downloadFlag = (url.searchParams.get('download') || '').toLowerCase();
    const dl = ['1', 'true', 'yes'].includes(downloadFlag);

    // 선택 필터
    const siteFilter = url.searchParams.get('site') || ''; // e.g. teeth
    const typeFilter = url.searchParams.get('type') || ''; // phone|online

    // GitHub Issues (최대 100) — 타임아웃/UA 추가로 '무한대기' 차단
    const ghRes = await fetch(
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lead-inbox-export/1.0',   // 일부 환경에서 필수
        },
        cache: 'no-store',
        // 8초 타임아웃: 응답 지연 시 바로 에러로 떨어뜨림
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return new Response(JSON.stringify({ ok: false, error: 'GitHub fetch failed', detail: text }), {
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
      const header = ['number', 'title', 'created_at', 'site', 'type', 'name', 'phone', 'birth'];
      const rows = [header, ...items.map(r => [
        String(r.number), r.title, r.created_at, r.site, r.type, r.name, r.phone, r.birth,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
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
      status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

  } catch (err: any) {
    // 타임아웃/네트워크 에러도 여기로 옴
    return new Response(JSON.stringify({
      ok: false,
      error: 'Internal error',
      detail: err?.message ?? String(err),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
