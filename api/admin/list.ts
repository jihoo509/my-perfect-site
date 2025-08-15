import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel 환경 변수들을 가져옵니다.
const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// GitHub API 호출을 위한 타임아웃 기능이 포함된 fetch 함수
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// 메인 핸들러 함수
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 어드민 토큰 검사
  const token = req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 2. GitHub API 호출 (8초 타임아웃 적용)
    const apiUrl = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&sort=created&direction=desc&per_page=100`;
    
    const githubRes = await fetchWithTimeout(apiUrl, {
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      // GitHub API 호출 실패 시 상세 오류 반환
      return res.status(githubRes.status).json({ error: 'GitHub API Error', details: errorText });
    }

    const issues = await githubRes.json();
    
    // 3. 응답 데이터 전송
    res.status(200).json({
      ok: true,
      count: issues.length,
      issues: issues,
    });

  } catch (error: any) {
    // 타임아웃 또는 기타 네트워크 오류 발생 시
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout', details: 'GitHub API call timed out after 8 seconds.' });
    }
    // 그 외 서버 내부 오류
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}