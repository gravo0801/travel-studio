# Travel Studio · 여행 작가의 작업실

여행 기록과 블로그 글쓰기를 하나의 작업실로 통합한 React 앱.
사진을 한꺼번에 업로드하고 드래그로 순서를 정리하면, 평소 문체로 한 편의 완결된 블로그 글을 다듬어 줍니다.

## ✨ 주요 기능

| 영역 | 기능 |
|---|---|
| **여행 라이브러리** | 매거진 톤 카드 그리드, 표지 색상 6종, 국가 자동 국기 매핑 |
| **블로그 작성** | 사진 일괄 업로드 + 드래그 정렬, AI 한 줄 캡션, 자동 얼굴 모자이크, 구글맵 슬롯 |
| **문체 학습** | 평소 작성한 글을 샘플로 학습 → Gemini가 같은 톤으로 본문 생성 |
| **품질 분석** | 네이버 블로그 SEO 7개 항목 100점 만점 점수, 개선 제안, 추천 키워드 |
| **데이터 보존** | localStorage 자동 저장, JSON 백업/복원 |

## 🛠 기술 스택

- React 18 + Vite 5
- Google Gemini 2.0 Flash (텍스트 생성·비전 캡션·SEO 분석) — 무료 한도: 분당 15회 / 일 1,500회
- @vladmandic/face-api (얼굴 인식 모자이크) — jsdelivr CDN, 무료
- lucide-react (아이콘)
- Fraunces · Noto Serif KR · Inter (Google Fonts)

## 🚀 로컬 실행

```bash
git clone <your-repo-url>
cd travel-studio
npm install
npm run dev
```

브라우저에서 http://localhost:5173 자동 오픈.

## 📦 GitHub 등록

1. GitHub에서 새 레포 생성 (예: `travel-studio`)
2. 로컬에서:
   ```bash
   cd travel-studio
   git init
   git add .
   git commit -m "Initial commit: Travel Studio v1"
   git branch -M main
   git remote add origin https://github.com/<USERNAME>/travel-studio.git
   git push -u origin main
   ```

## ☁️ Vercel 배포

### 옵션 A — Vercel 대시보드 (권장)
1. https://vercel.com 로그인 → **Add New Project**
2. GitHub 레포 선택 → **Import**
3. Framework: **Vite** (자동 감지) · 추가 설정 불필요
4. **Deploy** 클릭 → 약 30초 후 `https://travel-studio-xxx.vercel.app` 발급

### 옵션 B — Vercel CLI
```bash
npm i -g vercel
vercel login
vercel        # 첫 배포
vercel --prod # 프로덕션 배포
```

## 🔑 Gemini API 키 발급

1. https://aistudio.google.com/apikey 접속 (Google 계정 로그인)
2. **Create API key** → 키 복사
3. 앱 실행 후 **설정** 탭에 붙여넣기
4. 키는 브라우저 localStorage에만 저장되며 서버 전송 없음

## 📂 프로젝트 구조

```
travel-studio/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── src/
    ├── main.jsx
    └── TravelStudio.jsx   ← 모든 기능이 들어있는 단일 컴포넌트
```

## 🧭 사용 흐름

1. **설정** 탭에서 Gemini API 키 입력
2. **문체 샘플** 탭에서 평소 본인의 블로그 글을 붙여넣기 (2,000~5,000자 권장)
3. **블로그 작성** 탭으로 이동 → 메타 정보 입력 → 사진 일괄 드롭
4. 각 사진마다:
   - **AI 캡션** 버튼 클릭 → Gemini가 사진 한 줄 설명 자동 작성
   - 메모/장소/메뉴 입력
   - (선택) **자동 얼굴 모자이크** · **구글맵 추가**
   - 그립 핸들로 순서 변경
5. **나의 문체로 블로그 글 생성** 클릭
6. 미리보기에서 **📊 네이버 품질 점수 분석** → 개선 제안 확인
7. **본문 복사** → 네이버 블로그 편집기에 붙여넣고 `[📷 N]` 자리에 사진 배치

## 📊 SEO 점수 산정 기준

| 항목 | 만점 | 측정 |
|---|---|---|
| 글 길이 | 20 | 자동 (1,500~3,000자 만점) |
| 이미지 수 | 15 | 자동 (3~10장 만점) |
| 해시태그 | 10 | 자동 (3~5개 만점) |
| 지도/링크 | 5 | 자동 |
| 키워드 최적화 | 20 | AI |
| 가독성 | 15 | AI |
| 정보 충실도 | 15 | AI |
| **합계** | **100** | |

> 네이버 C-Rank · D.I.A 알고리즘 기반 항목 구성. 실제 검색 노출은 블로그 전체 지수(업로드 주기·방문자 수·이탈률)에도 영향받습니다.

## ⚠️ 알려진 제한

- **localStorage 용량**: 사진 base64 저장 특성상 5~10MB 한도 초과 가능. 큰 작업 후 [설정 → 데이터 내보내기]로 백업 권장.
- **Gemini 무료 한도**: 일 1,500회. 사진 10장짜리 글 1편 ≈ 12회 호출이라 일반 사용에는 충분.
- **얼굴 인식 정확도**: TinyFaceDetector는 옆모습·작은 얼굴은 놓칠 수 있음. 최종 검수 후 네이버 블로그에서 추가 처리 권장.

## 🗺 향후 로드맵

- Phase 2: Day 화면 — 동선 편집기(자동완성 + 교통수단) · 일기 · 지출 입력
- Phase 3: Trip 상세 통계 카드
- Phase 4: 의료 블로그 앱과 통합 (`/travel` 라우트 마운트)
- Phase 6: AI 일기 도우미 · 환율 자동 환산 · Firebase 동기화

---

© 2026 · 개인 프로젝트
