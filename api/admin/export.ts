// api/admin/export.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// ---------- utils ----------
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10_000) {
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

function toKST(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Robustly extract the JSON block we stored in the issue body.
 * - tolerates CRLF/(\r\n) and LF (\n)
 * - accepts ```json or just ``` fences
 * - falls back to the first {...} block if fences are missing
 */
function parsePayloadFromBody(body?: string) {
  if (!body) return {} as any;

  // 1) fenced code block (```json ... ```) — CRLF/LF tolerant
  const fence = /```(?:json)?\r?\n([\s\S]*?)\r?\n```/i;
  const m = fence.exec(body);
  if (m && m[1]) {
    try {
      return JSON.parse(m[1]);
    } catch {
      /* ignore and try fallback */
    }
  }

  // 2) fallback: first {...} block
  const s = body.indexOf('{');
  const e = body.lastIndexOf('}');
  if (s >= 0 && e > s) {
    try {
      return JSON.parse(body.slice(s, e + 1));
    } catch {
      /* ignore */
    }
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
// ---------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) admin token check
  const token = String(req.query.token || '');
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // 2) options
  const format = String(req.query.format || 'json').toLowerCase(); // 'json' | 'csv'
  const wantDownload = ['1', 'true'].includes(String(req.query.download || '').toLowerCase());
  const siteFilter = String(req.query.site || ''); // optional filter
  const typeFilter = String(req.query.type || ''); // optional filter: 'phone' | 'online'

  try {
    // 3) fetch issues (latest 100)
    const apiUrl =
      `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=100&sort=created&direction=desc`;

    const gh = await fetchWithTimeout(apiUrl, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!gh.ok) {
      const detail = await gh.text().catch(() => '');
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error', detail });
    }

    const issues = (await gh.json()) as any[];

    // 4) transform → our export shape
    const items = issues
      .map(it => {
        const payload = parsePayloadFromBody(it.body) as any;

        const site = pickLabel(it.labels, 'site:') || payload.site || '';
        const type = (pickLabel(it.labels, 'type:') || payload.type || '').toLowerCase();

        // birth / rrn assembly
        let birth_or_rrn = '';
        if (type === 'online') {
          // FULL rrn in export (엑셀만) — 제목은 서버에서 마스킹 처리됨
          const front = String(payload.rrnFront || '');
          const back = String(payload.rrnBack || '');
          birth_or_rrn = back ? `${front}-${back}` : front;
        } else if (type === 'phone') {
          birth_or_rrn = String(payload.birth || '');
        }

        return {
          site,
          requested_at: toKST(payload.requestedAt || it.created_at),
          request_type: type === 'online' ? '온라인분석' : type === 'phone' ? '전화상담' : '',
          name: String(payload.name || ''),
          birth_or_rrn,
          gender: String(payload.gender || ''),
          phone: String(payload.phone || ''),
          _type: type,
        };
      })
      .filter(r => {
        if (siteFilter && r.site !== siteFilter) return false;
        if (typeFilter && r._type !== typeFilter) return false;
        return true;
      });

    // 5) respond
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
      return res.status(504).json({ ok: false, error: 'Gateway Timeout', detail: 'GitHub call timed out' });
    }
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message || String(err) });
  }
}
