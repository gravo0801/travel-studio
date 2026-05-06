# Travel Studio v2

여행 기록 + 블로그 작성을 하나의 작업실에서. 단일 파일 React 앱.

## 기능

- **라이브러리** — 여행 카드, 통계, 새 여행/수정/삭제, 표지 사진
- **Trip 상세** — Day 카드 클릭으로 진입 (button 요소로 100% 작동 보장)
- **Day 편집** — 일기 / 사진 / 동선 / 지출 입력
- **블로그 작성** — 사진 일괄 업로드 + 드래그 정렬, AI 캡션, AI 글 생성
- **품질 분석** — 100점 만점 SEO 점수 + 개선 제안
- **Firebase 동기화** — syncCode 기반 다기기 실시간 동기화 (선택)
- **localStorage** — 자동 저장

## 기술 스택

- React 18 + Vite 5
- Google Gemini 2.0 Flash (텍스트·비전·SEO) — 무료 분당 15회 / 일 1,500회
- Firebase 11 (Firestore + Storage, 선택) — 무료 1GB + 5GB
- lucide-react 아이콘

## 빠른 시작

```bash
npm install
cp .env.example .env.local  # Firebase 쓸 때만
npm run dev
```
http://localhost:5173

## Vercel 배포

1. GitHub에 푸시
2. https://vercel.com → Add New Project → 레포 Import
3. (Firebase 쓸 때) Settings → Environment Variables에 5개 키 등록
4. Deploy → 영구 URL 발급

## Firebase 설정 (선택)

다른 기기에서도 같은 데이터 쓰려면:

1. https://console.firebase.google.com → 프로젝트 만들기
2. Firestore Database 활성화 (테스트 모드)
3. Storage 활성화 (테스트 모드)
4. 프로젝트 설정 → 웹 앱 등록 → firebaseConfig 복사
5. `.env.local`에 등록:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.firebasestorage.app
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
```

6. 앱에서 라이브러리 우측 [동기화] → 코드 입력 (예: `bae-travel-2026`)

## v3 로드맵

- Google Photos Picker 통합
- 자동 얼굴 모자이크 (face-api.js)
- 환율 자동 환산
- 라우트 타임라인 JPG 내보내기

---

© 2026 · 개인 프로젝트
