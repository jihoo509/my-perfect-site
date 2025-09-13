import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// --- 유틸리티 함수들 (변경 없음) ---
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

function toKST(isoString: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().replace('T', ' ').slice(0, 19);
}

function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch { return {}; }
  }
  return {};
}

function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return BOM + rows.map(r => r.map(esc).join(',')).join('\n');
}

// --- 메인 핸들러 ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase();
  const wantDownload = ['1', 'true'].includes(String(req.query.download || '').toLowerCase());

  try {
    const apiUrl = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=100&sort=created&direction=desc`;
    const gh = await fetchWithTimeout(apiUrl, {
      headers: { 'Authorization': `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' },
    });

    if (!gh.ok) {
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error' });
    }

    const issues = (await gh.json()) as any[];

    const items = issues.map(it => {
      const payload = parsePayloadFromBody(it.body) as any;
      const site = pickLabel(it.labels, 'site:') || payload.site || 'N/A';
      const type = pickLabel(it.labels, 'type:') || payload.type;
      
      const birthOrRrn = payload.rrnFull 
        ? payload.rrnFull 
        : (payload.rrnFront ? `${payload.rrnFront}-${payload.rrnBack}` : (payload.birth || payload.birth6)) || '';

      return {        
        // 공통 정보
        site: site,
        requested_at: toKST(payload.requestedAt || it.created_at),
        request_type: type === 'online' ? '온라인분석' : '전화상담',
        name: payload.name || '',
        phone: payload.phone || '',
        
        // 사람 정보 (모든 사이트 공통)
        birth_or_rrn: birthOrRrn,
        gender: payload.gender || '',
        notes: payload.notes || '', // ✨ 1. '문의사항' 데이터를 추출합니다.
        
        // 후유장해 정보
        surgery_date: payload.surgeryDate || '',
        diagnosis: payload.diagnosis || '',
        
        // 반려동물 정보
        pet_breed: payload.petBreed || '',
        pet_name: payload.petName || '',
        pet_gender: payload.petGender || '',
        pet_birth_date: payload.petBirthDate || '',
        pet_reg_number: payload.petRegNumber || '',
        pet_neutered: payload.petNeutered || '',

        // 경정청구 & 정책자금 정보
        company_name: payload.companyName || '',
        business_number: payload.businessNumber || '',
        is_first_startup: payload.isFirstStartup || '',
        has_past_claim: payload.hasPastClaim || '', 
        existing_loan_status: payload.existingLoanStatus || '',
        is_loan_overdue: payload.isLoanOverdue || '',
        has_applied_for_policy_fund: payload.hasAppliedForPolicyFund || '',

        // ✨ UTM 정보 추가
        utm_source: payload.utm_source || '',
        utm_medium: payload.utm_medium || '',
        utm_campaign: payload.utm_campaign || '',
        utm_content: payload.utm_content || '',
        utm_term: payload.utm_term || '',
        landing_page: payload.landing_page || '',
        referrer: payload.referrer || '',
        first_utm: payload.first_utm || '',
        last_utm: payload.last_utm || '',
      };
    });

if (format === 'csv') {
  // ✅ UTM 5개 컬럼을 가장 앞으로 이동
  const header = [
    // --- UTM 5개 (맨 앞) ---
    '유입소스', '유입매체', '캠페인', '콘텐츠', '키워드',

    // --- 기존 공통 정보 ---
    '사이트', '신청시간', '신청종류', '이름', '전화번호',
    '생년월일(주민번호)', '성별', '문의사항', // ✨ 2. '성별' 뒤에 헤더 추가

    // --- 도메인별 추가 정보(그대로 유지) ---
    '수술시점', '진단명',
    '반려동물 품종', '반려동물 이름', '반려동물 성별', '반려동물 생년월일', '동물등록번호', '중성화 여부',
    '사업자명', '사업자번호', '최초 창업', '과거 경정청구',
    '기대출 현황', '기대출 연체', '정책자금 신청',

    // --- 나머지 UTM 보조 필드(원하시면 이들도 앞으로 땡길 수 있어요) ---
    '최초방문페이지', '이전페이지', '최초UTM', '최종UTM',
  ];

  const rows = [header, ...items.map(r => [
    // --- UTM 5개 (맨 앞) ---
    r.utm_source, r.utm_medium, r.utm_campaign, r.utm_content, r.utm_term,

    // --- 기존 공통 정보 ---
    r.site, r.requested_at, r.request_type, r.name, r.phone,
    r.birth_or_rrn, r.gender, r.notes, // ✨ 3. '성별' 데이터 뒤에 '문의사항' 데이터 추가

    // --- 도메인별 추가 정보(그대로 유지) ---
    r.surgery_date, r.diagnosis,
    r.pet_breed, r.pet_name, r.pet_gender, r.pet_birth_date, r.pet_reg_number, r.pet_neutered,
    r.company_name, r.business_number, r.is_first_startup, r.has_past_claim,
    r.existing_loan_status, r.is_loan_overdue, r.has_applied_for_policy_fund,

    // --- 나머지 UTM 보조 필드 ---
    r.landing_page, r.referrer, r.first_utm, r.last_utm,
  ])];

  const csv = toCSV(rows);
  const filename = `leads-ALL-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  if (wantDownload) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  return res.status(200).send(csv);
}
    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message });
  }
}
