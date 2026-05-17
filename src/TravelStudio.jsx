import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, MapPin, Cloud, CloudOff, X, ChevronRight,
  Sparkles, Copy, BookOpen, Briefcase, Loader2,
  Check, Camera, Edit3, Calendar, Upload, GripVertical,
  Map, ShieldCheck, Eye, EyeOff, Settings, Trash2, AlertCircle,
  Image as ImageIcon, ExternalLink, ArrowLeft
} from 'lucide-react';
import * as fb from './firebase.js';
import * as gp from './googlePhotos.js';

/* =============================================================================
   Travel Studio v1 — 통합 앱
   탭: 라이브러리 · 블로그 작성 · 문체 샘플 · 설정
   ============================================================================= */

// === 디자인 토큰 ============================================================
const T = {
  bg: '#FAF7F2', card: '#FFFFFF', cardSoft: '#FDFCF9',
  ink: '#1C1917', sub: '#78716C', border: '#E7E2D8',
  accent: '#134E4A', accentSoft: '#F0FDFA', accentLight: '#CCFBF1',
  danger: '#991B1B', success: '#166534',
  displayFont: '"Fraunces", "Noto Serif KR", serif',
  bodyFont:    '"Noto Serif KR", "Fraunces", serif',
  sansFont:    '"Inter", -apple-system, sans-serif',
  maxW: 920,
};

// === 상수 ====================================================================
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
  '미국':'🇺🇸','usa':'🇺🇸','united states':'🇺🇸',
  '영국':'🇬🇧','uk':'🇬🇧','프랑스':'🇫🇷','france':'🇫🇷',
  '독일':'🇩🇪','germany':'🇩🇪','이탈리아':'🇮🇹','italy':'🇮🇹',
  '스페인':'🇪🇸','spain':'🇪🇸','태국':'🇹🇭','thailand':'🇹🇭',
  '베트남':'🇻🇳','vietnam':'🇻🇳','대만':'🇹🇼','taiwan':'🇹🇼',
  '싱가포르':'🇸🇬','singapore':'🇸🇬','홍콩':'🇭🇰','hong kong':'🇭🇰',
  '호주':'🇦🇺','australia':'🇦🇺','캐나다':'🇨🇦','canada':'🇨🇦',
  '아랍에미리트':'🇦🇪','uae':'🇦🇪','dubai':'🇦🇪',
  '스위스':'🇨🇭','switzerland':'🇨🇭','오스트리아':'🇦🇹','austria':'🇦🇹',
};

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

const FACEAPI_SCRIPT = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js';
const FACEAPI_MODEL  = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';

// === 유틸 ====================================================================
const uid       = () => Math.random().toString(36).slice(2, 10);
const safeArr   = (v) => Array.isArray(v) ? v : [];
const fmtShort  = (d) => d ? new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
const dateRange = (s, e) => {
  const r = [], c = new Date(s), end = new Date(e);
  while (c <= end) { r.push(c.toISOString().slice(0, 10)); c.setDate(c.getDate() + 1); }
  return r;
};
const guessFlag = (c) => c ? FLAG_MAP[c.toLowerCase().trim()] || null : null;

// 사진 처리 헬퍼 (모듈 레벨 — 여러 컴포넌트에서 공유)
const fileToB64 = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const resizeImg = (b64, max=1280) => new Promise(res => {
  const img = new Image();
  img.onload = () => {
    let { width: w, height: h } = img;
    if (Math.max(w, h) <= max) { res(b64); return; }
    const s = max / Math.max(w, h); w = Math.round(w*s); h = Math.round(h*s);
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    res(c.toDataURL('image/jpeg', 0.85));
  };
  img.src = b64;
});

const SAMPLE_TRIPS = [
  { id:'t1', title:'방콕 가족여행', country:'태국', flag:'🇹🇭', startDate:'2026-01-15', endDate:'2026-01-19', currency:'THB', accent:'#134E4A', coverImage:null,
    days: dateRange('2026-01-15','2026-01-19').map(date=>({ date, waypoints:[], diary:'', photos:[], expenses:[] })) },
  { id:'t2', title:'도쿄 · 요코하마 학회', country:'일본', flag:'🇯🇵', startDate:'2026-03-10', endDate:'2026-03-14', currency:'JPY', accent:'#7F1D1D', coverImage:null,
    days: dateRange('2026-03-10','2026-03-14').map(date=>({ date, waypoints:[], diary:'', photos:[], expenses:[] })) },
];

// =============================================================================
// localStorage 헬퍼 (영속화)
// =============================================================================
const LS_KEY = 'travelstudio:v1';
const loadLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const saveLS = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {
    // QuotaExceededError - 사진 base64 때문에 자주 발생
    console.warn('localStorage 저장 실패 (용량 초과 가능):', e);
  }
};

