import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// --- 유틸리티 함수들 ---
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
  // Vercel 서버 시간과 한국 시간의 시차를 직접 계산하지 않고,
  // new Date()가 ISO 문자열을 UTC로 올바르게 해석하도록 신뢰합니다.
  const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
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
      
      // --- 이 부분이 수정되었습니다 ---
      let birthOrRrn = '';
      if (type === 'online') {
        // 온라인 분석: rrnFront와 rrnBack을 조합
        const front = payload.rrnFront || '';
        const back = payload.rrnBack || '';
        if (front && back) {
          birthOrRrn = `${front}-${back.charAt(0)}******`;
        }
      } else if (type === 'phone') {
        // 전화 상담: birth 값을 사용
        birthOrRrn = payload.birth || '';
      }

      let phone = payload.phone || '';
      if (phone && phone.startsWith('010') && !phone.startsWith('010-')) {
          phone = `010-${phone.slice(3)}`;
      }
      // --- 여기까지 수정되었습니다 ---

      return {
        site: site,
        requested_at: toKST(payload.requestedAt || it.created_at),
        request_type: type === 'online' ? '온라인분석' : '전화상담',
        name: payload.name || '',
        birth_or_rrn: birthOrRrn,
        gender: payload.gender || '',
        phone: phone,
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