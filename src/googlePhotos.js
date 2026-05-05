/**
 * Google Photos Picker API 어댑터
 *
 * 1. 사용자가 OAuth 로그인 → access token 획득
 * 2. session 생성 → pickerUri 받기
 * 3. 새 탭에서 pickerUri 열어 사용자가 사진 선택
 * 4. session polling (3초 간격) → mediaItemsSet=true 대기
 * 5. mediaItems.list로 선택된 사진들 조회
 * 6. baseUrl에 =w2048-h2048 붙여서 다운로드 → Blob 반환
 *
 * 환경변수:
 *   VITE_GOOGLE_CLIENT_ID
 *
 * 필요한 OAuth 스코프:
 *   https://www.googleapis.com/auth/photospicker.mediaitems.readonly
 *
 * Google Cloud Console 설정:
 *   - APIs & Services → Library → "Google Photos Picker API" 활성화
 *   - OAuth 2.0 Client ID 생성 (Web application)
 *   - Authorized JavaScript origins: 배포 도메인 (예: https://travel-studio.vercel.app)
 *   - Authorized redirect URIs: 동일
 */

const SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const PICKER_API = 'https://photospicker.googleapis.com/v1';

export const isGoogleConfigured = () => !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

let _gisLoaded = false;
let _tokenClient = null;
let _accessToken = null;
let _tokenExpiresAt = 0;

// Google Identity Services 스크립트 로드
const loadGIS = () => new Promise((resolve, reject) => {
  if (_gisLoaded) { resolve(); return; }
  if (window.google?.accounts?.oauth2) { _gisLoaded = true; resolve(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload  = () => { _gisLoaded = true; resolve(); };
  s.onerror = () => reject(new Error('Google Identity Services 로드 실패'));
  document.head.appendChild(s);
});

// OAuth 토큰 요청 (필요할 때마다 호출 — 토큰 만료되면 재발급)
export const requestAccessToken = () => new Promise(async (resolve, reject) => {
  if (!isGoogleConfigured()) { reject(new Error('Google Client ID가 설정되지 않았습니다.')); return; }

  // 캐시된 토큰이 유효하면 재사용
  if (_accessToken && Date.now() < _tokenExpiresAt - 60000) {
    resolve(_accessToken);
    return;
  }

  await loadGIS();

  if (!_tokenClient) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        _accessToken     = resp.access_token;
        _tokenExpiresAt  = Date.now() + (resp.expires_in || 3600) * 1000;
        resolve(_accessToken);
      },
      error_callback: (err) => reject(new Error(err.message || 'OAuth 실패')),
    });
  } else {
    _tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error)); return; }
      _accessToken     = resp.access_token;
      _tokenExpiresAt  = Date.now() + (resp.expires_in || 3600) * 1000;
      resolve(_accessToken);
    };
  }

  _tokenClient.requestAccessToken({ prompt: '' }); // 이미 동의된 경우 prompt 없이 진행
});

// Picker API 호출 헬퍼
const pickerFetch = async (path, opts = {}) => {
  const token = await requestAccessToken();
  const res = await fetch(`${PICKER_API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `${res.status} ${res.statusText}`);
  }
  return res.json();
};

// 1. 세션 생성
export const createPickerSession = async () => {
  const session = await pickerFetch('/sessions', { method: 'POST' });
  return session; // { id, pickerUri, expireTime, mediaItemsSet, ... }
};

// 2. 세션 폴링 — mediaItemsSet=true 될 때까지 대기
export const waitForPickerSelection = async (sessionId, opts = {}) => {
  const { timeoutMs = 5 * 60_000, intervalMs = 3000, onPoll } = opts;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, intervalMs));
    const session = await pickerFetch(`/sessions/${sessionId}`);
    onPoll?.(session);
    if (session.mediaItemsSet) return session;
  }
  throw new Error('사진 선택 시간 초과 (5분)');
};

// 3. 선택된 미디어 아이템 조회
export const listPickedMediaItems = async (sessionId) => {
  const items = [];
  let pageToken;
  do {
    const params = new URLSearchParams({ sessionId, pageSize: '100' });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await pickerFetch(`/mediaItems?${params}`);
    if (data.mediaItems) items.push(...data.mediaItems);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
};

// 4. 세션 삭제 (정리)
export const deletePickerSession = async (sessionId) => {
  try {
    await pickerFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
  } catch (e) { console.warn('세션 삭제 실패:', e); }
};

// 5. baseUrl에서 실제 사진 다운로드 → Blob
export const downloadPickedMedia = async (mediaItem, maxDim = 2048) => {
  const token = await requestAccessToken();
  const baseUrl = mediaItem.mediaFile?.baseUrl;
  if (!baseUrl) throw new Error('baseUrl 없음');

  // 이미지: =w<W>-h<H>로 크기 지정
  const url = `${baseUrl}=w${maxDim}-h${maxDim}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`);
  return res.blob();
};

// === 통합 헬퍼 — UI에서 한 줄로 호출 ========================================
export const pickFromGooglePhotos = async ({ onSessionStart, onPoll }) => {
  const session = await createPickerSession();
  // 새 탭에서 picker 열기
  if (onSessionStart) onSessionStart(session);
  window.open(session.pickerUri, '_blank', 'noopener,noreferrer');

  const completed = await waitForPickerSelection(session.id, { onPoll });
  const items = await listPickedMediaItems(session.id);
  await deletePickerSession(session.id);
  return items; // 호출자가 downloadPickedMedia(item)으로 각각 다운로드
};