// =============================================================================
// MAIN APP
// =============================================================================
export default function TravelStudio() {
  // 초기 상태를 localStorage에서 복원
  const initial = (typeof window !== 'undefined' && loadLS()) || {};

  const [tab, setTab]         = useState('library');
  const [trips, setTrips]     = useState(initial.trips || SAMPLE_TRIPS);
  const [selTrip, setSelTrip] = useState(null);
  const [selDay, setSelDay]   = useState(null);  // ★ 일자별 편집 진입
  const [showNew, setShowNew] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);  // ★ 여행 수정 모달
  const [syncCode, setSyncCode] = useState(initial.syncCode || '');
  const [showSync, setShowSync] = useState(false);
  const [apiKey, setApiKey]   = useState(initial.apiKey || '');
  const [sample, setSample]   = useState(initial.sample || DEFAULT_SAMPLE);
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle | syncing | ok | error | nofb
  const [suppressSave, setSuppressSave] = useState(false); // Firebase에서 받은 데이터로 덮어쓸 때 다시 저장 방지

  // ─── Firebase 동기화 ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!syncCode || !fb.isFirebaseConfigured()) {
      setCloudStatus(fb.isFirebaseConfigured() ? 'idle' : 'nofb');
      return;
    }
    let unsubscribe;
    let cancelled = false;
    setCloudStatus('syncing');

    (async () => {
      try {
        unsubscribe = await fb.fbSubscribe(syncCode, (data) => {
          if (cancelled) return;
          if (data?.trips) {
            setSuppressSave(true);
            setTrips(data.trips);
            if (data.sample) setSample(data.sample);
            setTimeout(() => setSuppressSave(false), 100);
          }
          setCloudStatus('ok');
        });
      } catch (err) {
        console.error('Firebase 구독 실패:', err);
        setCloudStatus('error');
      }
    })();

    return () => { cancelled = true; if (unsubscribe) unsubscribe(); };
  }, [syncCode]);

  // 변경 시 localStorage + Firebase 저장
  useEffect(() => {
    if (suppressSave) return;
    saveLS({ trips, syncCode, apiKey, sample });
    if (syncCode && fb.isFirebaseConfigured()) {
      fb.fbSave(syncCode, { trips, sample }).catch(err => {
        console.error('Firebase 저장 실패:', err);
        setCloudStatus('error');
      });
    }
  }, [trips, sample]);  // syncCode/apiKey 변경 시에는 저장 안 함 (무한 루프 방지)

  // syncCode/apiKey만 변경된 경우 localStorage만 업데이트
  useEffect(() => {
    saveLS({ trips, syncCode, apiKey, sample });
  }, [syncCode, apiKey]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Noto+Serif+KR:wght@400;500;600&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // ─── Trip CRUD 헬퍼 ──────────────────────────────────────────────────────
  const updateTrip = (tripId, updater) => {
    setTrips(prev => prev.map(t => t.id === tripId ? (typeof updater === 'function' ? updater(t) : { ...t, ...updater }) : t));
    if (selTrip?.id === tripId) {
      setSelTrip(prev => prev ? (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }) : prev);
    }
  };
  const deleteTrip = (tripId) => {
    if (!confirm('이 여행을 삭제하시겠습니까? 모든 일자별 기록도 함께 삭제됩니다.')) return;
    setTrips(prev => prev.filter(t => t.id !== tripId));
    if (selTrip?.id === tripId) setSelTrip(null);
  };

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.bodyFont, color:T.ink }}>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; }
        button { font-family:inherit; cursor:pointer; }
        input, textarea, select { font-family:inherit; }
        input[type="date"] { font-family:system-ui,sans-serif; color-scheme:light; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor:pointer; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(19,78,74,.18); border-radius:5px; }
        .spin { animation:spin 1s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .fade-up { animation:fadeUp .3s ease forwards; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .ts-card { transition:transform .2s,box-shadow .2s; }
        .ts-card:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(28,25,23,.08); }
        .ts-card:hover .ts-cover-img { transform:scale(1.04); }
        button:hover:not(:disabled) { opacity:.92; }
        button:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>

      {/* ── 상단 탭 네비 ── */}
      <nav style={{
        background:T.card, borderBottom:`1px solid ${T.border}`,
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:T.maxW, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, overflowX:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
            {[
              { id:'library', icon:<BookOpen size={14}/>, label:'라이브러리' },
              { id:'blog',    icon:<Edit3   size={14}/>, label:'블로그 작성' },
              { id:'samples', icon:<BookOpen size={14}/>, label:'문체 샘플' },
              { id:'settings',icon:<Settings size={14}/>, label:'설정' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'14px 14px',
                marginBottom:-1, color: tab===t.id ? T.ink : T.sub,
                fontFamily:T.sansFont, fontSize:12, fontWeight:500,
                background:'none', border:'none', whiteSpace:'nowrap',
                borderBottomWidth:2, borderBottomStyle:'solid',
                borderBottomColor: tab===t.id ? T.accent : 'transparent',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:16, color:T.accent, flexShrink:0 }}>
            Travel Studio
          </div>
        </div>
      </nav>

      {/* ── 탭 콘텐츠 ── */}
      <div style={{ maxWidth:T.maxW, margin:'0 auto', padding:'40px 20px 80px' }}>
        {tab==='library' && (
          selDay ? (
            <DayEditor
              trip={selTrip}
              dayIndex={selDay}
              syncCode={syncCode}
              apiKey={apiKey}
              onUpdateDay={(dayUpdater) => {
                updateTrip(selTrip.id, t => ({
                  ...t,
                  days: t.days.map((d, i) => i === selDay ? (typeof dayUpdater === 'function' ? dayUpdater(d) : { ...d, ...dayUpdater }) : d),
                }));
              }}
              onBack={() => setSelDay(null)}
            />
          ) : (
            <Library
              trips={trips} cloudStatus={cloudStatus} syncCode={syncCode}
              onSyncOpen={() => setShowSync(true)}
              onSelect={t => { setSelTrip(t); }}
              onNew={() => setShowNew(true)}
              selectedTrip={selTrip}
              onBack={() => setSelTrip(null)}
              onBlogFromTrip={t => { setSelTrip(null); setTab('blog'); }}
              onEditTrip={(t) => setEditingTrip(t)}
              onDeleteTrip={deleteTrip}
              onUpdateTrip={updateTrip}
              onSelectDay={(idx) => setSelDay(idx)}
            />
          )
        )}
        {tab==='blog' && (
          <BlogWriter
            apiKey={apiKey}
            sample={sample}
            onNeedKey={() => setTab('settings')}
          />
        )}
        {tab==='samples' && (
          <StyleSamples sample={sample} onChange={setSample} />
        )}
        {tab==='settings' && (
          <SettingsTab apiKey={apiKey} onChange={setApiKey} cloudStatus={cloudStatus} syncCode={syncCode} />
        )}
      </div>

      {showNew && (
        <TripFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSave={t => { setTrips(p => [t, ...p]); setShowNew(false); setSelTrip(t); }}
        />
      )}
      {editingTrip && (
        <TripFormModal
          mode="edit"
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSave={(updated) => { updateTrip(editingTrip.id, updated); setEditingTrip(null); }}
        />
      )}
      {showSync && (
        <SyncPanel current={syncCode} onClose={() => setShowSync(false)} onApply={c => { setSyncCode(c); setShowSync(false); }} />
      )}
    </div>
  );
}

// =============================================================================
// LIBRARY
// =============================================================================
function Library({ trips, cloudStatus, syncCode, onSyncOpen, onSelect, onNew, selectedTrip, onBack, onBlogFromTrip, onEditTrip, onDeleteTrip, onUpdateTrip, onSelectDay }) {
  // stats 계산 (메인에서 prop으로 받지 않고 여기서)
  const stats = useMemo(() => {
    const places = new Set();
    let days = 0;
    trips.forEach(t => safeArr(t.days).forEach(d => { days++; safeArr(d.waypoints).forEach(w => w.name && places.add(w.name)); }));
    return { trips: trips.length, days, places: places.size };
  }, [trips]);

  if (selectedTrip) {
    return <TripDetail
      trip={selectedTrip}
      onBack={onBack}
      onBlog={onBlogFromTrip}
      onEdit={() => onEditTrip(selectedTrip)}
      onDelete={() => onDeleteTrip(selectedTrip.id)}
      onUpdateTrip={onUpdateTrip}
      onSelectDay={onSelectDay}
    />;
  }
  return (
    <>
      <header style={{ marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={css.eyebrow}>여행 라이브러리</div>
          <h1 style={css.hero}>나의 <span style={{ fontStyle:'italic', color:T.accent }}>여행 기록</span></h1>
          <p style={css.lead}>동선·일기·사진·지출을 기록하고, 블로그 글까지 한 번에.</p>
        </div>
        <button onClick={onSyncOpen} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', background:T.card, border:`1px solid ${T.border}`, borderRadius:99, fontFamily:T.sansFont, fontSize:11, color:T.sub, cursor:'pointer' }}>
          {cloudStatus==='ok' ? <Cloud size={12} color={T.success}/> : <CloudOff size={12}/>}
          <span>{syncCode || '동기화'}</span>
          <CloudStatusDot status={cloudStatus}/>
        </button>
      </header>

      {stats.days > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, marginBottom:28 }}>
          {[{v:stats.trips,l:'여행'},{v:stats.days,l:'기록일'},{v:stats.places,l:'방문지'}].map((s,i)=>(
            <div key={s.l} style={{ padding:'18px 12px', borderLeft:i>0?`1px solid ${T.border}`:'none', textAlign:'center' }}>
              <div style={{ fontFamily:T.sansFont, fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:T.sub, marginBottom:4 }}>{s.l}</div>
              <div style={{ fontFamily:T.displayFont, fontSize:26, fontWeight:500, color:T.ink }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <h2 style={css.sectionH}>모든 여행</h2>
        <button onClick={onNew} style={css.primaryBtn}><Plus size={14}/> 새 여행</button>
      </div>

      {trips.length === 0 ? (
        <div style={{ padding:'80px 20px', textAlign:'center', background:T.cardSoft, border:`1px dashed ${T.border}`, borderRadius:4 }}>
          <div style={{ fontSize:32, opacity:.35, marginBottom:12 }}>✈</div>
          <h3 style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:20, margin:'0 0 8px' }}>첫 여행을 시작해 보세요</h3>
          <p style={{ fontFamily:T.sansFont, fontSize:13, color:T.sub, margin:'0 0 20px' }}>기록한 동선·사진은 그대로 블로그 글의 재료가 됩니다.</p>
          <button onClick={onNew} style={css.primaryBtn}><Plus size={14}/> 새 여행</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:18 }}>
          {trips.map(t => <TripCard key={t.id} trip={t} onClick={() => onSelect(t)} />)}
        </div>
      )}
    </>
  );
}

function TripCard({ trip, onClick }) {
  const days = safeArr(trip.days).length;
  const accent = trip.accent || T.accent;
  const cover  = trip.coverImage;

  return (
    <article onClick={onClick} className="ts-card" style={{
      background:T.card, border:`1px solid ${T.border}`, borderRadius:6, overflow:'hidden',
      cursor:'pointer', boxShadow:'0 1px 3px rgba(28,25,23,.05)', position:'relative',
    }}>
      <div style={{
        aspectRatio:'4/5', background: cover ? '#000' : accent,
        position:'relative', display:'flex', alignItems:'flex-end',
        padding:'22px 22px 26px', color:'#FAF7F2', overflow:'hidden',
      }}>
        {cover ? (
          <>
            <img src={cover} alt="" style={{
              position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', transition:'transform .6s ease',
            }} className="ts-cover-img"/>
            {/* 듀얼 그라디언트 — 위에서 살짝, 아래는 진하게 */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(to bottom, rgba(0,0,0,.25) 0%, transparent 30%, transparent 50%, rgba(0,0,0,.85) 100%)',
            }}/>
          </>
        ) : (
          <>
            {/* 솔리드 폴백 — 우상단 라이트, 좌하단 다크 */}
            <div style={{
              position:'absolute', inset:0,
              background:'radial-gradient(ellipse at top right, rgba(255,255,255,.12), transparent 55%)',
            }}/>
            <div style={{
              position:'absolute', top:18, right:20, fontSize:38, opacity:.95,
              filter:'drop-shadow(0 2px 8px rgba(0,0,0,.4))',
            }}>{trip.flag||'✈'}</div>
          </>
        )}

        {/* 표지 사진이 있을 때도 우상단에 작은 국기 뱃지 */}
        {cover && (
          <div style={{
            position:'absolute', top:14, right:14, padding:'5px 10px',
            background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
            borderRadius:99, fontSize:14, display:'inline-flex', alignItems:'center', gap:5,
          }}>
            <span>{trip.flag || '✈'}</span>
            <span style={{ fontFamily:T.sansFont, fontSize:10, fontWeight:500, letterSpacing:'0.08em' }}>{trip.country}</span>
          </div>
        )}

        <div style={{ position:'relative', zIndex:1, width:'100%' }}>
          {!cover && (
            <div style={{ fontFamily:T.sansFont, fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', opacity:.85, marginBottom:6 }}>
              {trip.country}
            </div>
          )}
          <h3 style={{
            fontFamily:T.displayFont, fontSize:24, fontWeight:500,
            margin:0, lineHeight:1.15, letterSpacing:'-0.01em',
            textShadow: cover ? '0 2px 12px rgba(0,0,0,.4)' : 'none',
          }}>
            {trip.title}
          </h3>
          <div style={{
            fontFamily:T.sansFont, fontSize:11, color:'rgba(255,255,255,.85)',
            marginTop:8, display:'flex', alignItems:'center', gap:8,
          }}>
            <span>{fmtShort(trip.startDate)} – {fmtShort(trip.endDate)}</span>
            <span style={{ opacity:.5 }}>·</span>
            <span>{days}일</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TripDetail({ trip, onBack, onBlog, onEdit, onDelete, onUpdateTrip, onSelectDay }) {
  const fileRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await fileToB64(file);
    const img = await resizeImg(raw, 1600);
    onUpdateTrip(trip.id, { coverImage: img });
    if (e.target) e.target.value = '';
  };

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
        <button onClick={onBack} style={{ ...css.secondaryBtn, fontSize:12 }}><ArrowLeft size={12}/> 라이브러리</button>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button onClick={onEdit} style={{ ...css.secondaryBtn, fontSize:12 }}><Edit3 size={12}/> 여행 정보 수정</button>
          <button onClick={onDelete} style={{ ...css.secondaryBtn, fontSize:12, color:T.danger, borderColor:'#FCA5A5' }}><Trash2 size={12}/></button>
        </div>
      </div>

      {/* Hero with editable cover */}
      <div style={{
        aspectRatio:'21/9', background: trip.coverImage?'#000':trip.accent,
        borderRadius:6, overflow:'hidden', marginBottom:14, position:'relative',
        display:'flex', alignItems:'flex-end', padding:32, color:'#FAF7F2',
      }}>
        {trip.coverImage ? (
          <>
            <img src={trip.coverImage} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.15) 50%, transparent 100%)' }}/>
          </>
        ) : (
          <>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at top right, rgba(255,255,255,.1), transparent 60%)' }}/>
            <div style={{ position:'absolute', top:20, right:24, fontSize:56, filter:'drop-shadow(0 4px 12px rgba(0,0,0,.35))' }}>{trip.flag}</div>
          </>
        )}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontFamily:T.sansFont, fontSize:10, letterSpacing:'0.2em', textTransform:'uppercase', opacity:.85, marginBottom:6 }}>{trip.country} · {fmtShort(trip.startDate)} – {fmtShort(trip.endDate)}</div>
          <h1 style={{ fontFamily:T.displayFont, fontSize:40, fontWeight:500, margin:0, lineHeight:1.05, textShadow: trip.coverImage?'0 2px 16px rgba(0,0,0,.4)':'none' }}>{trip.title}</h1>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            position:'absolute', top:16, left:16, padding:'7px 12px',
            background:'rgba(0,0,0,.55)', backdropFilter:'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,.18)', borderRadius:3,
            color:'#FAF7F2', fontFamily:T.sansFont, fontSize:11, fontWeight:500,
            cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
          }}
        >
          <ImageIcon size={12}/> {trip.coverImage ? '표지 변경' : '표지 사진 추가'}
        </button>
        {trip.coverImage && (
          <button
            onClick={() => onUpdateTrip(trip.id, { coverImage:null })}
            style={{
              position:'absolute', top:16, left:140, padding:'7px 10px',
              background:'rgba(0,0,0,.55)', backdropFilter:'blur(8px)',
              WebkitBackdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,.18)', borderRadius:3,
              color:'#FAF7F2', cursor:'pointer', display:'inline-flex',
            }}
            title="표지 사진 제거"
          >
            <X size={12}/>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display:'none' }}/>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h2 style={css.sectionH}>일자별 기록</h2>
        <button onClick={() => onBlog(trip)} style={css.primaryBtn}><Edit3 size={13}/> 블로그 글로 만들기</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {safeArr(trip.days).map((d, i) => {
          const wpCount = safeArr(d.waypoints).filter(w => w.name).length;
          const photoCount = safeArr(d.photos).length;
          const expCount = safeArr(d.expenses).length;
          const hasContent = wpCount || d.diary || photoCount || expCount;

          return (
            <div
              key={d.date}
              onClick={() => onSelectDay(i)}
              className="ts-card"
              style={{
                background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.accent}`,
                borderRadius:4, padding:'16px 20px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:14,
              }}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:T.sansFont, fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:T.sub, marginBottom:2 }}>Day {String(i+1).padStart(2,'0')}</div>
                <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:16, color:T.ink }}>
                  {new Date(d.date).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}
                </div>
                {hasContent ? (
                  <div style={{ marginTop:6, display:'flex', gap:12, flexWrap:'wrap', fontFamily:T.sansFont, fontSize:11, color:T.sub }}>
                    {wpCount > 0 && <span><MapPin size={10} style={{verticalAlign:-1}}/> {wpCount}곳</span>}
                    {photoCount > 0 && <span><Camera size={10} style={{verticalAlign:-1}}/> {photoCount}장</span>}
                    {d.diary && <span><BookOpen size={10} style={{verticalAlign:-1}}/> 일기 {d.diary.length}자</span>}
                    {expCount > 0 && <span><Briefcase size={10} style={{verticalAlign:-1}}/> 지출 {expCount}건</span>}
                  </div>
                ) : (
                  <div style={{ marginTop:4, fontFamily:T.sansFont, fontSize:11, color:T.sub, fontStyle:'italic' }}>비어있음 — 탭하여 입력</div>
                )}
              </div>
              {/* 첫 사진 미니 썸네일 */}
              {photoCount > 0 && (
                <img src={safeArr(d.photos)[0]?.url || safeArr(d.photos)[0]} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:3, border:`1px solid ${T.border}` }}/>
              )}
              <ChevronRight size={14} color={T.sub}/>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── CloudStatusDot ────────────────────────────────────────────────────────
function CloudStatusDot({ status }) {
  const map = {
    idle:    { color:'#CBD5E0', title:'동기화 안 됨' },
    syncing: { color:'#F6AD55', title:'동기화 중' },
    ok:      { color:T.success, title:'동기화 됨' },
    error:   { color:T.danger,  title:'동기화 오류' },
    nofb:    { color:'#CBD5E0', title:'Firebase 미설정' },
  };
  const s = map[status] || map.idle;
  return <span title={s.title} style={{ width:6, height:6, borderRadius:'50%', background:s.color, display:'inline-block' }}/>;
}

// =============================================================================
// DAY EDITOR — 일자별 입력 (간단 버전)
// =============================================================================
function DayEditor({ trip, dayIndex, syncCode, apiKey, onUpdateDay, onBack }) {
  const day = safeArr(trip.days)[dayIndex];
  if (!day) return <div>일자를 찾을 수 없습니다.</div>;

  const [uploading, setUploading] = useState(false);
  const [pickingGP, setPickingGP] = useState(false);
  const fileRef = useRef(null);

  // 사진 업로드 — Firebase Storage 사용 가능하면 그쪽으로, 아니면 base64 localStorage
  const uploadPhotos = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const newPhotos = [];
      for (const file of files) {
        if (syncCode && fb.isFirebaseConfigured()) {
          // Firebase Storage 업로드
          const { url, path } = await fb.fbUploadPhoto(syncCode, trip.id, file);
          newPhotos.push({ url, path, addedAt: Date.now() });
        } else {
          // localStorage 폴백 — base64
          const raw = await fileToB64(file);
          const img = await resizeImg(raw, 1280);
          newPhotos.push({ url: img, path: null, addedAt: Date.now() });
        }
      }
      onUpdateDay(d => ({ ...d, photos: [...safeArr(d.photos), ...newPhotos] }));
    } catch (err) {
      alert('사진 업로드 실패: ' + err.message);
    }
    setUploading(false);
  };

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files || []);
    await uploadPhotos(files);
    if (e.target) e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    await uploadPhotos(files);
  };

  const removePhoto = async (idx) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    const photo = safeArr(day.photos)[idx];
    if (photo?.path) {
      try { await fb.fbDeletePhoto(photo.path); } catch {}
    }
    onUpdateDay(d => ({ ...d, photos: safeArr(d.photos).filter((_, i) => i !== idx) }));
  };

  // Google Photos에서 가져오기
  const importFromGooglePhotos = async () => {
    if (!gp.isGoogleConfigured()) {
      alert('Google Photos 연동이 설정되지 않았습니다.\n설정 탭에서 Google Client ID 등록이 필요합니다.');
      return;
    }
    setPickingGP(true);
    try {
      const items = await gp.pickFromGooglePhotos({
        onSessionStart: () => alert('새 탭에서 Google Photos가 열립니다. 사진을 선택한 후 이 화면으로 돌아오세요.\n선택 완료까지 자동 감지됩니다.'),
      });
      if (!items?.length) { setPickingGP(false); return; }

      const newPhotos = [];
      for (const item of items) {
        const blob = await gp.downloadPickedMedia(item);
        const file = new File([blob], item.mediaFile?.filename || 'photo.jpg', { type: blob.type });
        if (syncCode && fb.isFirebaseConfigured()) {
          const { url, path } = await fb.fbUploadPhoto(syncCode, trip.id, file);
          newPhotos.push({ url, path, addedAt: Date.now(), source: 'google-photos' });
        } else {
          const raw = await fileToB64(file);
          const img = await resizeImg(raw, 1280);
          newPhotos.push({ url: img, path: null, addedAt: Date.now(), source: 'google-photos' });
        }
      }
      onUpdateDay(d => ({ ...d, photos: [...safeArr(d.photos), ...newPhotos] }));
    } catch (err) {
      alert('Google Photos 가져오기 실패: ' + err.message);
    }
    setPickingGP(false);
  };

  const photos = safeArr(day.photos);

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ ...css.secondaryBtn, fontSize:12 }}><ArrowLeft size={12}/> {trip.title}</button>
        <div style={{ marginLeft:'auto', fontFamily:T.sansFont, fontSize:11, color:T.sub }}>
          {syncCode && fb.isFirebaseConfigured()
            ? <><Cloud size={11} style={{verticalAlign:-1, color:T.success}}/> 클라우드 저장</>
            : <><CloudOff size={11} style={{verticalAlign:-1}}/> 이 기기에만 저장</>
          }
        </div>
      </div>

      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:T.sub, marginBottom:4, fontWeight:500 }}>
          Day {String(dayIndex+1).padStart(2,'0')} · {trip.country}
        </div>
        <h1 style={{ ...css.hero, fontSize:34 }}>
          {new Date(day.date).toLocaleDateString('ko-KR',{ year:'numeric', month:'long', day:'numeric', weekday:'long' })}
        </h1>
      </div>

      {/* 일기 */}
      <section style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <h2 style={css.sectionH}>일기</h2>
          <span style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub }}>{(day.diary || '').length}자</span>
        </div>
        <textarea
          value={day.diary || ''}
          onChange={e => onUpdateDay({ diary: e.target.value })}
          placeholder="오늘의 느낌, 인상 깊었던 순간, 기억하고 싶은 디테일을 자유롭게…"
          rows={6}
          style={{ ...css.textarea, fontSize:15, lineHeight:1.7, padding:'14px 16px' }}
        />
      </section>

      {/* 사진 */}
      <section style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <h2 style={css.sectionH}>사진 {photos.length > 0 && <span style={{ fontFamily:T.sansFont, fontStyle:'normal', fontSize:14, color:T.sub, fontWeight:400 }}>· {photos.length}장</span>}</h2>
          <div style={{ display:'flex', gap:6 }}>
            {gp.isGoogleConfigured() && (
              <button
                onClick={importFromGooglePhotos}
                disabled={pickingGP || uploading}
                style={{ ...css.secondaryBtn, fontSize:11 }}
              >
                {pickingGP ? <><Loader2 size={11} className="spin"/> 가져오는 중…</> : <><ExternalLink size={11}/> Google Photos</>}
              </button>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...css.secondaryBtn, fontSize:11 }}>
              {uploading ? <><Loader2 size={11} className="spin"/> 업로드…</> : <><Upload size={11}/> 사진 추가</>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display:'none' }}/>
          </div>
        </div>

        {photos.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:8 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position:'relative', aspectRatio:'1', borderRadius:3, overflow:'hidden', border:`1px solid ${T.border}` }}>
                <img src={p.url || p} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position:'absolute', top:4, right:4, padding:4,
                    background:'rgba(0,0,0,.55)', border:'none', color:'#fff',
                    borderRadius:3, cursor:'pointer', display:'inline-flex',
                  }}
                  title="삭제"
                >
                  <X size={12}/>
                </button>
                {p.source === 'google-photos' && (
                  <div style={{ position:'absolute', bottom:4, left:4, padding:'2px 6px', background:'rgba(0,0,0,.55)', borderRadius:99, color:'#fff', fontSize:9, fontFamily:T.sansFont }}>
                    G
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            style={{ padding:'40px 16px', textAlign:'center', background:T.cardSoft, border:`2px dashed ${T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.sansFont, fontSize:13, color:T.sub, lineHeight:1.6 }}
          >
            <ImageIcon size={28} style={{ display:'block', margin:'0 auto 10px', opacity:.4 }}/>
            <strong style={{ color:T.ink, fontWeight:500 }}>사진을 추가하세요</strong>
            <div style={{ marginTop:4 }}>클릭하거나 이 영역에 드롭</div>
          </div>
        )}
      </section>

      {/* 메모 (간단 버전 — Phase 2에서 동선/지출 추가 예정) */}
      <section>
        <div style={{ background:T.accentSoft, border:`1px solid ${T.accentLight}`, borderRadius:4, padding:'14px 18px' }}>
          <div style={{ fontFamily:T.sansFont, fontSize:11, color:T.accent, fontWeight:600, marginBottom:6 }}>📌 다음 업데이트 예정</div>
          <div style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, lineHeight:1.7 }}>
            동선(waypoint) 편집기 · 지출 입력 · 환율 자동 환산 · 라우트 타임라인 JPG 내보내기
          </div>
        </div>
      </section>
    </>
  );
}

