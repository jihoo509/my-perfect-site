import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

/* ---------------------- utils ---------------------- */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
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

function normalizePhone(s?: string) {
  const digits = onlyDigits(s);
  if (!digits) return '';
  return `="${digits}"`; // CSV용 포맷
}

function normalizeBirth(birth?: string) {
    const d = onlyDigits(birth);
    if (d.length === 13) { // 주민번호 전체가 들어온 경우
        return `${d.slice(0, 6)}-${d.charAt(6)}******`;
    }
    if (d.length >= 6) { // 생년월일만 들어온 경우
        return d.slice(0, 6);
    }
    return d;
}

function koGender(val?: string, birth?: string) {
  const v = (val || '').toLowerCase();
  if (/(남|male|m)\b/.test(v)) return '남';
  if (/(여|female|f)\b/.test(v)) return '여';
  
  const d = onlyDigits(birth);
  if (d.length >= 7) {
    const genderDigit = d.charAt(6);
    return '1357'.includes(genderDigit) ? '남' : '여';
  }
  return '';
}

function parsePayloadFromBody(body?: string) {
  const out: any = {};
  if (!body) return out;

  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      const j = JSON.parse(match[1]);
      return {
        name: j.name || '',
        phone: j.phone || '',
        birth: j.birth || '',
        gender: j.gender || '',
        type: j.type || '',
      };
    } catch {}
  }
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
  const token = req.query.token as string | undefined;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String((req.query.format ?? 'json')).toLowerCase();
  const download = String(req.query.download ?? '').toLowerCase();
  const wantDownload = download === '1' || download === 'true';

  try {
    const apiUrl = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=100&sort=created&direction=desc`;
    const gh = await fetchWithTimeout(apiUrl, {
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

    const items = issues.map(it => {
      const site = pickLabel(it.labels, 'site:');
      const typeRaw = pickLabel(it.labels, 'type:');
      const payload = parsePayloadFromBody(it.body);
      
      const type = payload.type || typeRaw;
      const typeKo = type === 'online' ? '온라인분석' : (type === 'phone' ? '전화상담' : type);

      return {
        site,
        requested_at: toKST(it.created_at),
        request_type: typeKo,
        name: payload.name,
        birth_or_rrn: normalizeBirth(payload.birth),
        gender: koGender(payload.gender, payload.birth),
        phone: normalizePhone(payload.phone),
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
    if (err?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Gateway Timeout' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message });
  }
}