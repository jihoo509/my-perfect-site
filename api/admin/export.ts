import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// ---------- utils ----------
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] | undefined, prefix: string) {
  const arr = Array.isArray(labels) ? labels : [];
  const hit = arr.find(l => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

// 한국 시간 변환 함수
function toKST(isoString: string) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(date.getTime() + kstOffset);
    return kstDate.toISOString().replace('T', ' ').slice(0, 19);
}

function parsePayloadFromBody(body?: string) {
  if (!body || typeof body !== 'string') return {};
  const block = body.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (block?.[1]) {
    const js = block[1].match(/{[\s\S]*}/);
    if (js) {
      try { return JSON.parse(js[0]); } catch {}
    }
  }
  const raw = body.match(/{[\s\S]*}/);
  if (raw) {
    try { return JSON.parse(raw[0]); } catch {}
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
// ---------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = String(req.query.token || '');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase();
  const wantDownload = ['1', 'true', 'yes'].includes(String(req.query.download || '').toLowerCase());

  try {
    const url = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=100&sort=created&direction=desc`;
    const gh = await fetchWithTimeout(url, {
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!gh.ok) {
      const text = await gh.text().catch(() => '');
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error', detail: text });
    }

    const issues = (await gh.json()) as any[];

    const items = issues.map((it) => {
      const payload: any = parsePayloadFromBody(it.body);

      const site = pickLabel(it.labels, 'site:') || payload.site || '';
      const type = pickLabel(it.labels, 'type:') || payload.type || '';
      const request_type = type === 'online' ? '온라인분석' : (type === 'phone' ? '전화상담' : '');

      const requested_at = toKST(payload.requestedAt || it.created_at || '');
      const name = payload.name || '';

      // --- 여기가 생년월일/주민번호 문제를 해결하는 핵심 로직입니다 ---
      let birth_or_rrn = '';
      if (type === 'online' && payload.rrnFront) {
        const back = payload.rrnBack || '';
        birth_or_rrn = `${payload.rrnFront}-${back ? `${back.charAt(0)}******` : ''}`;
      } else if (type === 'phone' && payload.birth) {
        birth_or_rrn = payload.birth;
      }
      // --- 여기까지 수정되었습니다 ---

      const gender = payload.gender || '';
      const phone = payload.phone || '';

      return { site, requested_at, request_type, name, birth_or_rrn, gender, phone };
    });

    if (format === 'csv') {
      const header = ['site', 'requested_at', 'request_type', 'name', 'birth_or_rrn', 'gender', 'phone'];
      const rows = [header, ...items.map(r => [
        r.site, r.requested_at, r.request_type, r.name, r.birth_or_rrn, r.gender, r.phone,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0,10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: e?.message });
  }
}