// =============================================================================
// BLOG WRITER (TravelBlogGenerator 통합, Travel Studio 디자인 적용)
// =============================================================================
function BlogWriter({ apiKey, sample, onNeedKey }) {
  const [meta, setMeta]     = useState({ title:'', day:'', intro:'', hashtags:'' });
  const [scenes, setScenes] = useState([]);
  const [result, setResult] = useState('');
  const [loading, setLoading]         = useState(false);
  const [captionLoading, setCaptionLoading] = useState({});
  const [mosaicLoading, setMosaicLoading]   = useState({});
  const [draggedIdx, setDraggedIdx]   = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [faceApiState, setFaceApiState] = useState('idle');
  const [copied, setCopied]           = useState(false);
  const [view, setView]               = useState('edit'); // edit | preview | seo
  const [seoData, setSeoData]         = useState(null);
  const [seoLoading, setSeoLoading]   = useState(false);
  const fileRef = useRef(null);

  const ensureFaceApi = async () => {
    if (faceApiState === 'ready') return true;
    if (faceApiState === 'loading') return false;
    setFaceApiState('loading');
    try {
      if (!window.faceapi) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = FACEAPI_SCRIPT; s.onload = res; s.onerror = () => rej(new Error('로드 실패'));
          document.head.appendChild(s);
        });
      }
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACEAPI_MODEL);
      setFaceApiState('ready');
      return true;
    } catch { setFaceApiState('error'); return false; }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newScenes = await Promise.all(files.map(async f => {
      const raw = await fileToB64(f);
      const img = await resizeImg(raw);
      return { id: uid(), imageBase64:img, originalBase64:img, caption:'', memo:'', place:'', menu:'', mapImageBase64:null, mosaicApplied:false, facesDetected:0 };
    }));
    setScenes(p => [...p, ...newScenes]);
    if (e.target) e.target.value = '';
  };

  const handleMapUpload = async (sceneId, e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const img = await resizeImg(await fileToB64(f));
    setScenes(p => p.map(s => s.id===sceneId ? {...s, mapImageBase64:img} : s));
    if (e.target) e.target.value = '';
  };

  const updateScene = (id, k, v) => setScenes(p => p.map(s => s.id===id ? {...s,[k]:v} : s));
  const removeScene = (id) => setScenes(p => p.filter(s => s.id!==id));

  const generateCaption = async (sceneId) => {
    if (!apiKey) { alert('API 키를 설정 탭에서 입력해주세요.'); onNeedKey(); return; }
    const scene = scenes.find(s => s.id===sceneId);
    if (!scene?.imageBase64) return;
    setCaptionLoading(p => ({...p, [sceneId]:true}));
    try {
      const base64 = scene.imageBase64.split(',')[1];
      const mime   = scene.imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[
          { text:`이 사진의 핵심을 담은 한국어 한 줄 캡션을 만들어주세요. 15자 이내로 짧고 사실적으로. 캡션만 출력하고 따옴표나 설명은 하지 마세요.` },
          { inline_data:{ mime_type:mime, data:base64 } }
        ]}], generationConfig:{ temperature:0.4, maxOutputTokens:60 } })
      });
      const data = await res.json();
      const cap = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/^["'""]|["'""]$/g,'');
      if (cap) updateScene(sceneId, 'caption', cap);
      else alert('캡션 생성 실패: ' + (data.error?.message || JSON.stringify(data).slice(0,200)));
    } catch (err) { alert('오류: ' + err.message); }
    setCaptionLoading(p => ({...p, [sceneId]:false}));
  };

  const applyMosaic = async (sceneId) => {
    const scene = scenes.find(s => s.id===sceneId);
    if (!scene?.imageBase64) return;
    setMosaicLoading(p => ({...p, [sceneId]:true}));
    const ok = await ensureFaceApi();
    if (!ok) { alert('얼굴 인식 모델 로드 실패. 네이버 블로그에서 직접 처리해주세요.'); setMosaicLoading(p => ({...p, [sceneId]:false})); return; }
    try {
      const src = scene.originalBase64 || scene.imageBase64;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload=res; img.onerror=rej; img.src=src; });
      const dets = await window.faceapi.detectAllFaces(img, new window.faceapi.TinyFaceDetectorOptions({ inputSize:416, scoreThreshold:0.3 }));
      if (!dets.length) { alert('얼굴이 감지되지 않았습니다.'); setMosaicLoading(p => ({...p, [sceneId]:false})); return; }
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      dets.forEach(d => {
        const { x, y, width: w, height: h } = d.box;
        const px = w*.18, py = h*.22;
        const rx=Math.max(0,x-px), ry=Math.max(0,y-py), rw=Math.min(canvas.width-rx,w+px*2), rh=Math.min(canvas.height-ry,h+py*2);
        const blocks = Math.max(8, Math.floor(rw/18));
        const tmp = document.createElement('canvas'); tmp.width=blocks; tmp.height=blocks;
        tmp.getContext('2d').drawImage(canvas, rx, ry, rw, rh, 0, 0, blocks, blocks);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, blocks, blocks, rx, ry, rw, rh);
      });
      const newB64 = canvas.toDataURL('image/jpeg', 0.9);
      setScenes(p => p.map(s => s.id===sceneId ? {...s, imageBase64:newB64, originalBase64:src, mosaicApplied:true, facesDetected:dets.length} : s));
    } catch (err) { alert('모자이크 오류: ' + err.message); }
    setMosaicLoading(p => ({...p, [sceneId]:false}));
  };

  const undoMosaic = (id) => setScenes(p => p.map(s => s.id===id && s.originalBase64 ? {...s, imageBase64:s.originalBase64, mosaicApplied:false, facesDetected:0} : s));

  const onDragStart = (e, i) => { setDraggedIdx(i); try { e.dataTransfer.setData('text/plain', String(i)); } catch {} };
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop      = (e, i) => {
    e.preventDefault();
    if (draggedIdx===null || draggedIdx===i) { setDraggedIdx(null); setDragOverIdx(null); return; }
    const a = [...scenes]; const [moved] = a.splice(draggedIdx,1); a.splice(i,0,moved);
    setScenes(a); setDraggedIdx(null); setDragOverIdx(null);
  };

  const generate = async () => {
    if (!apiKey) { alert('Gemini API 키를 설정 탭에서 입력해주세요.'); onNeedKey(); return; }
    if (!meta.title || !scenes.length) { alert('제목과 최소 1장의 사진이 필요합니다.'); return; }
    setLoading(true); setResult(''); setView('preview');
    const scenesText = scenes.map((s,i) => {
      const lines = [`[장면 ${i+1}]`];
      if (s.mapImageBase64) lines.push(`- 🗺️ 구글맵 이미지 첨부 (본문에서 [🗺️ ${i+1}m]로 표시)`);
      if (s.caption) lines.push(`- 사진 캡션: ${s.caption}`);
      if (s.place)   lines.push(`- 장소/식당: ${s.place}`);
      if (s.menu)    lines.push(`- 메뉴/디테일: ${s.menu}`);
      lines.push(`- 메모/느낌: ${s.memo || '(없음)'}`);
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
3. 사진 자리 형식:
   - 일반 사진: [📷 N] 한 줄 캡션
   - 구글맵:    [🗺️ Nm] 식당명/위치
4. 구글맵 이미지가 있는 식당은 외관/메뉴 사진보다 먼저 [🗺️ Nm] 자리 표시
5. 평어체, 부사, 추측 표현 자연스럽게
6. 마지막은 "~로 N일차 일정이 마무리되었다" 또는 "~여행 후기를 마친다" 마무리

블로그 글 본문만 출력해주세요.`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{ temperature:0.75, maxOutputTokens:3000 } })
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '생성 실패: ' + JSON.stringify(data.error||data).slice(0,300);
      setResult(text);
    } catch (err) { setResult('오류: ' + err.message); }
    setLoading(false);
  };

  // ─── SEO 분석 ────────────────────────────────────────────────────────────
  const analyzeSeo = async () => {
    if (!result) { alert('먼저 블로그 글을 생성해주세요.'); setView('edit'); return; }
    if (!apiKey) { alert('Gemini API 키가 필요합니다.'); onNeedKey(); return; }
    setSeoLoading(true); setSeoData(null); setView('seo');

    // 자동 측정
    const cleanText   = result.replace(/\[(?:📷|🗺️)[^\]]*\]/g,'').trim();
    const charCount   = cleanText.replace(/\s/g,'').length;
    const imageCount  = (result.match(/\[📷\s*\d+\]/g) || []).length;
    const hashtagLine = result.match(/^#.+/m)?.[0] || '';
    const hashtagCount= (hashtagLine.match(/#\S+/g) || []).length;
    const hasMapLink  = result.includes('[🗺️');
    const paragraphs  = result.split(/\n{2,}/).filter(p => p.trim().length > 20);

    const lengthScore = charCount>=3000?20: charCount>=1500?18: charCount>=1000?14: charCount>=500?8:0;
    const imageScore  = imageCount>=6&&imageCount<=10?15: imageCount>=3?12: imageCount>=1?6:0;
    const tagScore    = hashtagCount>=3&&hashtagCount<=5?10: hashtagCount>=6&&hashtagCount<=9?7: hashtagCount>=10?3: hashtagCount>=1?5:0;
    const linkScore   = hasMapLink ? 5 : 0;

    // AI 측정
    const aiPrompt = `당신은 네이버 블로그 SEO 전문가입니다. 아래 블로그 글을 분석하여 네이버 검색 최적화 점수를 매겨주세요.

[자동 측정된 기본 지표]
- 글자수(공백 제외): ${charCount.toLocaleString()}자
- 이미지 수: ${imageCount}장
- 해시태그 수: ${hashtagCount}개 (${hashtagLine.slice(0,60)})
- 지도/링크 포함: ${hasMapLink?'있음':'없음'}
- 단락 수: ${paragraphs.length}개

[블로그 글 본문]
${result.slice(0,3500)}${result.length>3500?'\n...(이하 생략)':''}

아래 JSON 형식만 출력하세요. 다른 텍스트 없이:
{
  "keyword_score": 0~20 정수 (제목 핵심어가 본문에 자연스럽게 2~5회 반복되는지),
  "readability_score": 0~15 정수 (문장 길이·단락 구성·가독성),
  "info_score": 0~15 정수 (장소명·가격·메뉴·시간 등 구체 정보 충실도),
  "keyword_feedback": "키워드 관련 한 줄 피드백",
  "readability_feedback": "가독성 관련 한 줄 피드백",
  "info_feedback": "정보 충실도 관련 한 줄 피드백",
  "improvements": ["가장 중요한 개선 제안", "두 번째 제안", "세 번째 제안"],
  "suggested_keywords": ["검색될 가능성 높은 키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "overall_comment": "전반적인 한 줄 총평"
}`;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:aiPrompt}]}], generationConfig:{ temperature:0.25, maxOutputTokens:1000 } })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API 오류');
      const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // JSON 추출 견고화 — 펜스/주변 텍스트 대응
      let jsonText = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const firstBrace = jsonText.indexOf('{');
      const lastBrace  = jsonText.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }
      const json = JSON.parse(jsonText);

      setSeoData({
        auto:     { length:lengthScore, image:imageScore, hashtag:tagScore, link:linkScore },
        ai:       { keyword:Math.min(20,Math.max(0,json.keyword_score||0)), readability:Math.min(15,Math.max(0,json.readability_score||0)), info:Math.min(15,Math.max(0,json.info_score||0)) },
        feedback: { keyword:json.keyword_feedback||'', readability:json.readability_feedback||'', info:json.info_feedback||'' },
        improvements: json.improvements || [],
        keywords:     json.suggested_keywords || [],
        comment:      json.overall_comment || '',
        meta:{ charCount, imageCount, hashtagCount, hasMapLink, paragraphs:paragraphs.length },
      });
    } catch (err) {
      setSeoData({ error: '분석 실패: ' + err.message });
    }
    setSeoLoading(false);
  };

  const renderPreview = (text) => {
    if (!text) return null;
    return text.split(/(\[(?:📷|🗺️)\s*\d+m?\][^\n]*)/g).map((part, i) => {
      const pm = part.match(/^\[📷\s*(\d+)\]\s*(.*)$/);
      const mm = part.match(/^\[🗺️\s*(\d+)m\]\s*(.*)$/);
      if (pm) {
        const s = scenes[parseInt(pm[1])-1];
        return <div key={i} style={{ margin:'20px 0', textAlign:'center' }}>
          {s?.imageBase64 ? <img src={s.imageBase64} alt={pm[2]} style={{ maxWidth:'100%', maxHeight:360, borderRadius:3, border:`1px solid ${T.border}` }}/> : <div style={{ padding:40, background:T.accentSoft, borderRadius:3, fontFamily:T.sansFont, fontSize:12, color:T.sub }}>사진 #{parseInt(pm[1])}</div>}
          {pm[2] && <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:13, color:T.sub, marginTop:6 }}>{pm[2]}</div>}
        </div>;
      }
      if (mm) {
        const s = scenes[parseInt(mm[1])-1];
        return <div key={i} style={{ margin:'20px 0', textAlign:'center' }}>
          {s?.mapImageBase64 ? <img src={s.mapImageBase64} alt={mm[2]} style={{ maxWidth:'100%', maxHeight:300, borderRadius:3, border:`1px solid ${T.border}` }}/> : <div style={{ padding:40, background:T.accentSoft, borderRadius:3, fontFamily:T.sansFont, fontSize:12, color:T.sub }}>지도 #{parseInt(mm[1])}</div>}
          {mm[2] && <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:13, color:T.sub, marginTop:6 }}>📍 {mm[2]}</div>}
        </div>;
      }
      return <div key={i} style={{ whiteSpace:'pre-wrap', marginBottom:6 }}>{part}</div>;
    });
  };

  return (
    <>
      {/* 헤더 */}
      <div style={{ marginBottom:28 }}>
        <div style={css.eyebrow}>블로그 작성</div>
        <h1 style={css.hero}>여행을 <span style={{ fontStyle:'italic', color:T.accent }}>글로</span></h1>
        <p style={css.lead}>사진을 올리고 느낌을 메모하면, 평소 문체로 완결된 블로그 글을 써드립니다.</p>
      </div>

      {/* 편집 / 미리보기 / 품질 분석 토글 */}
      <div style={{ display:'flex', gap:6, marginBottom:20, borderBottom:`1px solid ${T.border}` }}>
        {[{id:'edit',label:'편집'},{id:'preview',label:'미리보기'},{id:'seo',label:'📊 품질 분석'}].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding:'10px 16px', fontFamily:T.sansFont, fontSize:12, fontWeight:500,
            color: view===t.id ? T.ink : T.sub, background:'none', border:'none',
            borderBottom: `2px solid ${view===t.id ? T.accent : 'transparent'}`,
            marginBottom:-1, cursor:'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {view === 'edit' && (
        <>
          {/* 메타 */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:22, marginBottom:16 }}>
            <div style={{ marginBottom:14 }}>
              <label style={css.label}>여행 제목 / 여행지</label>
              <input style={css.input} placeholder="하남 미사 당일치기 / 춘천 가족여행 1일차" value={meta.title} onChange={e=>setMeta({...meta,title:e.target.value})}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={css.label}>일차 / 일자</label>
                <input style={css.input} placeholder="2일차 / 2026.05.10" value={meta.day} onChange={e=>setMeta({...meta,day:e.target.value})}/>
              </div>
              <div>
                <label style={css.label}>해시태그 (선택)</label>
                <input style={css.input} placeholder="#춘천 #남이섬" value={meta.hashtags} onChange={e=>setMeta({...meta,hashtags:e.target.value})}/>
              </div>
            </div>
            <div>
              <label style={css.label}>도입부 분위기 (선택)</label>
              <textarea rows={2} style={css.textarea} placeholder="예: 노모 동반, 이동 최소화. 흐린 날씨였지만 분위기 좋았음." value={meta.intro} onChange={e=>setMeta({...meta,intro:e.target.value})}/>
            </div>
          </div>

          {/* 사진 업로드 존 */}
          <div
            style={{ border:`2px dashed ${T.border}`, borderRadius:4, padding:'26px 16px', textAlign:'center', background:T.cardSoft, cursor:'pointer', marginBottom:14, fontFamily:T.sansFont, fontSize:13, color:T.sub, lineHeight:1.6 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={async e => { e.preventDefault(); await handleUpload({ target:{ files:e.dataTransfer.files, value:'' } }); }}
          >
            <Upload size={20} style={{ display:'block', margin:'0 auto 8px', color:T.sub }}/>
            <strong style={{ color:T.ink, fontWeight:500 }}>여러 사진을 한꺼번에 올리세요</strong>
            <div style={{ marginTop:4 }}>클릭 또는 드롭 · 자동으로 장면 카드 생성</div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display:'none' }}/>
          </div>

          {scenes.length > 0 && <div style={{ ...css.label, marginBottom:12 }}>{scenes.length}개 장면 · 왼쪽 핸들 드래그로 순서 변경</div>}

          {/* 장면 카드들 */}
          {scenes.map((s, idx) => (
            <div
              key={s.id}
              style={{
                background:T.cardSoft, border:`1px solid ${dragOverIdx===idx && draggedIdx!==idx ? T.accent : T.border}`,
                borderLeft:`3px solid ${T.accent}`, borderRadius:3, padding:18, marginBottom:12,
                opacity: draggedIdx===idx ? 0.4 : 1, transition:'border-color .15s, opacity .15s',
              }}
              onDragOver={e=>onDragOver(e,idx)}
              onDragLeave={()=>setDragOverIdx(null)}
              onDrop={e=>onDrop(e,idx)}
            >
              {/* 카드 헤더 */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, fontFamily:T.displayFont, fontSize:13, fontStyle:'italic', color:T.accent }}>
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span draggable onDragStart={e=>onDragStart(e,idx)} onDragEnd={()=>{setDraggedIdx(null);setDragOverIdx(null);}} style={{ cursor:'grab', color:T.sub, display:'inline-flex', alignItems:'center', padding:4 }}>
                    <GripVertical size={14}/>
                  </span>
                  Scene {String(idx+1).padStart(2,'0')}
                  {s.mosaicApplied && <span style={{ fontFamily:T.sansFont, fontSize:10, padding:'2px 8px', borderRadius:99, background:'#DCFCE7', color:'#166534', border:'1px solid #86EFAC', fontStyle:'normal' }}>✓ 얼굴 {s.facesDetected}개 모자이크</span>}
                </span>
                <button onClick={()=>removeScene(s.id)} style={{ background:'none', border:'none', color:T.sub, cursor:'pointer', padding:4, display:'inline-flex' }}><Trash2 size={14}/></button>
              </div>

              {/* 썸네일 */}
              {s.imageBase64 && <img src={s.imageBase64} alt="" style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:3, background:'#F5F2EC', marginBottom:12, display:'block' }}/>}

              {/* AI 캡션 */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={{ ...css.label, marginBottom:0 }}>사진 한 줄 캡션</label>
                  <button style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 11px', background:captionLoading[s.id]?T.accentLight:T.accentSoft, border:`1px solid ${T.accent}`, color:T.accent, borderRadius:3, fontFamily:T.sansFont, fontSize:11, cursor:captionLoading[s.id]?'wait':'pointer' }} onClick={()=>generateCaption(s.id)} disabled={captionLoading[s.id]}>
                    {captionLoading[s.id] ? <><Loader2 size={11} className="spin"/> 분석 중</> : <><Sparkles size={11}/> AI 캡션</>}
                  </button>
                </div>
                <input style={css.input} placeholder="두짓타니 인피니티 풀 야간 풍경" value={s.caption} onChange={e=>updateScene(s.id,'caption',e.target.value)}/>
              </div>

              {/* 메모 */}
              <div style={{ marginBottom:14 }}>
                <label style={css.label}>그때의 느낌 / 메모</label>
                <textarea rows={2} style={css.textarea} placeholder="야간 수영이 낮과 또 다른 매력. 1월이라 쌀쌀했지만 온수풀이라 괜찮았음." value={s.memo} onChange={e=>updateScene(s.id,'memo',e.target.value)}/>
              </div>

              {/* 식당/메뉴 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={css.label}><MapPin size={10} style={{display:'inline',marginRight:4,verticalAlign:-1}}/> 장소 / 식당</label><input style={css.input} placeholder="fran's, 두씻 아룬 공원" value={s.place} onChange={e=>updateScene(s.id,'place',e.target.value)}/></div>
                <div><label style={css.label}>주문 메뉴 (선택)</label><input style={css.input} placeholder="봉골레 파스타" value={s.menu} onChange={e=>updateScene(s.id,'menu',e.target.value)}/></div>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {s.mapImageBase64 ? (
                  <div style={{ flex:'1 1 100%', marginBottom:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <label style={{ ...css.label, marginBottom:0 }}><Map size={10} style={{display:'inline',marginRight:4,verticalAlign:-1}}/> 구글맵 캡처</label>
                      <button onClick={()=>updateScene(s.id,'mapImageBase64',null)} style={{ background:'none', border:'none', cursor:'pointer', color:T.danger, display:'inline-flex', padding:4 }}><X size={12}/></button>
                    </div>
                    <img src={s.mapImageBase64} alt="" style={{ width:'100%', maxHeight:130, objectFit:'cover', borderRadius:3, border:`1px solid ${T.border}` }}/>
                  </div>
                ) : (
                  <label style={{ ...css.secondaryBtn, cursor:'pointer', fontSize:12 }}>
                    <Map size={12}/> 구글맵 추가
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleMapUpload(s.id,e)}/>
                  </label>
                )}
                {!s.mosaicApplied ? (
                  <button style={css.secondaryBtn} onClick={()=>applyMosaic(s.id)} disabled={mosaicLoading[s.id]}>
                    {mosaicLoading[s.id] ? <><Loader2 size={12} className="spin"/> 분석 중…</> : <><ShieldCheck size={12}/> 자동 얼굴 모자이크</>}
                  </button>
                ) : (
                  <button style={css.secondaryBtn} onClick={()=>undoMosaic(s.id)}><X size={12}/> 모자이크 해제</button>
                )}
              </div>
            </div>
          ))}

          {scenes.length > 0 && (
            <button onClick={generate} disabled={loading} style={{ ...css.primaryBtn, width:'100%', padding:14, fontSize:14, justifyContent:'center', marginTop:8 }}>
              {loading ? <><Loader2 size={16} className="spin"/> 글 생성 중…</> : <><Sparkles size={16}/> 나의 문체로 블로그 글 생성</>}
            </button>
          )}

          {faceApiState==='error' && <div style={{ fontFamily:T.sansFont, fontSize:11, color:T.danger, marginTop:10 }}><AlertCircle size={11} style={{display:'inline',verticalAlign:-1,marginRight:4}}/> 얼굴 인식 모델 로드 실패. 네이버 블로그에서 직접 처리해주세요.</div>}
        </>
      )}

      {view === 'preview' && (
        <>
          {loading && (
            <div style={{ padding:60, textAlign:'center', color:T.sub, fontFamily:T.displayFont, fontStyle:'italic', fontSize:18 }}>
              <Loader2 size={24} className="spin" style={{ display:'inline-block', marginBottom:12 }}/><br/>당신의 문체를 음미하는 중…
            </div>
          )}
          {!loading && result && (
            <>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:'32px 28px', lineHeight:1.95, fontSize:15, fontFamily:T.bodyFont, color:T.ink }}>
                {renderPreview(result)}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                <button style={css.secondaryBtn} onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>
                  {copied ? <><Check size={12}/> 복사됨</> : <><Copy size={12}/> 본문 복사</>}
                </button>
                <button style={css.secondaryBtn} onClick={() => setView('edit')}><Settings size={12}/> 다시 편집</button>
                <button
                  onClick={analyzeSeo}
                  style={{ ...css.primaryBtn, marginLeft:'auto' }}
                >
                  <span style={{ fontSize:14 }}>📊</span> 네이버 품질 점수 분석
                </button>
              </div>
              <p style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, marginTop:10, lineHeight:1.7 }}>
                * 네이버 블로그에 붙여넣을 때 [📷 N], [🗺️ Nm] 자리에 사진/지도를 끌어다 놓으세요.
              </p>
            </>
          )}
          {!loading && !result && (
            <div style={{ padding:60, textAlign:'center', color:T.sub }}>
              <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:18, marginBottom:10 }}>아직 생성된 글이 없습니다.</div>
              <button style={css.secondaryBtn} onClick={()=>setView('edit')}>← 편집으로</button>
            </div>
          )}
        </>
      )}

      {view === 'seo' && (
        <>
          {seoLoading && (
            <div style={{ padding:80, textAlign:'center', color:T.sub }}>
              <Loader2 size={28} className="spin" style={{ display:'inline-block', marginBottom:14, color:T.accent }}/>
              <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:20, marginBottom:6 }}>품질 점수 분석 중…</div>
              <div style={{ fontFamily:T.sansFont, fontSize:13 }}>글 길이·이미지·키워드·가독성을 종합 검토하고 있습니다.</div>
            </div>
          )}
          {!seoLoading && seoData && !seoData.error && <SEOReport data={seoData} onBack={() => setView('preview')} onRetry={analyzeSeo} />}
          {!seoLoading && seoData?.error && (
            <div style={{ padding:40, textAlign:'center' }}>
              <div style={{ color:T.danger, fontFamily:T.sansFont, fontSize:13, marginBottom:16 }}>{seoData.error}</div>
              <button style={css.secondaryBtn} onClick={() => setView('preview')}>← 돌아가기</button>
            </div>
          )}
          {!seoLoading && !seoData && (
            <div style={{ padding:60, textAlign:'center', color:T.sub }}>
              <button style={css.secondaryBtn} onClick={() => setView('preview')}>← 미리보기로</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// =============================================================================
// STYLE SAMPLES 탭
// =============================================================================
function StyleSamples({ sample, onChange }) {
  return (
    <>
      <div style={{ marginBottom:28 }}>
        <div style={css.eyebrow}>문체 샘플</div>
        <h1 style={css.hero}>나의 <span style={{ fontStyle:'italic', color:T.accent }}>글쓰기 톤</span></h1>
        <p style={css.lead}>AI가 글을 생성할 때 이 샘플을 기반으로 문체를 학습합니다. 본인이 쓴 블로그 글 2–5편을 붙여넣으세요.</p>
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24 }}>
        <label style={css.label}>샘플글 (2,000–5,000자 권장)</label>
        <textarea rows={22} style={{ ...css.textarea, fontSize:13 }} value={sample} onChange={e=>onChange(e.target.value)}/>
        <p style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, marginTop:8, lineHeight:1.6 }}>
          현재 {sample.length.toLocaleString()}자 · 샘플이 풍부할수록 문체 복제 정확도가 올라갑니다.
        </p>
        <hr style={{ border:'none', borderTop:`1px solid ${T.border}`, margin:'20px 0' }}/>
        <div style={css.label}>현재 학습된 문체 시그니처</div>
        <pre style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>{STYLE_NOTES}</pre>
      </div>
    </>
  );
}

// =============================================================================
// SETTINGS 탭
// =============================================================================
function SettingsTab({ apiKey, onChange, cloudStatus, syncCode }) {
  const [show, setShow] = useState(false);
  const fbReady = fb.isFirebaseConfigured();
  const gpReady = gp.isGoogleConfigured();

  const handleExport = () => {
    const data = loadLS() || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-studio-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!confirm('모든 여행 기록·문체 샘플·API 키가 삭제됩니다. 계속하시겠습니까?')) return;
    if (!confirm('정말로 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
    localStorage.removeItem(LS_KEY);
    location.reload();
  };

  return (
    <>
      <div style={{ marginBottom:28 }}>
        <div style={css.eyebrow}>설정</div>
        <h1 style={css.hero}><span style={{ fontStyle:'italic', color:T.accent }}>API</span> · 동기화 설정</h1>
      </div>

      {/* Gemini */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24, marginBottom:14 }}>
        <div style={css.label}>① Google Gemini API Key (필수)</div>
        <div style={{ display:'flex', gap:8, marginTop:6 }}>
          <input type={show?'text':'password'} style={{ ...css.input, flex:1 }} placeholder="AIza…" value={apiKey} onChange={e=>onChange(e.target.value)}/>
          <button style={css.secondaryBtn} onClick={()=>setShow(p=>!p)}>{show ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
        </div>
        <p style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, marginTop:8, lineHeight:1.7 }}>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color:T.accent }}>aistudio.google.com/apikey</a> 무료 발급 · 분당 15회 / 일 1,500회
        </p>
        {apiKey && <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:99, background:'#DCFCE7', color:'#166534', border:'1px solid #86EFAC', fontFamily:T.sansFont, fontSize:11 }}><Check size={11}/> 입력됨</div>}
      </div>

      {/* Firebase */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={css.label}>② Firebase 동기화 (선택)</div>
          {fbReady ? (
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:99, background:'#DCFCE7', color:'#166534', border:'1px solid #86EFAC', fontFamily:T.sansFont, fontSize:11 }}>
              <Check size={11}/> 설정됨
              {syncCode && cloudStatus === 'ok' && <> · <Cloud size={11}/> {syncCode}</>}
            </span>
          ) : (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, background:'#FEF3C7', color:'#92400E', border:'1px solid #FCD34D', fontFamily:T.sansFont, fontSize:11 }}>
              <CloudOff size={11}/> 미설정
            </span>
          )}
        </div>
        <p style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, lineHeight:1.7, margin:'10px 0 0' }}>
          어디서든 같은 데이터로 접속하려면 Firebase 연결 필요. <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color:T.accent }}>console.firebase.google.com</a>에서 프로젝트를 만들고 다음 5개 환경변수를 <code style={{ padding:'1px 5px', background:T.cardSoft, borderRadius:3, fontSize:11 }}>.env.local</code> 또는 Vercel 환경변수에 등록:
        </p>
        <pre style={{ fontFamily:'monospace', fontSize:11, background:T.cardSoft, padding:'10px 14px', borderRadius:3, marginTop:8, color:T.ink, lineHeight:1.6, overflowX:'auto', border:`1px solid ${T.border}` }}>
{`VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_APP_ID=1:xxx:web:xxx`}
        </pre>
        <p style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, marginTop:8, lineHeight:1.6 }}>
          Firebase 콘솔에서 Firestore Database + Storage 활성화 필요 · 무료 한도(Firestore 1GB · Storage 5GB)로 충분
        </p>
      </div>

      {/* Google Photos */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24, marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={css.label}>③ Google Photos 가져오기 (선택)</div>
          {gpReady ? (
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:99, background:'#DCFCE7', color:'#166534', border:'1px solid #86EFAC', fontFamily:T.sansFont, fontSize:11 }}><Check size={11}/> 설정됨</span>
          ) : (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, background:'#FEF3C7', color:'#92400E', border:'1px solid #FCD34D', fontFamily:T.sansFont, fontSize:11 }}>미설정</span>
          )}
        </div>
        <p style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, lineHeight:1.7, margin:'10px 0 0' }}>
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color:T.accent }}>Google Cloud Console</a>에서:
        </p>
        <ol style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, lineHeight:1.8, margin:'6px 0 0', paddingLeft:18 }}>
          <li>프로젝트 만들기 (Gemini와 같은 프로젝트 가능)</li>
          <li>APIs &amp; Services → Library → <strong>Photos Picker API</strong> 활성화</li>
          <li>Credentials → OAuth 2.0 Client ID 생성 (Web application)</li>
          <li>Authorized JavaScript origins에 배포 도메인 등록 (예: <code>https://travel-studio.vercel.app</code>)</li>
          <li>발급된 Client ID를 환경변수 <code>VITE_GOOGLE_CLIENT_ID</code>에 등록</li>
        </ol>
        <div style={{ marginTop:12, padding:'10px 14px', background:T.accentSoft, border:`1px solid ${T.accentLight}`, borderRadius:3, fontFamily:T.sansFont, fontSize:11, color:T.accent, lineHeight:1.6 }}>
          ❗ <strong>네이버 마이박스</strong>는 외부 개발자 API가 공개되지 않아 직접 연동 불가능합니다. 마이박스 앱에서 사진을 일단 다운로드 후 본 앱에 업로드하거나, Google Photos / Firebase Storage로 백업해서 사용하세요.
        </div>
      </div>

      {/* 데이터 관리 */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:24 }}>
        <div style={css.label}>데이터 관리</div>
        <p style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, lineHeight:1.7, margin:'10px 0 14px' }}>
          {fbReady && syncCode ? '클라우드(Firebase)와 이 브라우저에 모두 저장 중.' : '이 브라우저의 localStorage에만 저장 중. 다기기 사용을 원하면 Firebase 연결.'}
        </p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={handleExport} style={css.secondaryBtn}>
            <Briefcase size={12}/> JSON 백업 내보내기
          </button>
          <button onClick={handleClear} style={{ ...css.secondaryBtn, color:T.danger, borderColor:'#FCA5A5' }}>
            <Trash2 size={12}/> 로컬 데이터 초기화
          </button>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// TRIP FORM MODAL (생성 + 수정 겸용)
// =============================================================================
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
  } : { title:'', country:'', flag:'', startDate:'', endDate:'', currency:'KRW', accent:ACCENTS[0].color, coverImage:null });

  const valid = form.title && form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate);
  const dc = valid ? dateRange(form.startDate, form.endDate).length : 0;
  const handleCountry = v => { const f=guessFlag(v); setForm({...form,country:v,flag:f||form.flag}); };

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
    if (isEdit) {
      // 기존 trip의 days는 유지하고 메타만 업데이트 (날짜 변경 시 days 재생성)
      const newDates = dateRange(form.startDate, form.endDate);
      const oldDayMap = Object.fromEntries(safeArr(trip.days).map(d => [d.date, d]));
      const newDays = newDates.map(date => oldDayMap[date] || { date, waypoints:[], diary:'', photos:[], expenses:[] });
      onSave({ ...form, days: newDays });
    } else {
      onSave({
        id: uid(), ...form, flag: form.flag || '✈',
        days: dateRange(form.startDate, form.endDate).map(date => ({ date, waypoints:[], diary:'', photos:[], expenses:[] })),
      });
    }
  };

  return (
    <div style={css.modalBackdrop} onClick={onClose}>
      <div style={css.modalCard} onClick={e=>e.stopPropagation()} className="fade-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'22px 24px 14px' }}>
          <div>
            <div style={css.eyebrow}>{isEdit ? 'Edit Journey' : 'New Journey'}</div>
            <h2 style={{ fontFamily:T.displayFont, fontSize:24, fontWeight:500, margin:0, color:T.ink }}>
              {isEdit ? '여행 정보 수정' : '새 여행 시작하기'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.sub, padding:6, display:'inline-flex' }}><X size={16}/></button>
        </div>
        <div style={{ padding:'0 24px 8px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* 표지 사진 */}
          <div>
            <label style={css.label}>표지 사진 (선택)</label>
            {form.coverImage ? (
              <div style={{ position:'relative', borderRadius:4, overflow:'hidden', border:`1px solid ${T.border}`, aspectRatio:'21/9', background:'#000' }}>
                <img src={form.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                <button onClick={() => setForm({ ...form, coverImage:null })} style={{ position:'absolute', top:8, right:8, padding:6, background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:3, cursor:'pointer', display:'inline-flex' }}><X size={14}/></button>
              </div>
            ) : (
              <label style={{ display:'block', padding:'24px 16px', textAlign:'center', background:T.cardSoft, border:`2px dashed ${T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.sansFont, fontSize:12, color:T.sub }}>
                <ImageIcon size={20} style={{ display:'block', margin:'0 auto 6px', opacity:.5 }}/>
                클릭하여 표지 사진 업로드
                <input type="file" accept="image/*" onChange={handleCoverFile} style={{ display:'none' }}/>
              </label>
            )}
          </div>

          <div><label style={css.label}>여행 제목</label><input style={css.input} placeholder="도쿄 벚꽃 여행 2026" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 88px', gap:10 }}>
            <div>
              <label style={css.label}>국가 {guessFlag(form.country) && <span style={{ color:T.success, fontSize:9, marginLeft:4 }}>자동 {guessFlag(form.country)}</span>}</label>
              <input style={css.input} placeholder="일본, Thailand…" value={form.country} onChange={e=>handleCountry(e.target.value)}/>
            </div>
            <div><label style={css.label}>국기</label><input style={{...css.input,textAlign:'center',fontSize:22,padding:'7px 4px'}} placeholder="🇯🇵" value={form.flag} onChange={e=>setForm({...form,flag:e.target.value})}/></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div><label style={css.label}>시작일</label><input type="date" style={{...css.input,fontFamily:'system-ui,sans-serif',colorScheme:'light'}} value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
            <div><label style={css.label}>종료일</label><input type="date" style={{...css.input,fontFamily:'system-ui,sans-serif',colorScheme:'light'}} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div>
          </div>
          {dc > 0 && <div style={{ fontFamily:T.displayFont, fontStyle:'italic', fontSize:12, color:T.accent, textAlign:'right', marginTop:-8 }}>· {dc}일 여행</div>}
          <div style={{ display:'grid', gridTemplateColumns:'110px 1fr', gap:14, alignItems:'flex-start' }}>
            <div><label style={css.label}>기본 통화</label><select style={css.input} value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div>
              <label style={css.label}>표지 색상 (사진 없을 때)</label>
              <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                {ACCENTS.map(a=>(
                  <button key={a.id} onClick={()=>setForm({...form,accent:a.color})} title={a.label} style={{ width:28,height:28,borderRadius:3,background:a.color,padding:0,border:form.accent===a.color?`2px solid ${T.ink}`:`2px solid ${T.border}`,cursor:'pointer',boxShadow:form.accent===a.color?`0 0 0 2px ${T.bg},0 0 0 3px ${T.ink}`:'none' }}/>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, padding:'16px 24px 22px', borderTop:`1px solid ${T.border}`, marginTop:14 }}>
          <button onClick={onClose} style={css.secondaryBtn}>취소</button>
          <button onClick={save} disabled={!valid} style={{ ...css.primaryBtn, flex:1, justifyContent:'center' }}>
            {isEdit ? '저장' : '여행 만들기'} <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SYNC PANEL
// =============================================================================
function SyncPanel({ current, onClose, onApply }) {
  const [code, setCode] = useState(current||'');
  const fbReady = fb.isFirebaseConfigured();
  return (
    <div style={css.modalBackdrop} onClick={onClose}>
      <div style={{ ...css.modalCard, maxWidth:480 }} onClick={e=>e.stopPropagation()} className="fade-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'22px 24px 14px' }}>
          <h2 style={{ fontFamily:T.displayFont, fontSize:22, fontWeight:500, margin:0, color:T.ink }}>클라우드 동기화</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.sub, padding:6, display:'inline-flex' }}><X size={16}/></button>
        </div>
        <div style={{ padding:'0 24px 20px' }}>
          {!fbReady && (
            <div style={{ background:'#FEF3C7', border:`1px solid #FCD34D`, borderRadius:4, padding:'10px 14px', marginBottom:14, fontFamily:T.sansFont, fontSize:12, color:'#92400E', lineHeight:1.6 }}>
              ⚠ Firebase가 설정되지 않아 이 기기에서만 데이터가 보존됩니다. 다기기 동기화를 원하면 Firebase 프로젝트를 만들고 .env에 키를 추가하세요. (설정 탭 참고)
            </div>
          )}
          <p style={{ fontFamily:T.sansFont, fontSize:13, color:T.sub, lineHeight:1.7, margin:'0 0 14px' }}>
            모든 기기에서 같은 코드를 입력하면 실시간 동기화됩니다. 추측하기 어려운 코드를 사용하세요.
          </p>
          <label style={css.label}>코드</label>
          <input style={css.input} value={code} onChange={e=>setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))} placeholder="travel2026" maxLength={20}/>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            {current && <button onClick={()=>onApply('')} style={{ ...css.secondaryBtn, color:T.danger, borderColor:'#FCA5A5' }}>해제</button>}
            <button onClick={onClose} style={css.secondaryBtn}>취소</button>
            <button onClick={()=>onApply(code)} disabled={!code.trim()} style={{ ...css.primaryBtn, flex:1, justifyContent:'center' }}><Check size={14}/> 적용</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SHARED CSS (theme.ts 후보)
