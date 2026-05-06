/* =============================================================================
   Travel Studio v2 — 단일 파일 통합 앱
   여행 기록 + 블로그 작성 + AI 캡션 + SEO 분석 + Firebase 동기화
   ============================================================================= */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, MapPin, Cloud, CloudOff, X, ChevronRight, ChevronLeft,
  Sparkles, Copy, BookOpen, Briefcase, Loader2, Check, Camera,
  Edit3, Upload, GripVertical, Eye, EyeOff, Settings, Trash2,
  AlertCircle, Image as ImageIcon, ArrowLeft, FileText, BarChart3,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// 디자인 토큰
// ============================================================================
const T = {
  bg: '#FAF7F2', card: '#FFFFFF', soft: '#FDFCF9',
  ink: '#1C1917', sub: '#78716C', border: '#E7E2D8',
  accent: '#134E4A', accentSoft: '#F0FDFA', accentLight: '#CCFBF1',
  danger: '#991B1B', success: '#166534', warning: '#92400E',
  D: '"Fraunces","Noto Serif KR",serif',
  B: '"Noto Serif KR","Fraunces",serif',
  S: '"Inter",-apple-system,sans-serif',
  maxW: 920,
};

// ============================================================================
// 상수
// ============================================================================
const CURRENCIES = ['KRW','USD','EUR','JPY','GBP','CNY','THB','VND','SGD','AUD','TWD','HKD'];

const ACCENTS = [
  { id:'teal',   color:'#134E4A', label:'청록' },
  { id:'wine',   color:'#7F1D1D', label:'와인' },
  { id:'sand',   color:'#B45309', label:'모래' },
  { id:'indigo', color:'#312E81', label:'인디고' },
  { id:'olive',  color:'#3F4D2D', label:'올리브' },
  { id:'slate',  color:'#1E293B', label:'슬레이트' },
];

const FLAG_MAP = {
  '한국':'🇰🇷','대한민국':'🇰🇷','korea':'🇰🇷',
  '일본':'🇯🇵','japan':'🇯🇵','중국':'🇨🇳','china':'🇨🇳',
  '미국':'🇺🇸','usa':'🇺🇸','영국':'🇬🇧','uk':'🇬🇧',
  '프랑스':'🇫🇷','france':'🇫🇷','독일':'🇩🇪','germany':'🇩🇪',
  '이탈리아':'🇮🇹','italy':'🇮🇹','스페인':'🇪🇸','spain':'🇪🇸',
  '태국':'🇹🇭','thailand':'🇹🇭','베트남':'🇻🇳','vietnam':'🇻🇳',
  '대만':'🇹🇼','taiwan':'🇹🇼','싱가포르':'🇸🇬','singapore':'🇸🇬',
  '홍콩':'🇭🇰','hong kong':'🇭🇰','호주':'🇦🇺','australia':'🇦🇺',
  '캐나다':'🇨🇦','canada':'🇨🇦','아랍에미리트':'🇦🇪','uae':'🇦🇪','dubai':'🇦🇪',
  '스위스':'🇨🇭','switzerland':'🇨🇭','오스트리아':'🇦🇹','austria':'🇦🇹',
};

const TRANSPORT_OPTIONS = ['도보', '지하철', '버스', '택시', '자차', '그랩/우버', '기차', '비행기', '페리', '자전거'];
const EXPENSE_CATEGORIES = ['식비', '숙박', '교통', '입장료', '쇼핑', '기타'];

const DEFAULT_SAMPLE = `#태국여행 #방콕여행 #두짓타니방콕 #인피니티풀

3일차 방콕여행의 아침이 밝았다. 아침 날씨는 좋았고 커다란 통창으로 룸피니 공원뷰가 우리를 반갑게 맞이해 주었다.

호텔 조식을 신청해 두긴 했으나 방콕에서의 브런치도 즐겨보고 싶은 마음에 미리 검색해놓은 곳들 중에서 fran's라는 식당을 아침식사 장소로 채택했다. 두짓타니 호텔에서 비교적 가까운 사톤 지역에 위치해 있어서 두짓타니 호텔에 머무를 동안 다녀오는게 낫다고 판단했다.

내부는 굉장히 깔끔하고 정돈된 느낌으로 가득했다. 결단을 내려 수프, 고구마 튀김, 아보카도 연어 샐러드, 봉골레 파스타 그리고 음료 하나씩 주문하는데 성공.

호텔로 돌아와서는 바로 인피니티 풀로 이동. 이곳 두짓타니에서는 객실에서도 룸피니공원 뷰를 즐기고 풀장도 아낌없이 방문해서 최대한 이곳의 최장점인 공원뷰를 즐기면 그보다 더 큰 만족감은 없을듯 싶다.

두짓타니 방콕 호텔의 인피니티 풀장을 즐기는 방법 중에 또다른 방법으로 야간 수영을 해보기로 한 것이었는데 낮과 다르게 또다른 매력이 있었다. 이로서 방콕 3일차 일정이 마무리 되었다.`;

const STYLE_NOTES = `- 평어체 종결 (~했다, ~좋았다, ~인듯, ~같다)
- 시간순 서술, 단락 사이 사진 자리
- 부사: 굉장히, 매우, 아주, 적당히, 비교적, 전반적으로
- 호텔/식당 정보 객관적 기술 + 짧은 평가
- 메뉴/장소명 영문 병기
- 첫 줄 해시태그, 마지막은 "~로 N일차 일정이 마무리되었다"
- "결단을 내려 ~ 주문하는데 성공" 식의 미세한 유머
- 의료인 특유의 정돈된, 분석적이지만 따뜻한 톤`;

// ============================================================================
// 유틸 함수
// ============================================================================
const uid = () => Math.random().toString(36).slice(2, 10);
const safeArr = (v) => Array.isArray(v) ? v : [];
const fmtShort = (d) => d ? new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
const dateRange = (s, e) => {
  const r = [], c = new Date(s), end = new Date(e);
  while (c <= end) { r.push(c.toISOString().slice(0, 10)); c.setDate(c.getDate() + 1); }
  return r;
};
const guessFlag = (c) => c ? FLAG_MAP[c.toLowerCase().trim()] || null : null;

const fileToB64 = (f) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(f);
});

const resizeImg = (b64, max = 1280) => new Promise((res) => {
  const img = new Image();
  img.onload = () => {
    let { width: w, height: h } = img;
    if (Math.max(w, h) <= max) { res(b64); return; }
    const s = max / Math.max(w, h);
    w = Math.round(w * s); h = Math.round(h * s);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    res(c.toDataURL('image/jpeg', 0.85));
  };
  img.src = b64;
});

// ============================================================================
// localStorage 영속화
// ============================================================================
const LS_KEY = 'travelstudio-v2';

const loadLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveLS = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  catch (e) { console.warn('localStorage 저장 실패:', e); }
};

// ============================================================================
// Firebase — 전역 lazy 로더 (build-safe)
// ============================================================================
const FB_CONFIG = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId:         import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = () => !!(FB_CONFIG.apiKey && FB_CONFIG.projectId);

let _fbCache = null;
const initFirebase = async () => {
  if (_fbCache) return _fbCache;
  if (!isFirebaseConfigured()) throw new Error('Firebase 미설정');
  /* @vite-ignore */
  const { initializeApp } = await import(/* @vite-ignore */ 'firebase/app');
  /* @vite-ignore */
  const fs = await import(/* @vite-ignore */ 'firebase/firestore');
  /* @vite-ignore */
  const st = await import(/* @vite-ignore */ 'firebase/storage');
  const app = initializeApp(FB_CONFIG);
  _fbCache = {
    db: fs.getFirestore(app),
    storage: st.getStorage(app),
    fs, st,
  };
  return _fbCache;
};

const fbSubscribeTrip = async (code, cb) => {
  const { db, fs } = await initFirebase();
  return fs.onSnapshot(fs.doc(db, 'travelStudio', code), (snap) => {
    if (snap.exists()) cb(snap.data());
  });
};

const fbSaveData = async (code, data) => {
  const { db, fs } = await initFirebase();
  await fs.setDoc(fs.doc(db, 'travelStudio', code), {
    ...data,
    lastUpdated: fs.serverTimestamp(),
  }, { merge: true });
};

const fbUploadPhoto = async (code, tripId, file) => {
  const { storage, st } = await initFirebase();
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `travelStudio/${code}/photos/${tripId}/${safeName}`;
  const r = st.ref(storage, path);
  await st.uploadBytes(r, file);
  const url = await st.getDownloadURL(r);
  return { url, path };
};

// ============================================================================
// Google Photos Picker API
// ============================================================================
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GP_SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const GP_API = 'https://photospicker.googleapis.com/v1';

const isGoogleConfigured = () => !!GOOGLE_CLIENT_ID;

let _gisLoaded = false;
let _tokenClient = null;
let _accessToken = null;
let _tokenExp = 0;

const loadGIS = () => new Promise((resolve, reject) => {
  if (_gisLoaded || window.google?.accounts?.oauth2) { _gisLoaded = true; resolve(); return; }
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = () => { _gisLoaded = true; resolve(); };
  s.onerror = () => reject(new Error('Google Identity Services 로드 실패'));
  document.head.appendChild(s);
});

const requestGoogleToken = () => new Promise(async (resolve, reject) => {
  if (!isGoogleConfigured()) { reject(new Error('Google Client ID 미설정')); return; }
  if (_accessToken && Date.now() < _tokenExp - 60000) { resolve(_accessToken); return; }
  await loadGIS();
  const cb = (resp) => {
    if (resp.error) { reject(new Error(resp.error)); return; }
    _accessToken = resp.access_token;
    _tokenExp = Date.now() + (resp.expires_in || 3600) * 1000;
    resolve(_accessToken);
  };
  if (!_tokenClient) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GP_SCOPE,
      callback: cb,
      error_callback: (err) => reject(new Error(err.message || 'OAuth 실패')),
    });
  } else {
    _tokenClient.callback = cb;
  }
  _tokenClient.requestAccessToken({ prompt: '' });
});

