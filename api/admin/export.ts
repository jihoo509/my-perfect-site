// api/admin/export.ts (핵심 부분만)
function fromTitle(title: string) {
  const g = title.includes('남') ? '남' : (title.includes('여') ? '여' : '');
  const m = title.match(/(\d{6})-(\d)\*{6}/);
  const masked = m ? `${m[1]}-${m[2]}******` : '';
  return { genderFromTitle: g, maskedFromTitle: masked };
}

function asExcelText(v: string) {
  // 엑셀에서 0 보존 + 그대로 텍스트로 인식되게
  const s = (v ?? '').trim();
  return s ? `="${s}"` : '';
}

const items = issues.map(it => {
  const site = pickLabel(it.labels, 'site:');
  const type = pickLabel(it.labels, 'type:');
  const payload = parsePayloadFromBody(it.body) || {};
  const { genderFromTitle, maskedFromTitle } = fromTitle(it.title || '');

  // requested_at: payload.timestamp가 있으면 우선, 없으면 issue 생성시각
  const requested_at = payload.requestedAt || it.created_at;

  const request_type = type === 'online' ? '온라인분석' : '전화상담';

  // birth_or_rrn(표시용)
  let birth_or_rrn = '';
  if (type === 'online') {
    birth_or_rrn =
      payload.birthOrRrnMasked ||
      (payload.rrnFront && payload.rrnBackMasked ? `${payload.rrnFront}-${payload.rrnBackMasked}` : '') ||
      maskedFromTitle || '';
  } else {
    birth_or_rrn = payload.birth || '';
  }

  // gender: payload 우선, 없으면 제목에서
  const gender = payload.gender || genderFromTitle || '';

  // phone: 텍스트로 강제
  const phoneRaw = payload.phone || '';
  const phone = asExcelText(phoneRaw.replace(/\s+/g, ''));

  return {
    site: site || 'teeth',
    requested_at,
    request_type,
    name: payload.name || '',
    birth_or_rrn,
    gender,
    phone,
  };
});
