/**
 * Firebase 어댑터 (선택적)
 *
 * 사용자 환경변수:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_APP_ID
 *
 * 설정 안 된 경우 → localStorage만 사용 (오프라인 모드)
 * 설정된 경우 + syncCode 입력 → Firestore 실시간 동기화 + Storage 사진 업로드
 *
 * Firestore 구조:
 *   travelStudio/{syncCode}
 *     - trips: [...]              (배열로 단순 저장, 작은 규모용)
 *     - sample: 문체 샘플
 *     - lastUpdated: timestamp
 *
 * Storage 구조:
 *   travelStudio/{syncCode}/photos/{tripId}/{filename}
 */

const FB_CONFIG = {
  apiKey:        import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:     import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId:         import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () =>
  !!(FB_CONFIG.apiKey && FB_CONFIG.projectId);

// Lazy import — Firebase SDK는 사용 시점에만 로드 (번들 크기 절감)
let _fbApp = null;
let _db    = null;
let _storage = null;

const initFirebase = async () => {
  if (_fbApp) return { db: _db, storage: _storage };
  if (!isFirebaseConfigured()) throw new Error('Firebase 미설정');

  const { initializeApp } = await import('firebase/app');
  const { getFirestore }  = await import('firebase/firestore');
  const { getStorage }    = await import('firebase/storage');

  _fbApp   = initializeApp(FB_CONFIG);
  _db      = getFirestore(_fbApp);
  _storage = getStorage(_fbApp);
  return { db: _db, storage: _storage };
};

// ─── Firestore ──────────────────────────────────────────────────────────────
export const fbLoad = async (syncCode) => {
  const { db } = await initFirebase();
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'travelStudio', syncCode));
  return snap.exists() ? snap.data() : null;
};

export const fbSave = async (syncCode, data) => {
  const { db } = await initFirebase();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(db, 'travelStudio', syncCode), {
    ...data,
    lastUpdated: serverTimestamp(),
  }, { merge: true });
};

export const fbSubscribe = async (syncCode, callback) => {
  const { db } = await initFirebase();
  const { doc, onSnapshot } = await import('firebase/firestore');
  return onSnapshot(doc(db, 'travelStudio', syncCode), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

// ─── Storage ────────────────────────────────────────────────────────────────
export const fbUploadPhoto = async (syncCode, tripId, file) => {
  const { storage } = await initFirebase();
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.jpg`;
  const path     = `travelStudio/${syncCode}/photos/${tripId}/${safeName}`;
  const r        = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return { url, path };
};

export const fbDeletePhoto = async (path) => {
  if (!path?.startsWith('travelStudio/')) return; // 안전장치
  const { storage } = await initFirebase();
  const { ref, deleteObject } = await import('firebase/storage');
  try { await deleteObject(ref(storage, path)); } catch (e) { console.warn('Photo delete failed:', e); }
};

// base64 → Blob 변환 (사진을 Storage에 올릴 때 사용)
export const base64ToBlob = (base64) => {
  const [meta, data] = base64.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin  = atob(data);
  const arr  = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
};