const gpFetch = async (path, opts = {}) => {
  const token = await requestGoogleToken();
  const res = await fetch(`${GP_API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `${res.status} ${res.statusText}`);
  }
  return res.json();
};

const pickFromGooglePhotos = async ({ onSessionStart } = {}) => {
  // 1. 세션 생성
  const session = await gpFetch('/sessions', { method: 'POST' });
  if (onSessionStart) onSessionStart(session);
  // 2. 새 탭에서 picker 열기
  window.open(session.pickerUri, '_blank', 'noopener,noreferrer');
  // 3. 폴링 (5분 timeout)
  const start = Date.now();
  let completed = null;
  while (Date.now() - start < 5 * 60_000) {
    await new Promise(r => setTimeout(r, 3000));
    const s = await gpFetch(`/sessions/${session.id}`);
    if (s.mediaItemsSet) { completed = s; break; }
  }
  if (!completed) throw new Error('사진 선택 시간 초과');
  // 4. 선택된 미디어 가져오기
  const items = [];
  let pageToken;
  do {
    const params = new URLSearchParams({ sessionId: session.id, pageSize: '100' });
    if (pageToken) params.set('pageToken', pageToken);
    const data = await gpFetch(`/mediaItems?${params}`);
    if (data.mediaItems) items.push(...data.mediaItems);
    pageToken = data.nextPageToken;
  } while (pageToken);
  // 5. 세션 정리
  try { await gpFetch(`/sessions/${session.id}`, { method: 'DELETE' }); } catch {}
  return items;
};

const downloadGoogleMedia = async (mediaItem, maxDim = 2048) => {
  const token = await requestGoogleToken();
  const baseUrl = mediaItem.mediaFile?.baseUrl;
  if (!baseUrl) throw new Error('baseUrl 없음');
  const res = await fetch(`${baseUrl}=w${maxDim}-h${maxDim}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`);
  return res.blob();
};

// ============================================================================
// MAIN APP — 단일 view 객체로 네비게이션
// ============================================================================
export default function TravelStudio() {
  const init = (typeof window !== 'undefined' && loadLS()) || {};

  // ── 상태 ──
  const [trips, setTrips] = useState(init.trips || []);
  const [sample, setSample] = useState(init.sample || DEFAULT_SAMPLE);
  const [apiKey, setApiKey] = useState(init.apiKey || '');
  const [syncCode, setSyncCode] = useState(init.syncCode || '');
  const [view, setView] = useState({ tab: 'library', tripId: null, dayIdx: null });
  const [showNew, setShowNew] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [showSync, setShowSync] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('idle');
  const [skipSave, setSkipSave] = useState(false);

  // ── 파생 상태 ──
  const currentTrip = useMemo(
    () => trips.find(t => t.id === view.tripId) ?? null,
    [trips, view.tripId]
  );

  // ── 폰트 로드 ──
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Noto+Serif+KR:wght@400;500;600&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // ── localStorage 자동 저장 ──
  useEffect(() => {
    if (skipSave) return;
    saveLS({ trips, sample, apiKey, syncCode });
  }, [trips, sample, apiKey, syncCode, skipSave]);

  // ── Firebase 동기화 ──
  useEffect(() => {
    if (!syncCode || !isFirebaseConfigured()) {
      setCloudStatus(isFirebaseConfigured() ? 'idle' : 'nofb');
      return;
    }
    let unsub, cancelled = false;
    setCloudStatus('syncing');
    (async () => {
      try {
        unsub = await fbSubscribeTrip(syncCode, (data) => {
          if (cancelled) return;
          if (data?.trips) {
            setSkipSave(true);
            setTrips(data.trips);
            if (data.sample) setSample(data.sample);
            setTimeout(() => setSkipSave(false), 200);
          }
          setCloudStatus('ok');
        });
      } catch (err) {
        console.error('FB subscribe err', err);
        setCloudStatus('error');
      }
    })();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [syncCode]);

  // ── 데이터 변경 시 Firebase 저장 ──
  useEffect(() => {
    if (skipSave) return;
    if (!syncCode || !isFirebaseConfigured()) return;
    fbSaveData(syncCode, { trips, sample }).catch(() => setCloudStatus('error'));
  }, [trips, sample, syncCode, skipSave]);

  // ── Trip CRUD ──
  const updateTrip = (id, updater) => {
    setTrips(prev => prev.map(t =>
      t.id === id
        ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater })
        : t
    ));
  };

  const deleteTrip = (id) => {
    if (!confirm('이 여행을 삭제하시겠습니까?')) return;
    setTrips(prev => prev.filter(t => t.id !== id));
    if (view.tripId === id) {
      setView({ tab: 'library', tripId: null, dayIdx: null });
    }
  };

  const updateDay = (dayUpdater) => {
    if (!currentTrip || view.dayIdx === null) return;
    updateTrip(currentTrip.id, t => ({
      ...t,
      days: safeArr(t.days).map((d, i) =>
        i === view.dayIdx
          ? (typeof dayUpdater === 'function' ? dayUpdater(d) : { ...d, ...dayUpdater })
          : d
      ),
    }));
  };

  // ── 렌더 ──
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.B, color: T.ink }}>
      <GlobalStyles />

      {/* 상단 탭 */}
      <nav style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: T.maxW, margin: '0 auto', padding: '0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {[
              { id: 'library', icon: <BookOpen size={14}/>, label: '라이브러리' },
              { id: 'blog',    icon: <Edit3   size={14}/>, label: '블로그 작성' },
              { id: 'samples', icon: <FileText size={14}/>, label: '문체 샘플' },
              { id: 'settings',icon: <Settings size={14}/>, label: '설정' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setView(v => ({ ...v, tab: t.id }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '14px 14px', marginBottom: -1,
                  color: view.tab === t.id ? T.ink : T.sub,
                  fontFamily: T.S, fontSize: 12, fontWeight: 500,
                  background: 'none', border: 'none', whiteSpace: 'nowrap',
                  borderBottomWidth: 2, borderBottomStyle: 'solid',
                  borderBottomColor: view.tab === t.id ? T.accent : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 16, color: T.accent, flexShrink: 0 }}>
            Travel Studio
          </div>
        </div>
      </nav>

      {/* 콘텐츠 */}
      <div style={{ maxWidth: T.maxW, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* v2-FINAL 식별 배너 — 이 배너 보이면 v2 배포 성공 */}
        <div style={{
          background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 4,
          padding: '6px 12px', marginBottom: 16, fontFamily: T.S, fontSize: 11,
          color: '#166534', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ✓ <strong>v2-FINAL</strong> · 단일 파일 · Firebase + Google Photos 통합
        </div>

        {/* 라이브러리 탭 */}
        {view.tab === 'library' && (() => {
          // Day 편집 화면
          if (currentTrip && view.dayIdx !== null) {
            const day = safeArr(currentTrip.days)[view.dayIdx];
            if (!day) {
              return (
                <ErrorScreen
                  msg="일자 데이터가 없습니다"
                  onBack={() => setView(v => ({ ...v, dayIdx: null }))}
                />
              );
            }
            return (
              <DayEditor
                trip={currentTrip}
                day={day}
                dayIdx={view.dayIdx}
                syncCode={syncCode}
                onUpdate={updateDay}
                onBack={() => setView(v => ({ ...v, dayIdx: null }))}
              />
            );
          }
          // Trip 상세 화면
          if (currentTrip) {
            return (
              <TripDetail
                trip={currentTrip}
                onBack={() => setView({ tab: 'library', tripId: null, dayIdx: null })}
                onBlog={() => setView(v => ({ ...v, tab: 'blog' }))}
                onEdit={() => setEditTrip(currentTrip)}
                onDelete={() => deleteTrip(currentTrip.id)}
                onUpdateTrip={(updater) => updateTrip(currentTrip.id, updater)}
                onSelectDay={(idx) => setView(v => ({ ...v, dayIdx: idx }))}
              />
            );
          }
          // 라이브러리 화면
          return (
            <Library
              trips={trips}
              cloudStatus={cloudStatus}
              syncCode={syncCode}
              onSyncOpen={() => setShowSync(true)}
              onNew={() => setShowNew(true)}
              onSelectTrip={(t) => setView({ tab: 'library', tripId: t.id, dayIdx: null })}
            />
          );
        })()}

        {/* 다른 탭들 */}
        {view.tab === 'blog' && (
          <BlogWriter apiKey={apiKey} sample={sample} onNeedKey={() => setView(v => ({ ...v, tab: 'settings' }))} />
        )}
        {view.tab === 'samples' && (
          <StyleSamples sample={sample} onChange={setSample} />
        )}
        {view.tab === 'settings' && (
          <SettingsTab
            apiKey={apiKey} onApiKeyChange={setApiKey}
            cloudStatus={cloudStatus} syncCode={syncCode}
          />
        )}
      </div>

      {/* 모달들 */}
      {showNew && (
        <TripFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSave={(t) => {
            setTrips(prev => [t, ...prev]);
            setShowNew(false);
            setView({ tab: 'library', tripId: t.id, dayIdx: null });
          }}
        />
      )}
      {editTrip && (
        <TripFormModal
          mode="edit"
          trip={editTrip}
          onClose={() => setEditTrip(null)}
          onSave={(updates) => {
            updateTrip(editTrip.id, updates);
            setEditTrip(null);
          }}
        />
      )}
      {showSync && (
        <SyncPanel
          current={syncCode}
          onClose={() => setShowSync(false)}
          onApply={(c) => { setSyncCode(c); setShowSync(false); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// 글로벌 스타일
// ============================================================================
function GlobalStyles() {
  return <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    button { font-family: inherit; cursor: pointer; }
    input, textarea, select { font-family: inherit; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-thumb { background: rgba(19,78,74,.18); border-radius: 5px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-up { animation: fadeUp .25s ease forwards; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .ts-card { transition: transform .15s, box-shadow .15s, border-color .15s; }
    .ts-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(28,25,23,.08); }
    .ts-card:hover .ts-cover { transform: scale(1.04); }
    button:hover:not(:disabled) { opacity: .9; }
    button:disabled { opacity: .5; cursor: not-allowed; }
  `}</style>;
}

