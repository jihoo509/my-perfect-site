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
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().replace('T', ' ').slice(0, 19);
}

function parsePayloadFromBody(body?: string) {
  if (!body) return {} as any;

  // 1) ```json 또는 ``` 뒤에 CR/LF 어떤 줄바꿈이 와도 매치
  const fence = /```(?:json)?\r?\n([\s\S]*?)\r?\n```/i;
  const m = fence.exec(body);
  if (m && m[1]) {
    try {
      return JSON.parse(m[1]);
    } catch { /* ignore */ }
  }

  // 2) 백틱 펜스가 비표준일 때를 대비한 백업 파서: 첫 { ... } 블록 파싱
  const s = body.indexOf('{');
  const e = body.lastIndexOf('}');
  if (s >= 0 && e > s) {
    try {
      return JSON.parse(body.slice(s, e + 1));
    } catch { /* ignore */ }
  }

  return {} as any;
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

      // --- 여기가 생년월일/주민번호 문제를 해결하는 핵심 로직입니다 ---
      let birthOrRrn = '';
      if (type === 'online') {
        // 온라인 분석: rrnFront와 rrnBack 필드를 찾아서 조합합니다.
        const front = payload.rrnFront || '';
        const back = payload.rrnBack || '';
        if (front && back) {
          birthOrRrn = `${front}-${back.charAt(0)}******`;
        } else {
          birthOrRrn = front;
        }
      } else if (type === 'phone') {
        // 전화 상담: birth 필드를 찾아서 사용합니다.
        birthOrRrn = payload.birth || '';
      }
      // --- 여기까지 수정되었습니다 ---

      return {
        site: site,
        requested_at: toKST(payload.requestedAt || it.created_at),
        request_type: type === 'online' ? '온라인분석' : '전화상담',
        name: payload.name || '',
        birth_or_rrn: birthOrRrn,
        gender: payload.gender || '',
        phone: payload.phone || '',
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