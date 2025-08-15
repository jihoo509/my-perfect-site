import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

/* ---------------------- utils ---------------------- */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

const KST = 9 * 60; // minutes
function toKST(iso: string) {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset(); // minutes
  const kstMs = d.getTime() + (tz + KST) * 60_000;
  const k = new Date(kstMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${k.getFullYear()}-${pad(k.getMonth() + 1)}-${pad(k.getDate())} ${pad(k.getHours())}:${pad(k.getMinutes())}:${pad(k.getSeconds())}`;
}

function onlyDigits(s: string | undefined) {
  return (s || '').replace(/\D/g, '');
}

function normalizePhone(a?: string, b?: string) {
  const digits = onlyDigits([a, b].filter(Boolean).join(''));
  if (!digits) return '';
  // 앞자리가 0으로 시작해도 보존되도록 CSV용 포맷
  return `="${digits}"`;
}

function normalizeBirthOrRRN(v?: string) {
  const d = onlyDigits(v);
  if (!d) return { birth: '', rrnMasked: '' };

  // 13자리(주민번호) → 앞6 + -******* , 성별코드 추출
  if (/^\d{13}$/.test(d)) {
    return {
      birth: d.slice(0, 6),
      rrnMasked: `${d.slice(0, 6)}-*******`,
      genderFromRRN: d[6],
    } as any;
  }
  // 하이픈 없이 붙은 주민번호류(>=12자리)
  if (d.length >= 12) {
    return {
      birth: d.slice(0, 6),
      rrnMasked: `${d.slice(0, 6)}-*******`,
      genderFromRRN: d[6],
    } as any;
  }
  // YYYYMMDD(8) 또는 YYMMDD(6)
  if (/^\d{8}$/.test(d) || /^\d{6}$/.test(d)) {
    return { birth: d, rrnMasked: '' };
  }
  return { birth: '', rrnMasked: '' };
}

function koGender(val?: string, genderFromRRN?: string) {
  const v = (val || '').toLowerCase();
  if (/(남|male|m)\b/.test(v)) return '남';
  if (/(여|female|f)\b/.test(v)) return '여';
  // 주민번호 뒷자리 첫 숫자: 1,3,5,7 → 남 / 2,4,6,8 → 여
  if (genderFromRRN) {
    return '1357'.includes(genderFromRRN) ? '남' : '여';
  }
  return '';
}

/**
 * 본문에서 폼 데이터 파싱
 * - ``` ``` 안 JSON 우선
 * - 실패 시 "키: 값" 라인 스캔 (국문/영문 키 혼용)
 * - 온라인분석(주민번호) vs 전화상담(생년월일) 자동 구분
 */
function parsePayloadFromBody(body?: string) {
  const out: any = {};
  if (!body) return out;

  // 1) fenced JSON 우선
  const s = body.indexOf('```');
  const e = body.lastIndexOf('```');
  if (s >= 0 && e > s) {
    const inside = body.slice(s + 3, e).trim();
    const js = inside.indexOf('{');
    const je = inside.lastIndexOf('}');
    if (js >= 0 && je > js) {
      try {
        const j = JSON.parse(inside.slice(js, je + 1));
        // 직관적인 키 동기화
        const name  = j.name ?? j.이름 ?? '';
        const phone = j.phone ?? j.전화 ?? j.연락처 ?? '';
        const birthRaw =
          j.birth ?? j.birthDate ?? j.생년월일 ?? j.주민번호 ?? j.주민등록번호 ?? '';
        const rrnBack = j.주민번호뒷자리 ?? j.뒷7자리 ?? '';

        const { birth, rrnMasked, genderFromRRN } = normalizeBirthOrRRN(
          String(birthRaw || '') + String(rrnBack || '')
        );
        const gender = koGender(j.gender ?? j.성별, genderFromRRN);

        // 타입 감지
        let type = j.type ?? j.유형 ?? '';
        if (!type) type = rrnMasked ? 'online' : (birth ? 'phone' : '');

        Object.assign(out, { name, phone, birth, rrnMasked, gender, type });
        return out;
      } catch {/* ignore */}
    }
  }

  // 2) "키: 값" 라인 파싱 (국문/영문 키 섞여도 허용)
  const lines = body.split(/\r?\n/);
  const kv: Record<string, string> = {};
  for (const ln of lines) {
    const m = ln.match(/^\s*([^\s:]+)\s*[:：]\s*(.+?)\s*$/);
    if (m) kv[m[1].trim()] = m[2].trim();
  }

  const name  = kv['이름'] ?? kv['name'] ?? '';
  const phone = kv['전화'] ?? kv['연락처'] ?? kv['phone'] ?? '';
  const birthRaw =
    kv['주민번호'] ?? kv['주민등록번호'] ??
    kv['생년월일'] ?? kv['birth'] ?? kv['birthDate'] ?? '';
  const rrnBack = kv['뒷7자리'] ?? kv['주민번호뒷자리'] ?? '';

  const { birth, rrnMasked, genderFromRRN } = normalizeBirthOrRRN(
    String(birthRaw || '') + String(rrnBack || '')
  );
  const gender = koGender(kv['성별'] ?? kv['gender'], genderFromRRN);

  let type = kv['type'] ?? kv['유형'] ?? '';
  if (!type) type = rrnMasked ? 'online' : (birth ? 'phone' : '');

  Object.assign(out, { name, phone, birth, rrnMasked, gender, type });
  return out;
}

function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  return BOM + csv;
}
/* --------------------------------------------------- */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) 관리자 토큰 검사
  const token = req.query.token as string | undefined;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // 2) 쿼리
  const format = String((req.query.format ?? 'json')).toLowerCase(); // 'json' | 'csv'
  const download = String(req.query.download ?? '').toLowerCase();
  const wantDownload = download === '1' || download === 'true';
  const siteFilter = (req.query.site as string) || '';
  const typeFilter = (req.query.type as string) || '';

  try {
    // 3) GitHub Issues 가져오기 (open 100개, 최신순)
    const apiUrl =
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=open&per_page=100&sort=created&direction=desc`;

    const gh = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }, 10000);

    if (!gh.ok) {
      const text = await gh.text().catch(() => '');
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error', detail: text });
    }

    const issues = (await gh.json()) as any[];

    // 4) 가공
    const items = issues.map(it => {
      const site = pickLabel(it.labels, 'site:') || 'teeth';
      const typeRaw = pickLabel(it.labels, 'type:'); // phone | online
      const payload = parsePayloadFromBody(it.body);

      const type = (payload.type || typeRaw || '').toLowerCase();
      const typeKo = type === 'online' ? '온라인분석'
                    : type === 'phone'  ? '전화상담'
                    : (type || '');

      // 전화 국번/나머지 합쳐 입력된 경우도 포괄
      const phoneExcel = normalizePhone(payload.phone);

      // 주민번호 우선, 없으면 생년월일
      const birthOrRRN = payload.rrnMasked || payload.birth || '';

      return {
        site,
        requested_at: toKST(it.created_at), // KST
        request_type: typeKo,
        name: payload.name || '',
        birth_or_rrn: birthOrRRN,
        gender: payload.gender || '',
        phone: phoneExcel,
      };
    }).filter(r => {
      if (siteFilter && r.site !== siteFilter) return false;
      if (typeFilter) {
        const t = typeFilter.toLowerCase();
        if (t === 'phone' && r.request_type !== '전화상담') return false;
        if (t === 'online' && r.request_type !== '온라인분석') return false;
      }
      return true;
    });

    // 5) 응답
    if (format === 'csv') {
      const header = ['site', 'requested_at', 'request_type', 'name', 'birth_or_rrn', 'gender', 'phone'];
      const rows = [header, ...items.map(r => [
        r.site, r.requested_at, r.request_type, r.name, r.birth_or_rrn, r.gender, r.phone,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      return res.status(200).send(csv);
    }

    // 기본: JSON
    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout', detail: 'GitHub call timed out' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message || String(err) });
  }
}