// ============================================================================
// 공유 스타일
// ============================================================================
const css = {
  eyebrow: { fontFamily: T.S, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.sub, marginBottom: 8, fontWeight: 500 },
  hero: { fontFamily: T.D, fontSize: 38, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0, color: T.ink },
  lead: { fontFamily: T.S, fontSize: 13, color: T.sub, marginTop: 10, lineHeight: 1.65, maxWidth: 520 },
  sectionH: { fontFamily: T.D, fontSize: 18, fontWeight: 500, fontStyle: 'italic', margin: 0, color: T.ink },
  label: { display: 'block', fontFamily: T.S, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.sub, marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: T.B, border: `1px solid ${T.border}`, borderRadius: 3, background: T.soft, color: T.ink, outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: T.B, border: `1px solid ${T.border}`, borderRadius: 3, background: T.soft, color: T.ink, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 },
  primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: T.ink, color: T.bg, border: 'none', borderRadius: 3, fontFamily: T.S, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer' },
  secondaryBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: T.card, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 3, fontFamily: T.S, fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(28,25,23,.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal: { background: T.bg, borderRadius: 4, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(28,25,23,.2)', border: `1px solid ${T.border}` },
};

function ErrorScreen({ msg, onBack }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: T.sub }}>
      <AlertCircle size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: .4 }}/>
      <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 18, marginBottom: 8 }}>{msg}</div>
      <button onClick={onBack} style={css.secondaryBtn}>← 돌아가기</button>
    </div>
  );
}

function CloudDot({ status }) {
  const colors = {
    idle: '#CBD5E0', syncing: '#F6AD55', ok: T.success,
    error: T.danger, nofb: '#CBD5E0',
  };
  return <span title={status} style={{
    width: 6, height: 6, borderRadius: '50%',
    background: colors[status] || colors.idle, display: 'inline-block',
  }}/>;
}

// ============================================================================
// LIBRARY — 여행 목록 화면
// ============================================================================
function Library({ trips, cloudStatus, syncCode, onSyncOpen, onNew, onSelectTrip }) {
  const stats = useMemo(() => {
    const places = new Set();
    let days = 0;
    trips.forEach(t => safeArr(t.days).forEach(d => {
      days++;
      safeArr(d.waypoints).forEach(w => w.name && places.add(w.name));
    }));
    return { trips: trips.length, days, places: places.size };
  }, [trips]);

  return (
    <>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={css.eyebrow}>여행 라이브러리</div>
          <h1 style={css.hero}>나의 <span style={{ fontStyle: 'italic', color: T.accent }}>여행 기록</span></h1>
          <p style={css.lead}>동선·일기·사진·지출을 기록하고, 블로그 글까지 한 번에.</p>
        </div>
        <button onClick={onSyncOpen} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 99, fontFamily: T.S, fontSize: 11, color: T.sub, cursor: 'pointer',
        }}>
          {cloudStatus === 'ok' ? <Cloud size={12} color={T.success}/> : <CloudOff size={12}/>}
          <span>{syncCode || '동기화'}</span>
          <CloudDot status={cloudStatus}/>
        </button>
      </header>

      {stats.days > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: 28 }}>
          {[
            { v: stats.trips, l: '여행' },
            { v: stats.days, l: '기록일' },
            { v: stats.places, l: '방문지' },
          ].map((s, i) => (
            <div key={s.l} style={{ padding: '18px 12px', borderLeft: i > 0 ? `1px solid ${T.border}` : 'none', textAlign: 'center' }}>
              <div style={{ fontFamily: T.S, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.sub, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontFamily: T.D, fontSize: 26, fontWeight: 500, color: T.ink }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 style={css.sectionH}>모든 여행</h2>
        <button onClick={onNew} style={css.primaryBtn}><Plus size={14}/> 새 여행</button>
      </div>

      {trips.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', background: T.soft, border: `1px dashed ${T.border}`, borderRadius: 4 }}>
          <div style={{ fontSize: 32, opacity: .35, marginBottom: 12 }}>✈</div>
          <h3 style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 20, margin: '0 0 8px' }}>첫 여행을 시작해 보세요</h3>
          <p style={{ fontFamily: T.S, fontSize: 13, color: T.sub, margin: '0 0 20px' }}>기록한 동선·사진은 그대로 블로그 글의 재료가 됩니다.</p>
          <button onClick={onNew} style={css.primaryBtn}><Plus size={14}/> 새 여행</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
          {trips.map(t => <TripCard key={t.id} trip={t} onClick={() => onSelectTrip(t)} />)}
        </div>
      )}
    </>
  );
}