// =============================================================================
const css = {
  eyebrow:   { fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.22em', textTransform:'uppercase', color:T.sub, marginBottom:8, fontWeight:500 },
  hero:      { fontFamily:T.displayFont, fontSize:40, fontWeight:500, letterSpacing:'-0.02em', lineHeight:1.05, margin:0, color:T.ink },
  lead:      { fontFamily:T.sansFont, fontSize:13, color:T.sub, marginTop:10, lineHeight:1.65, maxWidth:520 },
  sectionH:  { fontFamily:T.displayFont, fontSize:18, fontWeight:500, fontStyle:'italic', margin:0, color:T.ink },
  label:     { display:'block', fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:T.sub, marginBottom:6, fontWeight:500 },
  input:     { width:'100%', padding:'10px 12px', fontSize:14, fontFamily:T.bodyFont, border:`1px solid ${T.border}`, borderRadius:3, background:T.cardSoft, color:T.ink, outline:'none', boxSizing:'border-box' },
  textarea:  { width:'100%', padding:'10px 12px', fontSize:14, fontFamily:T.bodyFont, border:`1px solid ${T.border}`, borderRadius:3, background:T.cardSoft, color:T.ink, outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:1.6 },
  primaryBtn:   { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 18px', background:T.ink, color:T.bg, border:'none', borderRadius:3, fontFamily:T.sansFont, fontSize:13, fontWeight:500, letterSpacing:'0.04em', cursor:'pointer' },
  secondaryBtn: { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 16px', background:T.card, color:T.ink, border:`1px solid ${T.border}`, borderRadius:3, fontFamily:T.sansFont, fontSize:12, fontWeight:500, cursor:'pointer' },
  modalBackdrop:{ position:'fixed', inset:0, background:'rgba(28,25,23,.45)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 },
  modalCard:    { background:T.bg, borderRadius:4, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(28,25,23,.2)', border:`1px solid ${T.border}` },
};

// =============================================================================
// SEO REPORT 컴포넌트
// =============================================================================
function SEOReport({ data, onBack, onRetry }) {
  const { auto, ai, feedback, improvements, keywords, comment, meta } = data;

  const totalAuto = auto.length + auto.image + auto.hashtag + auto.link;
  const totalAI   = ai.keyword + ai.readability + ai.info;
  const total     = totalAuto + totalAI;

  const grade = total >= 80 ? { label:'우수', color:'#166534', bg:'#DCFCE7', border:'#86EFAC', desc:'검색 노출 가능성 높음' }
              : total >= 60 ? { label:'보통', color:'#B45309', bg:'#FEF3C7', border:'#FCD34D', desc:'몇 가지 개선으로 향상 가능' }
              : total >= 40 ? { label:'미흡', color:'#C2410C', bg:'#FEE2E2', border:'#FCA5A5', desc:'주요 항목 보완 필요' }
              :               { label:'낮음', color:T.danger,  bg:'#FEE2E2', border:'#FCA5A5', desc:'기본 요소 전반 부족' };

  const items = [
    { label:'글 길이',       max:20, score:auto.length,   auto:true,  detail:`${meta.charCount.toLocaleString()}자`,  tip: auto.length<20 ? '1,500~3,000자 권장 · 현재 기준으로 ' + (auto.length>=18?'충분합니다':'좀 더 써주세요') : null },
    { label:'이미지',        max:15, score:auto.image,    auto:true,  detail:`${meta.imageCount}장`,                  tip: auto.image<15  ? '3~10장 권장 · 사진을 더 추가해보세요' : null },
    { label:'해시태그',      max:10, score:auto.hashtag,  auto:true,  detail:`${meta.hashtagCount}개`,                tip: auto.hashtag<10? '3~5개 권장' : null },
    { label:'지도/링크',     max:5,  score:auto.link,     auto:true,  detail: meta.hasMapLink ? '포함됨' : '없음',    tip: !meta.hasMapLink ? '구글맵 이미지나 링크를 추가하면 +5점' : null },
    { label:'키워드 최적화', max:20, score:ai.keyword,    auto:false, detail:feedback.keyword,                        tip:null },
    { label:'가독성',        max:15, score:ai.readability,auto:false, detail:feedback.readability,                    tip:null },
    { label:'정보 충실도',   max:15, score:ai.info,       auto:false, detail:feedback.info,                           tip:null },
  ];

  const barColor = (pct) => pct >= 0.8 ? '#166534' : pct >= 0.6 ? T.accent : pct >= 0.4 ? '#B45309' : T.danger;

  return (
    <>
      {/* 헤더 */}
      <div style={{ marginBottom:28 }}>
        <div style={css.eyebrow}>네이버 블로그 SEO</div>
        <h1 style={css.hero}>품질 <span style={{ fontStyle:'italic', color:T.accent }}>점수 리포트</span></h1>
      </div>

      {/* 총점 카드 */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:'28px 28px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
        {/* 원형 게이지 */}
        <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke={T.border} strokeWidth="9"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke={grade.color} strokeWidth="9"
              strokeDasharray={`${2*Math.PI*42 * total/100} ${2*Math.PI*42 * (1 - total/100)}`}
              strokeDashoffset={2*Math.PI*42 * 0.25}
              strokeLinecap="round"
              style={{ transition:'stroke-dasharray .8s ease' }}
            />
            <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="600" fontFamily="Fraunces, serif" fill={T.ink}>{total}</text>
            <text x="50" y="60" textAnchor="middle" fontSize="10" fontFamily="Inter, sans-serif" fill={T.sub}>/100</text>
          </svg>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ padding:'3px 12px', background:grade.bg, color:grade.color, border:`1px solid ${grade.border}`, borderRadius:99, fontFamily:T.sansFont, fontSize:11, fontWeight:600 }}>
              {grade.label}
            </span>
            <span style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub }}>{grade.desc}</span>
          </div>
          <p style={{ fontFamily:T.bodyFont, fontSize:15, color:T.ink, lineHeight:1.7, margin:0 }}>{comment}</p>
          <div style={{ display:'flex', gap:16, marginTop:12, fontFamily:T.sansFont, fontSize:12, color:T.sub }}>
            <span>자동 측정 <strong style={{ color:T.ink }}>{totalAuto}/50</strong></span>
            <span>AI 분석 <strong style={{ color:T.ink }}>{totalAI}/50</strong></span>
          </div>
        </div>
      </div>

      {/* 항목별 점수 */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:'20px 24px', marginBottom:16 }}>
        <div style={{ fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:T.sub, marginBottom:16, fontWeight:600 }}>항목별 점수</div>
        {items.map((item, i) => {
          const pct = item.score / item.max;
          return (
            <div key={i} style={{ marginBottom: i < items.length-1 ? 18 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:T.sansFont, fontSize:13, fontWeight:500, color:T.ink }}>{item.label}</span>
                  <span style={{ padding:'1px 7px', background: item.auto ? T.cardSoft : T.accentSoft, border:`1px solid ${item.auto ? T.border : T.accentLight}`, borderRadius:99, fontFamily:T.sansFont, fontSize:9, color: item.auto ? T.sub : T.accent, fontWeight:500 }}>
                    {item.auto ? '자동' : 'AI'}
                  </span>
                </div>
                <span style={{ fontFamily:T.displayFont, fontSize:15, fontWeight:500, color: barColor(pct) }}>{item.score}<span style={{ fontSize:11, color:T.sub, fontFamily:T.sansFont }}>/{item.max}</span></span>
              </div>
              {/* 바 */}
              <div style={{ height:5, background:T.border, borderRadius:99, overflow:'hidden', marginBottom:5 }}>
                <div style={{ height:'100%', width:`${pct*100}%`, background:barColor(pct), borderRadius:99, transition:'width .8s ease' }}/>
              </div>
              {/* 상세 피드백 */}
              <div style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, lineHeight:1.5 }}>
                {item.detail}
                {item.tip && <span style={{ color:T.warning, marginLeft:6 }}>· {item.tip}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 두 컬럼: 개선 제안 + 추천 키워드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12, marginBottom:16 }}>
        {/* 개선 제안 */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:'18px 20px' }}>
          <div style={{ fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:T.sub, marginBottom:12, fontWeight:600 }}>개선 제안</div>
          {improvements.length > 0 ? improvements.map((imp, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:3, background:T.accentSoft, border:`1px solid ${T.accentLight}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:T.sansFont, fontSize:9, fontWeight:700, color:T.accent }}>{i+1}</div>
              <div style={{ fontFamily:T.sansFont, fontSize:12, color:T.ink, lineHeight:1.6 }}>{imp}</div>
            </div>
          )) : <div style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, fontStyle:'italic' }}>개선 제안 없음</div>}
        </div>

        {/* 추천 검색 키워드 */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:4, padding:'18px 20px' }}>
          <div style={{ fontFamily:T.sansFont, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:T.sub, marginBottom:12, fontWeight:600 }}>추천 검색 키워드</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {keywords.length > 0 ? keywords.map((kw, i) => (
              <span key={i} style={{ padding:'5px 12px', background:T.accentSoft, border:`1px solid ${T.accentLight}`, borderRadius:3, fontFamily:T.sansFont, fontSize:12, color:T.accent, cursor:'pointer' }}
                title="클릭하여 복사" onClick={() => navigator.clipboard.writeText(kw)}>
                {kw}
              </span>
            )) : <div style={{ fontFamily:T.sansFont, fontSize:12, color:T.sub, fontStyle:'italic' }}>키워드 없음</div>}
          </div>
          <div style={{ fontFamily:T.sansFont, fontSize:10, color:T.sub, marginTop:12, lineHeight:1.5 }}>
            💡 키워드 클릭 시 클립보드에 복사됩니다.<br/>
            해시태그나 제목에 활용해보세요.
          </div>
        </div>
      </div>

      {/* 측정 기준 안내 */}
      <div style={{ background:T.accentSoft, border:`1px solid ${T.accentLight}`, borderRadius:4, padding:'14px 18px', marginBottom:16 }}>
        <div style={{ fontFamily:T.sansFont, fontSize:11, fontWeight:600, color:T.accent, marginBottom:6 }}>📌 점수 산정 기준</div>
        <div style={{ fontFamily:T.sansFont, fontSize:11, color:T.sub, lineHeight:1.7 }}>
          글 길이(20) · 이미지(15) · 해시태그(10) · 지도/링크(5)는 자동 측정 · 키워드 최적화(20) · 가독성(15) · 정보 충실도(15)는 Gemini AI 분석<br/>
          네이버 C-Rank, D.I.A 알고리즘 기반 항목 구성 · 실제 검색 노출은 블로그 전체 지수(업로드 주기, 방문자 수, 이탈률)에도 영향받습니다.
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display:'flex', gap:8 }}>
        <button style={css.secondaryBtn} onClick={onBack}>← 미리보기</button>
        <button style={css.secondaryBtn} onClick={onRetry}><Loader2 size={12}/> 재분석</button>
      </div>
    </>
  );
}
