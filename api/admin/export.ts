import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// --- 유틸리티 함수들 ---

// 타임아웃 기능이 포함된 fetch
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// GitHub 라벨에서 특정 접두사를 가진 값 추출
function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

// --- 여기가 핵심: UTC 시간을 한국 시간(KST)으로 변환하는 함수 ---
function toKST(isoString: string) {
  const date = new Date(isoString);
  // 한국 시간은 UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  
  // YYYY-MM-DD HH:mm:ss 형식으로 맞춤
  return kstDate.toISOString().replace('T', ' ').slice(0, 19);
}
// -----------------------------------------------------------

// 이슈 본문에서 JSON 데이터 파싱
function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return {};
    }
  }
  return {};
}

// CSV 형식으로 변환
function toCSV(rows: string[][]) {
  const BOM = '\uFEFF'; // 엑셀 한글 깨짐 방지
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(esc).join(',')).join('\n');
  return BOM + csv;
}

// --- 메인 핸들러 ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase();
  const download = String(req.query.download || '');
  const wantDownload = download === '1' || download === 'true';

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
      const site = pickLabel(it.labels, 'site:');
      const payload = parsePayloadFromBody(it.body);
      
      // requested_at 값을 toKST 함수로 변환
      const requestedAt = payload.requestedAt ? toKST(payload.requestedAt) : toKST(it.created_at);

      return {
        site: site || payload.site,
        requested_at: requestedAt,
        request_type: payload.type === 'online' ? '온라인분석' : '전화상담',
        name: payload.name,
        birth_or_rrn: payload.rrnFull ? `${payload.rrnFront}-${payload.rrnBack.charAt(0)}******` : payload.birth6,
        gender: payload.gender,
        phone: payload.phone,
      };
    });

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

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message });
  }
}