// ============================================================================
// TripCard — 매거진 톤 카드
// ============================================================================
function TripCard({ trip, onClick }) {
  const days = safeArr(trip.days).length;
  const accent = trip.accent || T.accent;
  const cover = trip.coverImage;

  return (
    <button
      type="button"
      onClick={onClick}
      className="ts-card"
      style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 6,
        overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 3px rgba(28,25,23,.05)',
        position: 'relative', padding: 0, width: '100%', textAlign: 'left',
        fontFamily: 'inherit', color: 'inherit',
      }}
    >
      <div style={{
        aspectRatio: '4/5', background: cover ? '#000' : accent,
        position: 'relative', display: 'flex', alignItems: 'flex-end',
        padding: '22px 22px 26px', color: '#FAF7F2', overflow: 'hidden',
      }}>
        {cover ? (
          <>
            <img
              className="ts-cover"
              src={cover} alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', transition: 'transform .6s ease',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,.25) 0%, transparent 30%, transparent 50%, rgba(0,0,0,.85) 100%)',
            }}/>
          </>
        ) : (
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at top right, rgba(255,255,255,.12), transparent 55%)',
            }}/>
            <div style={{
              position: 'absolute', top: 18, right: 20, fontSize: 38, opacity: .95,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.4))',
            }}>{trip.flag || '✈'}</div>
          </>
        )}
        {cover && (
          <div style={{
            position: 'absolute', top: 14, right: 14, padding: '5px 10px',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', borderRadius: 99, fontSize: 14,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span>{trip.flag || '✈'}</span>
            <span style={{ fontFamily: T.S, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em' }}>{trip.country}</span>
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {!cover && (
            <div style={{ fontFamily: T.S, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: .85, marginBottom: 6 }}>
              {trip.country}
            </div>
          )}
          <h3 style={{
            fontFamily: T.D, fontSize: 24, fontWeight: 500,
            margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em',
            textShadow: cover ? '0 2px 12px rgba(0,0,0,.4)' : 'none',
          }}>{trip.title}</h3>
          <div style={{
            fontFamily: T.S, fontSize: 11, color: 'rgba(255,255,255,.85)',
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{fmtShort(trip.startDate)} – {fmtShort(trip.endDate)}</span>
            <span style={{ opacity: .5 }}>·</span>
            <span>{days}일</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// TRIP DETAIL — Day 카드들
// ============================================================================
function TripDetail({ trip, onBack, onBlog, onEdit, onDelete, onUpdateTrip, onSelectDay }) {
  const fileRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await fileToB64(file);
    const img = await resizeImg(raw, 1600);
    onUpdateTrip({ coverImage: img });
    if (e.target) e.target.value = '';
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...css.secondaryBtn, fontSize: 12 }}><ArrowLeft size={12}/> 라이브러리</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={{ ...css.secondaryBtn, fontSize: 12 }}><Edit3 size={12}/> 정보 수정</button>
          <button onClick={onDelete} style={{ ...css.secondaryBtn, fontSize: 12, color: T.danger, borderColor: '#FCA5A5' }}><Trash2 size={12}/></button>
        </div>
      </div>

      {/* Hero with cover */}
      <div style={{
        aspectRatio: '21/9', background: trip.coverImage ? '#000' : (trip.accent || T.accent),
        borderRadius: 6, overflow: 'hidden', marginBottom: 14, position: 'relative',
        display: 'flex', alignItems: 'flex-end', padding: 32, color: '#FAF7F2',
      }}>
        {trip.coverImage ? (
          <>
            <img src={trip.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.15) 50%, transparent 100%)' }}/>
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(255,255,255,.1), transparent 60%)' }}/>
            <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 56, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.35))' }}>{trip.flag}</div>
          </>
        )}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: T.S, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: .85, marginBottom: 6 }}>{trip.country} · {fmtShort(trip.startDate)} – {fmtShort(trip.endDate)}</div>
          <h1 style={{ fontFamily: T.D, fontSize: 40, fontWeight: 500, margin: 0, lineHeight: 1.05, textShadow: trip.coverImage ? '0 2px 16px rgba(0,0,0,.4)' : 'none' }}>{trip.title}</h1>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            position: 'absolute', top: 16, left: 16, padding: '7px 12px',
            background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.18)', borderRadius: 3,
            color: '#FAF7F2', fontFamily: T.S, fontSize: 11, fontWeight: 500,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <ImageIcon size={12}/> {trip.coverImage ? '표지 변경' : '표지 사진 추가'}
        </button>
        {trip.coverImage && (
          <button
            onClick={() => onUpdateTrip({ coverImage: null })}
            style={{
              position: 'absolute', top: 16, left: 140, padding: '7px 10px',
              background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.18)', borderRadius: 3,
              color: '#FAF7F2', cursor: 'pointer', display: 'inline-flex',
            }}
            title="표지 제거"
          >
            <X size={12}/>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }}/>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={css.sectionH}>일자별 기록</h2>
        <button onClick={onBlog} style={css.primaryBtn}><Edit3 size={13}/> 블로그 글로 만들기</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {safeArr(trip.days).map((d, i) => {
          const wpCount = safeArr(d.waypoints).filter(w => w.name).length;
          const photoCount = safeArr(d.photos).length;
          const expCount = safeArr(d.expenses).length;
          const hasContent = wpCount || d.diary || photoCount || expCount;

          return (
            <button
              key={d.date || i}
              type="button"
              onClick={() => onSelectDay(i)}
              className="ts-card"
              style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.accent}`, borderRadius: 4,
                padding: '16px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', textAlign: 'left',
                fontFamily: 'inherit', color: 'inherit',
              }}
            >
              <div style={{ flex: 1, pointerEvents: 'none' }}>
                <div style={{ fontFamily: T.S, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.sub, marginBottom: 2 }}>
                  Day {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 16, color: T.ink }}>
                  {d.date ? new Date(d.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 없음'}
                </div>
                {hasContent ? (
                  <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontFamily: T.S, fontSize: 11, color: T.sub }}>
                    {wpCount > 0 && <span><MapPin size={10} style={{ verticalAlign: -1 }}/> {wpCount}곳</span>}
                    {photoCount > 0 && <span><Camera size={10} style={{ verticalAlign: -1 }}/> {photoCount}장</span>}
                    {d.diary && <span><BookOpen size={10} style={{ verticalAlign: -1 }}/> {d.diary.length}자</span>}
                    {expCount > 0 && <span><Briefcase size={10} style={{ verticalAlign: -1 }}/> {expCount}건</span>}
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontFamily: T.S, fontSize: 11, color: T.sub, fontStyle: 'italic' }}>
                    비어있음 — 클릭하여 입력 →
                  </div>
                )}
              </div>
              {photoCount > 0 && (
                <img
                  src={safeArr(d.photos)[0]?.url || safeArr(d.photos)[0]}
                  alt=""
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 3, border: `1px solid ${T.border}`, pointerEvents: 'none' }}
                />
              )}
              <ChevronRight size={14} color={T.sub} style={{ pointerEvents: 'none' }}/>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============================================================================
// DAY EDITOR — 일자별 입력 화면
// ============================================================================
function DayEditor({ trip, day, dayIdx, syncCode, onUpdate, onBack }) {
  const [uploading, setUploading] = useState(false);
  const [pickingGP, setPickingGP] = useState(false);
  const fileRef = useRef(null);

  const useFB = syncCode && isFirebaseConfigured();
  const useGP = isGoogleConfigured();

  const uploadPhotos = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const newPhotos = [];
      for (const file of files) {
        if (useFB) {
          const { url, path } = await fbUploadPhoto(syncCode, trip.id, file);
          newPhotos.push({ url, path, addedAt: Date.now() });
        } else {
          const raw = await fileToB64(file);
          const img = await resizeImg(raw, 1280);
          newPhotos.push({ url: img, path: null, addedAt: Date.now() });
        }
      }
      onUpdate(d => ({ ...d, photos: [...safeArr(d.photos), ...newPhotos] }));
    } catch (err) {
      alert('사진 업로드 실패: ' + err.message);
    }
    setUploading(false);
  };

  const importFromGooglePhotos = async () => {
    if (!useGP) {
      alert('Google Photos 연동이 설정되지 않았습니다.\n설정 탭의 안내를 확인하세요.');
      return;
    }
    setPickingGP(true);
    try {
      const items = await pickFromGooglePhotos({
        onSessionStart: () => alert('새 탭에서 Google Photos가 열립니다.\n사진을 선택한 후 "완료"를 누르세요.\n선택 완료까지 자동 감지됩니다.'),
      });
      if (!items?.length) { setPickingGP(false); return; }
      const newPhotos = [];
      for (const item of items) {
        const blob = await downloadGoogleMedia(item);
        const file = new File([blob], item.mediaFile?.filename || 'photo.jpg', { type: blob.type });
        if (useFB) {
          const { url, path } = await fbUploadPhoto(syncCode, trip.id, file);
          newPhotos.push({ url, path, addedAt: Date.now(), source: 'google-photos' });
        } else {
          const raw = await fileToB64(file);
          const img = await resizeImg(raw, 1280);
          newPhotos.push({ url: img, path: null, addedAt: Date.now(), source: 'google-photos' });
        }
      }
      onUpdate(d => ({ ...d, photos: [...safeArr(d.photos), ...newPhotos] }));
    } catch (err) {
      alert('Google Photos 가져오기 실패: ' + err.message);
    }
    setPickingGP(false);
  };

  const handleFileInput = async (e) => {
    await uploadPhotos(Array.from(e.target.files || []));
    if (e.target) e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    await uploadPhotos(Array.from(e.dataTransfer.files || []));
  };

  const removePhoto = (idx) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    onUpdate(d => ({ ...d, photos: safeArr(d.photos).filter((_, i) => i !== idx) }));
  };

  const photos = safeArr(day.photos);
  const wps = safeArr(day.waypoints);
  const exs = safeArr(day.expenses);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...css.secondaryBtn, fontSize: 12 }}>
          <ArrowLeft size={12}/> {trip.title}
        </button>
        <div style={{ marginLeft: 'auto', fontFamily: T.S, fontSize: 11, color: T.sub }}>
          {useFB
            ? <><Cloud size={11} style={{ verticalAlign: -1, color: T.success }}/> 클라우드 저장</>
            : <><CloudOff size={11} style={{ verticalAlign: -1 }}/> 이 기기에만 저장</>
          }
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: T.S, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.sub, marginBottom: 4, fontWeight: 500 }}>
          Day {String(dayIdx + 1).padStart(2, '0')} · {trip.country}
        </div>
        <h1 style={{ ...css.hero, fontSize: 32 }}>
          {new Date(day.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </h1>
      </div>

      {/* 일기 */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={css.sectionH}>일기</h2>
          <span style={{ fontFamily: T.S, fontSize: 11, color: T.sub }}>{(day.diary || '').length}자</span>
        </div>
        <textarea
          value={day.diary || ''}
          onChange={e => onUpdate({ diary: e.target.value })}
          placeholder="오늘의 느낌, 인상 깊었던 순간, 기억하고 싶은 디테일을 자유롭게…"
          rows={5}
          style={{ ...css.textarea, fontSize: 15, lineHeight: 1.7, padding: '14px 16px' }}
        />
      </section>

      {/* 사진 */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
          <h2 style={css.sectionH}>
            사진 {photos.length > 0 && <span style={{ fontFamily: T.S, fontStyle: 'normal', fontSize: 14, color: T.sub, fontWeight: 400 }}>· {photos.length}장</span>}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {useGP && (
              <button onClick={importFromGooglePhotos} disabled={pickingGP || uploading} style={{ ...css.secondaryBtn, fontSize: 11 }}>
                {pickingGP ? <><Loader2 size={11} className="spin"/> 가져오는 중…</> : <><ExternalLink size={11}/> Google Photos</>}
              </button>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading || pickingGP} style={{ ...css.secondaryBtn, fontSize: 11 }}>
              {uploading ? <><Loader2 size={11} className="spin"/> 업로드…</> : <><Upload size={11}/> 추가</>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: 'none' }}/>
          </div>
        </div>

        {photos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <img src={p.url || p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: 4, right: 4, padding: 4,
                    background: 'rgba(0,0,0,.55)', border: 'none', color: '#fff',
                    borderRadius: 3, cursor: 'pointer', display: 'inline-flex',
                  }}
                  title="삭제"
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              padding: '40px 16px', textAlign: 'center', background: T.soft,
              border: `2px dashed ${T.border}`, borderRadius: 4, cursor: 'pointer',
              fontFamily: T.S, fontSize: 13, color: T.sub, lineHeight: 1.6,
            }}
          >
            <ImageIcon size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: .4 }}/>
            <strong style={{ color: T.ink, fontWeight: 500 }}>사진을 추가하세요</strong>
            <div style={{ marginTop: 4 }}>클릭하거나 드롭</div>
          </div>
        )}
      </section>

      {/* 동선 */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={css.sectionH}>
            동선 {wps.length > 0 && <span style={{ fontFamily: T.S, fontStyle: 'normal', fontSize: 14, color: T.sub, fontWeight: 400 }}>· {wps.length}곳</span>}
          </h2>
          <button
            onClick={() => onUpdate(d => ({ ...d, waypoints: [...safeArr(d.waypoints), { id: uid(), name: '', time: '', transport: '도보', duration: '' }] }))}
            style={{ ...css.secondaryBtn, fontSize: 11 }}
          >
            <Plus size={12}/> 장소 추가
          </button>
        </div>
        {wps.length === 0 ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', background: T.soft, border: `1px dashed ${T.border}`, borderRadius: 4, fontFamily: T.S, fontSize: 12, color: T.sub }}>
            방문한 장소를 순서대로 추가해보세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {wps.map((w, idx) => (
              <div key={w.id} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 4, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: T.accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: T.S, fontSize: 10, fontWeight: 600, flexShrink: 0,
                  }}>{idx + 1}</div>
                  <input
                    placeholder="장소 / 식당 이름"
                    value={w.name || ''}
                    onChange={e => onUpdate(d => ({ ...d, waypoints: safeArr(d.waypoints).map(x => x.id === w.id ? { ...x, name: e.target.value } : x) }))}
                    style={{ ...css.input, flex: 1, padding: '6px 10px', fontSize: 13 }}
                  />
                  <button
                    onClick={() => onUpdate(d => ({ ...d, waypoints: safeArr(d.waypoints).filter(x => x.id !== w.id) }))}
                    style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 4, display: 'inline-flex' }}
                  >
                    <Trash2 size={13}/>
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px', gap: 8 }}>
                  <input
                    placeholder="시간"
                    value={w.time || ''}
                    onChange={e => onUpdate(d => ({ ...d, waypoints: safeArr(d.waypoints).map(x => x.id === w.id ? { ...x, time: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 10px', fontSize: 12, textAlign: 'center' }}
                  />
                  <select
                    value={w.transport || '도보'}
                    onChange={e => onUpdate(d => ({ ...d, waypoints: safeArr(d.waypoints).map(x => x.id === w.id ? { ...x, transport: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 10px', fontSize: 12 }}
                  >
                    {TRANSPORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <input
                    placeholder="소요"
                    value={w.duration || ''}
                    onChange={e => onUpdate(d => ({ ...d, waypoints: safeArr(d.waypoints).map(x => x.id === w.id ? { ...x, duration: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 10px', fontSize: 12, textAlign: 'center' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 지출 */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={css.sectionH}>
            지출 {exs.length > 0 && <span style={{ fontFamily: T.S, fontStyle: 'normal', fontSize: 14, color: T.sub, fontWeight: 400 }}>· {exs.length}건</span>}
          </h2>
          <button
            onClick={() => onUpdate(d => ({ ...d, expenses: [...safeArr(d.expenses), { id: uid(), amount: '', currency: trip.currency || 'KRW', category: '식비', memo: '' }] }))}
            style={{ ...css.secondaryBtn, fontSize: 11 }}
          >
            <Plus size={12}/> 지출 추가
          </button>
        </div>
        {exs.length === 0 ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', background: T.soft, border: `1px dashed ${T.border}`, borderRadius: 4, fontFamily: T.S, fontSize: 12, color: T.sub }}>
            그날의 지출을 기록해보세요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exs.map(ex => (
              <div key={ex.id} style={{ background: T.soft, border: `1px solid ${T.border}`, borderRadius: 4, padding: '10px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 80px 80px 1fr 30px', gap: 6, alignItems: 'center' }}>
                  <select
                    value={ex.category || '식비'}
                    onChange={e => onUpdate(d => ({ ...d, expenses: safeArr(d.expenses).map(x => x.id === ex.id ? { ...x, category: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 8px', fontSize: 11 }}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="금액"
                    value={ex.amount || ''}
                    onChange={e => onUpdate(d => ({ ...d, expenses: safeArr(d.expenses).map(x => x.id === ex.id ? { ...x, amount: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 8px', fontSize: 12, textAlign: 'right' }}
                  />
                  <select
                    value={ex.currency || 'KRW'}
                    onChange={e => onUpdate(d => ({ ...d, expenses: safeArr(d.expenses).map(x => x.id === ex.id ? { ...x, currency: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 8px', fontSize: 11 }}
                  >
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    placeholder="메모"
                    value={ex.memo || ''}
                    onChange={e => onUpdate(d => ({ ...d, expenses: safeArr(d.expenses).map(x => x.id === ex.id ? { ...x, memo: e.target.value } : x) }))}
                    style={{ ...css.input, padding: '6px 10px', fontSize: 12 }}
                  />
                  <button
                    onClick={() => onUpdate(d => ({ ...d, expenses: safeArr(d.expenses).filter(x => x.id !== ex.id) }))}
                    style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 4, display: 'inline-flex' }}
                  >
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ============================================================================
// TRIP FORM MODAL — 생성/수정
// ============================================================================
function TripFormModal({ mode, trip, onClose, onSave }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(isEdit ? {
    title: trip.title || '',
    country: trip.country || '',
    flag: trip.flag || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    currency: trip.currency || 'KRW',
    accent: trip.accent || ACCENTS[0].color,
    coverImage: trip.coverImage || null,
  } : {
    title: '', country: '', flag: '', startDate: '', endDate: '',
    currency: 'KRW', accent: ACCENTS[0].color, coverImage: null,
  });

  const valid = form.title && form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate);
  const dc = valid ? dateRange(form.startDate, form.endDate).length : 0;

  const handleCountry = (v) => {
    const f = guessFlag(v);
    setForm({ ...form, country: v, flag: f || form.flag });
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await fileToB64(file);
    const img = await resizeImg(raw, 1600);
    setForm({ ...form, coverImage: img });
    if (e.target) e.target.value = '';
  };

  const save = () => {
    if (!valid) return;
    const newDates = dateRange(form.startDate, form.endDate);
    if (isEdit) {
      const oldDayMap = Object.fromEntries(safeArr(trip.days).map(d => [d.date, d]));
      const newDays = newDates.map(date => oldDayMap[date] || { date, waypoints: [], diary: '', photos: [], expenses: [] });
      onSave({ ...form, days: newDays });
    } else {
      onSave({
        id: uid(), ...form, flag: form.flag || '✈',
        days: newDates.map(date => ({ date, waypoints: [], diary: '', photos: [], expenses: [] })),
      });
    }
  };

  return (
    <div style={css.modalBg} onClick={onClose}>
      <div style={css.modal} onClick={e => e.stopPropagation()} className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 14px' }}>
          <div>
            <div style={css.eyebrow}>{isEdit ? 'Edit Journey' : 'New Journey'}</div>
            <h2 style={{ fontFamily: T.D, fontSize: 24, fontWeight: 500, margin: 0, color: T.ink }}>
              {isEdit ? '여행 정보 수정' : '새 여행 시작하기'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, padding: 6, display: 'inline-flex' }}><X size={16}/></button>
        </div>
        <div style={{ padding: '0 24px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={css.label}>표지 사진 (선택)</label>
            {form.coverImage ? (
              <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`, aspectRatio: '21/9', background: '#000' }}>
                <img src={form.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                <button onClick={() => setForm({ ...form, coverImage: null })} style={{ position: 'absolute', top: 8, right: 8, padding: 6, background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', borderRadius: 3, cursor: 'pointer', display: 'inline-flex' }}>
                  <X size={14}/>
                </button>
              </div>
            ) : (
              <label style={{ display: 'block', padding: '24px 16px', textAlign: 'center', background: T.soft, border: `2px dashed ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: T.S, fontSize: 12, color: T.sub }}>
                <ImageIcon size={20} style={{ display: 'block', margin: '0 auto 6px', opacity: .5 }}/>
                클릭하여 표지 사진 업로드
                <input type="file" accept="image/*" onChange={handleCoverFile} style={{ display: 'none' }}/>
              </label>
            )}
          </div>

          <div>
            <label style={css.label}>여행 제목</label>
            <input style={css.input} placeholder="도쿄 벚꽃 여행 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 88px', gap: 10 }}>
            <div>
              <label style={css.label}>
                국가 {guessFlag(form.country) && <span style={{ color: T.success, fontSize: 9, marginLeft: 4 }}>자동 {guessFlag(form.country)}</span>}
              </label>
              <input style={css.input} placeholder="일본, Thailand…" value={form.country} onChange={e => handleCountry(e.target.value)}/>
            </div>
            <div>
              <label style={css.label}>국기</label>
              <input style={{ ...css.input, textAlign: 'center', fontSize: 22, padding: '7px 4px' }} placeholder="🇯🇵" value={form.flag} onChange={e => setForm({ ...form, flag: e.target.value })}/>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={css.label}>시작일</label>
              <input type="date" style={css.input} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/>
            </div>
            <div>
              <label style={css.label}>종료일</label>
              <input type="date" style={css.input} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}/>
            </div>
          </div>

          {dc > 0 && (
            <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 12, color: T.accent, textAlign: 'right', marginTop: -8 }}>
              · {dc}일 여행
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, alignItems: 'flex-start' }}>
            <div>
              <label style={css.label}>기본 통화</label>
              <select style={css.input} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={css.label}>표지 색상</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {ACCENTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setForm({ ...form, accent: a.color })}
                    title={a.label}
                    style={{
                      width: 28, height: 28, borderRadius: 3, background: a.color, padding: 0,
                      border: form.accent === a.color ? `2px solid ${T.ink}` : `2px solid ${T.border}`,
                      cursor: 'pointer',
                      boxShadow: form.accent === a.color ? `0 0 0 2px ${T.bg},0 0 0 3px ${T.ink}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '16px 24px 22px', borderTop: `1px solid ${T.border}`, marginTop: 14 }}>
          <button onClick={onClose} style={css.secondaryBtn}>취소</button>
          <button onClick={save} disabled={!valid} style={{ ...css.primaryBtn, flex: 1, justifyContent: 'center' }}>
            {isEdit ? '저장' : '여행 만들기'} <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SYNC PANEL
// ============================================================================
function SyncPanel({ current, onClose, onApply }) {
  const [code, setCode] = useState(current || '');
  const fbReady = isFirebaseConfigured();

  return (
    <div style={css.modalBg} onClick={onClose}>
      <div style={{ ...css.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()} className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '22px 24px 14px' }}>
          <h2 style={{ fontFamily: T.D, fontSize: 22, fontWeight: 500, margin: 0, color: T.ink }}>클라우드 동기화</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, padding: 6, display: 'inline-flex' }}><X size={16}/></button>
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          {!fbReady && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 4, padding: '10px 14px', marginBottom: 14, fontFamily: T.S, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
              ⚠ Firebase가 설정되지 않아 이 기기에서만 데이터가 보존됩니다. 설정 탭에서 Firebase 연결 안내를 확인하세요.
            </div>
          )}
          <p style={{ fontFamily: T.S, fontSize: 13, color: T.sub, lineHeight: 1.7, margin: '0 0 14px' }}>
            모든 기기에서 같은 코드를 입력하면 실시간 동기화됩니다.
          </p>
          <label style={css.label}>코드</label>
          <input
            style={css.input}
            value={code}
            onChange={e => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="bae-travel-2026"
            maxLength={30}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {current && <button onClick={() => onApply('')} style={{ ...css.secondaryBtn, color: T.danger, borderColor: '#FCA5A5' }}>해제</button>}
            <button onClick={onClose} style={css.secondaryBtn}>취소</button>
            <button onClick={() => onApply(code)} disabled={!code.trim()} style={{ ...css.primaryBtn, flex: 1, justifyContent: 'center' }}>
              <Check size={14}/> 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BLOG WRITER — 사진 업로드 + AI 캡션 + AI 글 생성 + SEO 분석
// ============================================================================
function BlogWriter({ apiKey, sample, onNeedKey }) {
  const [meta, setMeta] = useState({ title: '', day: '', intro: '', hashtags: '' });
  const [scenes, setScenes] = useState([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [captionLoading, setCaptionLoading] = useState({});
  const [pickingGP, setPickingGP] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [copied, setCopied] = useState(false);
  const [view, setBView] = useState('edit');  // edit | preview | seo
  const [seoData, setSeoData] = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const fileRef = useRef(null);

  const useGP = isGoogleConfigured();

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newScenes = await Promise.all(files.map(async f => {
      const raw = await fileToB64(f);
      const img = await resizeImg(raw);
      return {
        id: uid(), imageBase64: img,
        caption: '', memo: '', place: '', menu: '',
      };
    }));
    setScenes(p => [...p, ...newScenes]);
    if (e.target) e.target.value = '';
  };

  const importFromGP = async () => {
    if (!useGP) {
      alert('Google Photos 연동이 설정되지 않았습니다.\n설정 탭의 안내를 확인하세요.');
      return;
    }
    setPickingGP(true);
    try {
      const items = await pickFromGooglePhotos({
        onSessionStart: () => alert('새 탭에서 Google Photos가 열립니다.\n사진을 선택한 후 "완료"를 누르세요.'),
      });
      if (!items?.length) { setPickingGP(false); return; }
      const newScenes = [];
      for (const item of items) {
        const blob = await downloadGoogleMedia(item);
        const raw = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        const img = await resizeImg(raw);
        newScenes.push({
          id: uid(), imageBase64: img,
          caption: '', memo: '', place: '', menu: '',
          source: 'google-photos',
        });
      }
      setScenes(p => [...p, ...newScenes]);
    } catch (err) {
      alert('Google Photos 가져오기 실패: ' + err.message);
    }
    setPickingGP(false);
  };

  const updateScene = (id, k, v) => setScenes(p => p.map(s => s.id === id ? { ...s, [k]: v } : s));
  const removeScene = (id) => setScenes(p => p.filter(s => s.id !== id));

  const generateCaption = async (sceneId) => {
    if (!apiKey) { alert('Gemini API 키를 설정 탭에 입력해주세요.'); onNeedKey(); return; }
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene?.imageBase64) return;
    setCaptionLoading(p => ({ ...p, [sceneId]: true }));
    try {
      const base64 = scene.imageBase64.split(',')[1];
      const mime = scene.imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: '이 사진의 핵심을 담은 한국어 한 줄 캡션을 만들어주세요. 15자 이내로 짧고 사실적으로. 캡션만 출력하고 따옴표나 설명은 하지 마세요.' },
            { inline_data: { mime_type: mime, data: base64 } }
          ]}],
          generationConfig: { temperature: 0.4, maxOutputTokens: 60 },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const cap = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["'""]|["'""]$/g, '');
      if (cap) updateScene(sceneId, 'caption', cap);
    } catch (err) {
      alert('캡션 실패: ' + err.message);
    }
    setCaptionLoading(p => ({ ...p, [sceneId]: false }));
  };

  const onDragStart = (e, i) => { setDraggedIdx(i); try { e.dataTransfer.setData('text/plain', String(i)); } catch {} };
  const onDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = (e, i) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === i) { setDraggedIdx(null); setDragOverIdx(null); return; }
    const a = [...scenes];
    const [moved] = a.splice(draggedIdx, 1);
    a.splice(i, 0, moved);
    setScenes(a);
    setDraggedIdx(null); setDragOverIdx(null);
  };

  const generate = async () => {
    if (!apiKey) { alert('Gemini API 키가 필요합니다.'); onNeedKey(); return; }
    if (!meta.title || !scenes.length) { alert('제목과 최소 1장의 사진이 필요합니다.'); return; }
    setLoading(true); setResult(''); setBView('preview');

    const scenesText = scenes.map((s, i) => {
      const lines = [`[장면 ${i + 1}]`];
      if (s.caption) lines.push(`- 사진 캡션: ${s.caption}`);
      if (s.place) lines.push(`- 장소: ${s.place}`);
      if (s.menu) lines.push(`- 메뉴/디테일: ${s.menu}`);
      lines.push(`- 메모: ${s.memo || '(없음)'}`);
      return lines.join('\n');
    }).join('\n\n');

    const prompt = `당신은 한국 의사 출신 여행 블로거의 글쓰기 어시스턴트입니다. 아래 [샘플 글]의 문체를 정확히 모방하여 한 편의 완결된 블로그 글을 작성해주세요.

[작성자 문체 핵심 특징]
${STYLE_NOTES}

[샘플 글]
${sample}

[이번 여행 정보]
- 제목/여행지: ${meta.title}
- 일차/일자: ${meta.day || '(미지정)'}
- 도입부 분위기: ${meta.intro || '(자유롭게)'}
- 해시태그: ${meta.hashtags || '(자동 생성)'}

[장면 데이터 — 시간순]
${scenesText}

[작성 규칙]
1. 첫 줄 해시태그 (# 기호 + 띄어쓰기)
2. 도입 단락 → 각 장면 단락 → 마무리 단락
3. 사진 자리는 [📷 N] 한 줄 캡션 형식
4. 평어체, 부사, 추측 표현 자연스럽게
5. 마지막은 "~로 N일차 일정이 마무리되었다" 또는 "~여행 후기를 마친다" 형식

블로그 글 본문만 출력해주세요.`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 3000 },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '생성 실패';
      setResult(text);
    } catch (err) {
      // 에러 발생 시 입력했던 내용은 유지하고 편집 화면으로 복귀
      alert('글 생성 실패: ' + err.message + '\n\n입력하신 사진과 내용은 그대로 유지됩니다.');
      setBView('edit');
    }
    setLoading(false);
  };

  const analyzeSeo = async () => {
    if (!result) { alert('먼저 글을 생성하세요.'); return; }
    if (!apiKey) { alert('API 키가 필요합니다.'); onNeedKey(); return; }
    setSeoLoading(true); setSeoData(null); setBView('seo');

    const cleanText = result.replace(/\[📷[^\]]*\]/g, '').trim();
    const charCount = cleanText.replace(/\s/g, '').length;
    const imageCount = (result.match(/\[📷\s*\d+\]/g) || []).length;
    const hashtagLine = result.match(/^#.+/m)?.[0] || '';
    const hashtagCount = (hashtagLine.match(/#\S+/g) || []).length;
    const paragraphs = result.split(/\n{2,}/).filter(p => p.trim().length > 20);

    const lengthScore = charCount >= 3000 ? 20 : charCount >= 1500 ? 18 : charCount >= 1000 ? 14 : charCount >= 500 ? 8 : 0;
    const imageScore = imageCount >= 6 && imageCount <= 10 ? 15 : imageCount >= 3 ? 12 : imageCount >= 1 ? 6 : 0;
    const tagScore = hashtagCount >= 3 && hashtagCount <= 5 ? 10 : hashtagCount >= 6 && hashtagCount <= 9 ? 7 : hashtagCount >= 10 ? 3 : hashtagCount >= 1 ? 5 : 0;

    const aiPrompt = `당신은 네이버 블로그 SEO 전문가입니다. 아래 블로그 글을 분석해주세요.

[자동 측정]
- 글자수: ${charCount.toLocaleString()}자
- 이미지: ${imageCount}장
- 해시태그: ${hashtagCount}개
- 단락 수: ${paragraphs.length}개

[블로그 글]
${result.slice(0, 3500)}${result.length > 3500 ? '\n...(생략)' : ''}

아래 JSON 형식만 출력하세요. 다른 텍스트 없이:
{
  "keyword_score": 0~25 정수,
  "readability_score": 0~15 정수,
  "info_score": 0~15 정수,
  "keyword_feedback": "키워드 한 줄 피드백",
  "readability_feedback": "가독성 한 줄 피드백",
  "info_feedback": "정보 충실도 한 줄 피드백",
  "improvements": ["제안1", "제안2", "제안3"],
  "suggested_keywords": ["키워드1","키워드2","키워드3","키워드4","키워드5"],
  "overall_comment": "전반적 총평"
}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: aiPrompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1500,
            // ★ Structured Output — JSON을 강제로 유효하게 만듦
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                keyword_score:        { type: 'integer' },
                readability_score:    { type: 'integer' },
                info_score:           { type: 'integer' },
                keyword_feedback:     { type: 'string' },
                readability_feedback: { type: 'string' },
                info_feedback:        { type: 'string' },
                improvements:         { type: 'array', items: { type: 'string' } },
                suggested_keywords:   { type: 'array', items: { type: 'string' } },
                overall_comment:      { type: 'string' },
              },
              required: ['keyword_score', 'readability_score', 'info_score', 'overall_comment'],
            },
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // 강력한 JSON 파싱 — 3단계 fallback
      let json;
      try {
        // 1차: 그대로 파싱 (structured output이면 거의 성공)
        json = JSON.parse(raw);
      } catch (e1) {
        try {
          // 2차: markdown 펜스 제거 + 중괄호 추출
          let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const fb = cleaned.indexOf('{'), lb = cleaned.lastIndexOf('}');
          if (fb >= 0 && lb > fb) cleaned = cleaned.slice(fb, lb + 1);
          json = JSON.parse(cleaned);
        } catch (e2) {
          try {
            // 3차: 줄바꿈 이스케이프 + 제어문자 제거
            let fixed = raw
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            const fb = fixed.indexOf('{'), lb = fixed.lastIndexOf('}');
            if (fb >= 0 && lb > fb) fixed = fixed.slice(fb, lb + 1);
            // 문자열 안의 줄바꿈을 \n으로 변환
            fixed = fixed.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
            json = JSON.parse(fixed);
          } catch (e3) {
            // 4차: 정규식으로 개별 필드 추출
            const extract = (key, isNum = false) => {
              const re = isNum
                ? new RegExp(`"${key}"\\s*:\\s*(\\d+)`)
                : new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
              return raw.match(re)?.[1];
            };
            const extractArr = (key) => {
              const re = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]+)\\]`);
              const m = raw.match(re);
              if (!m) return [];
              return [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
            };
            json = {
              keyword_score: parseInt(extract('keyword_score', true) || '0'),
              readability_score: parseInt(extract('readability_score', true) || '0'),
              info_score: parseInt(extract('info_score', true) || '0'),
              keyword_feedback: extract('keyword_feedback') || '분석 데이터 부분 손실',
              readability_feedback: extract('readability_feedback') || '분석 데이터 부분 손실',
              info_feedback: extract('info_feedback') || '분석 데이터 부분 손실',
              improvements: extractArr('improvements'),
              suggested_keywords: extractArr('suggested_keywords'),
              overall_comment: extract('overall_comment') || '분석 일부 누락. 다시 시도해보세요.',
            };
          }
        }
      }

      setSeoData({
        auto: { length: lengthScore, image: imageScore, hashtag: tagScore },
        ai: {
          keyword: Math.min(25, Math.max(0, json.keyword_score || 0)),
          readability: Math.min(15, Math.max(0, json.readability_score || 0)),
          info: Math.min(15, Math.max(0, json.info_score || 0)),
        },
        feedback: {
          keyword: json.keyword_feedback || '',
          readability: json.readability_feedback || '',
          info: json.info_feedback || '',
        },
        improvements: json.improvements || [],
        keywords: json.suggested_keywords || [],
        comment: json.overall_comment || '',
        meta: { charCount, imageCount, hashtagCount },
      });
    } catch (err) {
      setSeoData({ error: '분석 실패: ' + err.message });
    }
    setSeoLoading(false);
  };

  const renderPreview = (text) => {
    if (!text) return null;
    return text.split(/(\[📷\s*\d+\][^\n]*)/g).map((part, i) => {
      const m = part.match(/^\[📷\s*(\d+)\]\s*(.*)$/);
      if (m) {
        const s = scenes[parseInt(m[1]) - 1];
        return (
          <div key={i} style={{ margin: '20px 0', textAlign: 'center' }}>
            {s?.imageBase64 ? (
              <img src={s.imageBase64} alt={m[2]} style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 3, border: `1px solid ${T.border}` }}/>
            ) : (
              <div style={{ padding: 40, background: T.accentSoft, borderRadius: 3, fontFamily: T.S, fontSize: 12, color: T.sub }}>사진 #{parseInt(m[1])}</div>
            )}
            {m[2] && <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 13, color: T.sub, marginTop: 6 }}>{m[2]}</div>}
          </div>
        );
      }
      return <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: 6 }}>{part}</div>;
    });
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={css.eyebrow}>블로그 작성</div>
        <h1 style={css.hero}>여행을 <span style={{ fontStyle: 'italic', color: T.accent }}>글로</span></h1>
        <p style={css.lead}>사진을 올리고 느낌을 메모하면, 평소 문체로 완결된 블로그 글을 써드립니다.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        {[
          { id: 'edit', label: '편집' },
          { id: 'preview', label: '미리보기' },
          { id: 'seo', label: '품질 분석' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setBView(t.id)}
            style={{
              padding: '10px 16px', fontFamily: T.S, fontSize: 12, fontWeight: 500,
              color: view === t.id ? T.ink : T.sub,
              background: 'none', border: 'none',
              borderBottom: `2px solid ${view === t.id ? T.accent : 'transparent'}`,
              marginBottom: -1, cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}
      </div>

      {view === 'edit' && (
        <>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 22, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={css.label}>여행 제목 / 여행지</label>
              <input style={css.input} placeholder="춘천 가족여행 1일차" value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={css.label}>일차 / 일자</label>
                <input style={css.input} placeholder="2일차 / 2026.05.10" value={meta.day} onChange={e => setMeta({ ...meta, day: e.target.value })}/>
              </div>
              <div>
                <label style={css.label}>해시태그</label>
                <input style={css.input} placeholder="#춘천 #남이섬" value={meta.hashtags} onChange={e => setMeta({ ...meta, hashtags: e.target.value })}/>
              </div>
            </div>
            <div>
              <label style={css.label}>도입부 분위기</label>
              <textarea rows={2} style={css.textarea} placeholder="예: 노모 동반, 이동 최소화" value={meta.intro} onChange={e => setMeta({ ...meta, intro: e.target.value })}/>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: useGP ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
            {/* 로컬 업로드 */}
            <div
              style={{ border: `2px dashed ${T.border}`, borderRadius: 4, padding: '24px 16px', textAlign: 'center', background: T.soft, cursor: 'pointer', fontFamily: T.S, fontSize: 13, color: T.sub, lineHeight: 1.6 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={async e => { e.preventDefault(); await handleUpload({ target: { files: e.dataTransfer.files, value: '' } }); }}
            >
              <Upload size={20} style={{ display: 'block', margin: '0 auto 8px', color: T.sub }}/>
              <strong style={{ color: T.ink, fontWeight: 500 }}>이 기기에서 업로드</strong>
              <div style={{ marginTop: 4, fontSize: 11 }}>클릭 또는 드롭</div>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }}/>
            </div>

            {/* Google Photos */}
            {useGP && (
              <div
                style={{ border: `2px dashed ${T.border}`, borderRadius: 4, padding: '24px 16px', textAlign: 'center', background: T.soft, cursor: pickingGP ? 'wait' : 'pointer', fontFamily: T.S, fontSize: 13, color: T.sub, lineHeight: 1.6, opacity: pickingGP ? 0.6 : 1 }}
                onClick={() => !pickingGP && importFromGP()}
              >
                {pickingGP ? (
                  <>
                    <Loader2 size={20} className="spin" style={{ display: 'block', margin: '0 auto 8px', color: T.accent }}/>
                    <strong style={{ color: T.ink, fontWeight: 500 }}>가져오는 중…</strong>
                    <div style={{ marginTop: 4, fontSize: 11 }}>새 탭에서 사진 선택 후 완료</div>
                  </>
                ) : (
                  <>
                    <ExternalLink size={20} style={{ display: 'block', margin: '0 auto 8px', color: T.accent }}/>
                    <strong style={{ color: T.ink, fontWeight: 500 }}>Google Photos에서 가져오기</strong>
                    <div style={{ marginTop: 4, fontSize: 11 }}>클라우드 사진 직접 선택</div>
                  </>
                )}
              </div>
            )}
          </div>

          {scenes.length > 0 && <div style={{ ...css.label, marginBottom: 12 }}>{scenes.length}개 장면 · 핸들 드래그로 순서 변경</div>}

          {scenes.map((s, idx) => (
            <div
              key={s.id}
              style={{
                background: T.soft,
                border: `1px solid ${dragOverIdx === idx && draggedIdx !== idx ? T.accent : T.border}`,
                borderLeft: `3px solid ${T.accent}`, borderRadius: 3, padding: 18, marginBottom: 12,
                opacity: draggedIdx === idx ? 0.4 : 1, transition: 'border-color .15s, opacity .15s',
              }}
              onDragOver={e => onDragOver(e, idx)}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={e => onDrop(e, idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontFamily: T.D, fontSize: 13, fontStyle: 'italic', color: T.accent }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span draggable onDragStart={e => onDragStart(e, idx)} onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }} style={{ cursor: 'grab', color: T.sub, padding: 4, display: 'inline-flex', alignItems: 'center' }}>
                    <GripVertical size={14}/>
                  </span>
                  Scene {String(idx + 1).padStart(2, '0')}
                </span>
                <button onClick={() => removeScene(s.id)} style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                  <Trash2 size={14}/>
                </button>
              </div>
              {s.imageBase64 && <img src={s.imageBase64} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 3, background: '#F5F2EC', marginBottom: 12, display: 'block' }}/>}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...css.label, marginBottom: 0 }}>한 줄 캡션</label>
                  <button
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '5px 11px', background: captionLoading[s.id] ? T.accentLight : T.accentSoft,
                      border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 3,
                      fontFamily: T.S, fontSize: 11, cursor: captionLoading[s.id] ? 'wait' : 'pointer',
                    }}
                    onClick={() => generateCaption(s.id)}
                    disabled={captionLoading[s.id]}
                  >
                    {captionLoading[s.id] ? <><Loader2 size={11} className="spin"/> 분석 중</> : <><Sparkles size={11}/> AI 캡션</>}
                  </button>
                </div>
                <input style={css.input} placeholder="두짓타니 인피니티 풀 야간 풍경" value={s.caption} onChange={e => updateScene(s.id, 'caption', e.target.value)}/>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={css.label}>그때의 느낌 / 메모</label>
                <textarea rows={2} style={css.textarea} placeholder="야간 수영이 낮과 또 다른 매력" value={s.memo} onChange={e => updateScene(s.id, 'memo', e.target.value)}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={css.label}>장소 / 식당</label>
                  <input style={css.input} placeholder="fran's" value={s.place} onChange={e => updateScene(s.id, 'place', e.target.value)}/>
                </div>
                <div>
                  <label style={css.label}>메뉴 (선택)</label>
                  <input style={css.input} placeholder="봉골레 파스타" value={s.menu} onChange={e => updateScene(s.id, 'menu', e.target.value)}/>
                </div>
              </div>
            </div>
          ))}

          {scenes.length > 0 && (
            <button onClick={generate} disabled={loading} style={{ ...css.primaryBtn, width: '100%', padding: 14, fontSize: 14, justifyContent: 'center', marginTop: 8 }}>
              {loading ? <><Loader2 size={16} className="spin"/> 글 생성 중…</> : <><Sparkles size={16}/> 나의 문체로 블로그 글 생성</>}
            </button>
          )}
        </>
      )}

      {view === 'preview' && (
        <>
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', color: T.sub }}>
              <Loader2 size={24} className="spin" style={{ display: 'inline-block', marginBottom: 12 }}/>
              <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 18 }}>당신의 문체를 음미하는 중…</div>
            </div>
          )}
          {!loading && result && (
            <>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: '32px 28px', lineHeight: 1.95, fontSize: 15, fontFamily: T.B, color: T.ink }}>
                {renderPreview(result)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button style={css.secondaryBtn} onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? <><Check size={12}/> 복사됨</> : <><Copy size={12}/> 본문 복사</>}
                </button>
                <button style={css.secondaryBtn} onClick={() => setBView('edit')}><Edit3 size={12}/> 편집으로</button>
                <button onClick={analyzeSeo} style={{ ...css.primaryBtn, marginLeft: 'auto' }}>
                  <BarChart3 size={14}/> SEO 분석
                </button>
              </div>
              <p style={{ fontFamily: T.S, fontSize: 11, color: T.sub, marginTop: 10, lineHeight: 1.7 }}>
                * 네이버 블로그에 붙여넣을 때 [📷 N] 자리에 사진을 끌어다 놓으세요.
              </p>
            </>
          )}
          {!loading && !result && (
            <div style={{ padding: 60, textAlign: 'center', color: T.sub }}>
              <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 18, marginBottom: 10 }}>아직 생성된 글이 없습니다.</div>
              <button style={css.secondaryBtn} onClick={() => setBView('edit')}>← 편집으로</button>
            </div>
          )}
        </>
      )}

      {view === 'seo' && (
        <>
          {seoLoading && (
            <div style={{ padding: 80, textAlign: 'center', color: T.sub }}>
              <Loader2 size={28} className="spin" style={{ display: 'inline-block', marginBottom: 14, color: T.accent }}/>
              <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 20 }}>품질 분석 중…</div>
            </div>
          )}
          {!seoLoading && seoData && !seoData.error && <SEOReport data={seoData} onBack={() => setBView('preview')} onRetry={analyzeSeo}/>}
          {!seoLoading && seoData?.error && (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ color: T.danger, fontFamily: T.S, fontSize: 13, marginBottom: 16 }}>{seoData.error}</div>
              <button style={css.secondaryBtn} onClick={() => setBView('preview')}>← 돌아가기</button>
            </div>
          )}
          {!seoLoading && !seoData && (
            <div style={{ padding: 60, textAlign: 'center', color: T.sub }}>
              <div style={{ fontFamily: T.D, fontStyle: 'italic', fontSize: 18, marginBottom: 10 }}>먼저 글을 생성하고 미리보기로 가세요.</div>
              <button style={css.secondaryBtn} onClick={() => setBView('edit')}>← 편집으로</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ============================================================================
// SEO REPORT
// ============================================================================
function SEOReport({ data, onBack, onRetry }) {
  const { auto, ai, feedback, improvements, keywords, comment, meta } = data;
  const totalAuto = auto.length + auto.image + auto.hashtag;
  const totalAI = ai.keyword + ai.readability + ai.info;
  const total = totalAuto + totalAI;

  const grade = total >= 80 ? { label: '우수', color: '#166534', bg: '#DCFCE7' }
              : total >= 60 ? { label: '보통', color: '#B45309', bg: '#FEF3C7' }
              : total >= 40 ? { label: '미흡', color: '#C2410C', bg: '#FEE2E2' }
              :               { label: '낮음', color: T.danger, bg: '#FEE2E2' };

  const items = [
    { label: '글 길이', max: 20, score: auto.length, auto: true, detail: `${meta.charCount.toLocaleString()}자` },
    { label: '이미지', max: 15, score: auto.image, auto: true, detail: `${meta.imageCount}장` },
    { label: '해시태그', max: 10, score: auto.hashtag, auto: true, detail: `${meta.hashtagCount}개` },
    { label: '키워드 최적화', max: 25, score: ai.keyword, auto: false, detail: feedback.keyword },
    { label: '가독성', max: 15, score: ai.readability, auto: false, detail: feedback.readability },
    { label: '정보 충실도', max: 15, score: ai.info, auto: false, detail: feedback.info },
  ];

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={css.eyebrow}>네이버 블로그 SEO</div>
        <h1 style={css.hero}>품질 <span style={{ fontStyle: 'italic', color: T.accent }}>점수 리포트</span></h1>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke={T.border} strokeWidth="9"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke={grade.color} strokeWidth="9"
              strokeDasharray={`${2 * Math.PI * 42 * total / 100} ${2 * Math.PI * 42 * (1 - total / 100)}`}
              strokeDashoffset={2 * Math.PI * 42 * 0.25}
              strokeLinecap="round"
            />
            <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="600" fontFamily="Fraunces, serif" fill={T.ink}>{total}</text>
            <text x="50" y="60" textAnchor="middle" fontSize="10" fontFamily="Inter, sans-serif" fill={T.sub}>/100</text>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ padding: '3px 12px', background: grade.bg, color: grade.color, borderRadius: 99, fontFamily: T.S, fontSize: 11, fontWeight: 600, marginBottom: 8, display: 'inline-block' }}>
            {grade.label}
          </span>
          <p style={{ fontFamily: T.B, fontSize: 15, color: T.ink, lineHeight: 1.7, margin: 0 }}>{comment}</p>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ ...css.eyebrow, marginBottom: 16 }}>항목별 점수</div>
        {items.map((item, i) => {
          const pct = item.score / item.max;
          const barColor = pct >= 0.8 ? T.success : pct >= 0.6 ? T.accent : pct >= 0.4 ? '#B45309' : T.danger;
          return (
            <div key={i} style={{ marginBottom: i < items.length - 1 ? 18 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{ fontFamily: T.S, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontFamily: T.D, fontSize: 15, color: barColor }}>{item.score}<span style={{ fontSize: 11, color: T.sub, fontFamily: T.S }}>/{item.max}</span></span>
              </div>
              <div style={{ height: 5, background: T.border, borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: barColor, borderRadius: 99, transition: 'width .8s ease' }}/>
              </div>
              <div style={{ fontFamily: T.S, fontSize: 11, color: T.sub, lineHeight: 1.5 }}>{item.detail}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: '18px 20px' }}>
          <div style={{ ...css.eyebrow, marginBottom: 12 }}>개선 제안</div>
          {improvements.map((imp, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 3, background: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: T.S, fontSize: 9, fontWeight: 700, color: T.accent }}>{i + 1}</div>
              <div style={{ fontFamily: T.S, fontSize: 12, color: T.ink, lineHeight: 1.6 }}>{imp}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: '18px 20px' }}>
          <div style={{ ...css.eyebrow, marginBottom: 12 }}>추천 검색 키워드</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.map((kw, i) => (
              <span key={i}
                style={{ padding: '5px 12px', background: T.accentSoft, border: `1px solid ${T.accentLight}`, borderRadius: 3, fontFamily: T.S, fontSize: 12, color: T.accent, cursor: 'pointer' }}
                title="클릭하여 복사"
                onClick={() => navigator.clipboard.writeText(kw)}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={css.secondaryBtn} onClick={onBack}>← 미리보기</button>
        <button style={css.secondaryBtn} onClick={onRetry}><Loader2 size={12}/> 재분석</button>
      </div>
    </>
  );
}

// ============================================================================
// STYLE SAMPLES
// ============================================================================
function StyleSamples({ sample, onChange }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={css.eyebrow}>문체 샘플</div>
        <h1 style={css.hero}>나의 <span style={{ fontStyle: 'italic', color: T.accent }}>글쓰기 톤</span></h1>
        <p style={css.lead}>AI가 글을 생성할 때 이 샘플을 기반으로 문체를 학습합니다.</p>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24 }}>
        <label style={css.label}>샘플글 (2,000–5,000자 권장)</label>
        <textarea rows={20} style={{ ...css.textarea, fontSize: 13 }} value={sample} onChange={e => onChange(e.target.value)}/>
        <p style={{ fontFamily: T.S, fontSize: 11, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
          현재 {sample.length.toLocaleString()}자
        </p>
        <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: '20px 0' }}/>
        <div style={css.label}>학습된 문체 시그니처</div>
        <pre style={{ fontFamily: T.S, fontSize: 12, color: T.sub, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{STYLE_NOTES}</pre>
      </div>
    </>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================
function SettingsTab({ apiKey, onApiKeyChange, cloudStatus, syncCode }) {
  const [show, setShow] = useState(false);
  const fbReady = isFirebaseConfigured();

  const handleExport = () => {
    const data = loadLS() || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm('모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return;
    if (!confirm('정말로 삭제할까요? 되돌릴 수 없습니다.')) return;
    localStorage.removeItem(LS_KEY);
    location.reload();
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={css.eyebrow}>설정</div>
        <h1 style={css.hero}><span style={{ fontStyle: 'italic', color: T.accent }}>API</span> · 동기화</h1>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24, marginBottom: 14 }}>
        <div style={css.label}>① Google Gemini API Key (필수)</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input type={show ? 'text' : 'password'} style={{ ...css.input, flex: 1 }} placeholder="AIza…" value={apiKey} onChange={e => onApiKeyChange(e.target.value)}/>
          <button style={css.secondaryBtn} onClick={() => setShow(p => !p)}>{show ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
        </div>
        <p style={{ fontFamily: T.S, fontSize: 11, color: T.sub, marginTop: 8, lineHeight: 1.7 }}>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: T.accent }}>aistudio.google.com/apikey</a> 무료 발급 · 분당 15회 / 일 1,500회
        </p>
        {apiKey && <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontFamily: T.S, fontSize: 11 }}><Check size={11}/> 입력됨</div>}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={css.label}>② Firebase 동기화 (선택)</div>
          {fbReady ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontFamily: T.S, fontSize: 11 }}>
              <Check size={11}/> 설정됨{syncCode && cloudStatus === 'ok' && <> · {syncCode}</>}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontFamily: T.S, fontSize: 11 }}>미설정</span>
          )}
        </div>
        <p style={{ fontFamily: T.S, fontSize: 12, color: T.sub, lineHeight: 1.7, margin: '10px 0 0' }}>
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>console.firebase.google.com</a>에서 프로젝트를 만들고 다음을 <code style={{ padding: '1px 5px', background: T.soft, borderRadius: 3, fontSize: 11 }}>.env.local</code>에 등록:
        </p>
        <pre style={{ fontFamily: 'monospace', fontSize: 11, background: T.soft, padding: '10px 14px', borderRadius: 3, marginTop: 8, color: T.ink, lineHeight: 1.6, overflowX: 'auto', border: `1px solid ${T.border}` }}>
{`VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.firebasestorage.app
VITE_FIREBASE_APP_ID=1:xxx:web:xxx`}
        </pre>
        <p style={{ fontFamily: T.S, fontSize: 11, color: T.sub, marginTop: 8, lineHeight: 1.6 }}>
          Firebase 콘솔에서 Firestore + Storage 활성화 필요
        </p>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={css.label}>③ Google Photos 가져오기 (선택)</div>
          {isGoogleConfigured() ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontFamily: T.S, fontSize: 11 }}>
              <Check size={11}/> 설정됨
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontFamily: T.S, fontSize: 11 }}>미설정</span>
          )}
        </div>
        <p style={{ fontFamily: T.S, fontSize: 12, color: T.sub, lineHeight: 1.7, margin: '10px 0 0' }}>
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: T.accent }}>Google Cloud Console</a>에서 OAuth Client ID 발급 후 등록:
        </p>
        <ol style={{ fontFamily: T.S, fontSize: 12, color: T.sub, lineHeight: 1.8, margin: '6px 0 0', paddingLeft: 18 }}>
          <li>프로젝트 만들기 → Photos Picker API 활성화</li>
          <li>OAuth consent screen → External → 본인 Gmail을 Test users에 등록</li>
          <li>Credentials → OAuth 2.0 Client ID (Web application)</li>
          <li>Authorized JavaScript origins에 배포 도메인 등록</li>
          <li><code>VITE_GOOGLE_CLIENT_ID</code> 환경변수로 등록</li>
        </ol>
        <div style={{ marginTop: 12, padding: '10px 14px', background: T.accentSoft, border: `1px solid ${T.accentLight}`, borderRadius: 3, fontFamily: T.S, fontSize: 11, color: T.accent, lineHeight: 1.6 }}>
          ❗ <strong>네이버 마이박스</strong>는 외부 API가 공개되지 않아 직접 연동 불가능. 마이박스 앱에서 다운로드 후 업로드해야 합니다.
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: 24 }}>
        <div style={css.label}>데이터 관리</div>
        <p style={{ fontFamily: T.S, fontSize: 12, color: T.sub, lineHeight: 1.7, margin: '10px 0 14px' }}>
          {fbReady && syncCode ? '클라우드(Firebase)와 이 브라우저에 모두 저장 중.' : '이 브라우저의 localStorage에만 저장 중.'}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={css.secondaryBtn}>
            <Briefcase size={12}/> JSON 백업 내보내기
          </button>
          <button onClick={handleClear} style={{ ...css.secondaryBtn, color: T.danger, borderColor: '#FCA5A5' }}>
            <Trash2 size={12}/> 로컬 데이터 초기화
          </button>
        </div>
      </div>
    </>
  );
}
