import { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coins,
  Copy,
  Edit3,
  FileText,
  Home,
  Library,
  Map,
  MapPin,
  NotebookPen,
  Plane,
  Plus,
  Route,
  Settings,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';

const T = {
  bg: '#F7F3EA',
  card: '#FFFFFF',
  cardSoft: '#FCFAF6',
  ink: '#1F2430',
  sub: '#6E7280',
  border: '#E6DFD2',
  accent: '#2F3A5F',
  accentSoft: '#EEF1FA',
  accentLight: '#DCE3F7',
  danger: '#991B1B',
  success: '#4F6F52',
  warning: '#B56A34',
  displayFont: '"Pretendard", "IBM Plex Sans KR", "Noto Sans KR", sans-serif',
  bodyFont: '"Pretendard", "IBM Plex Sans KR", "Noto Sans KR", sans-serif',
  sansFont: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
};

const LS_KEY = 'travelstudio:v2';
const API_KEY_KEY = 'travelstudio:openai-key';

const TRIP_TYPES = ['국내 단기', '해외', '휴양', '장기여행', '로드트립', '가족여행', '출장+여행'];
const CURRENCIES = ['KRW', 'USD', 'EUR', 'JPY', 'GBP', 'CNY', 'THB', 'VND', 'SGD', 'AUD', 'TWD', 'HKD'];
const ACTIVITY_CATEGORIES = ['맛집', '카페', '관광', '산책', '물놀이', '숙소 휴식', '휴게소', '장보기', '바비큐', '이동', '체크인/체크아웃', '기타'];
const EXPENSE_CATEGORIES = ['주유비', '통행료', '주차비', '휴게소', '식비', '카페', '숙박', '관광/입장권', '워터파크', '렌탈비', '장보기', '바비큐', '기타'];
const TRANSPORT_OPTIONS = ['자차', '도보', '택시', '버스', '지하철', '기차', '항공', '렌터카', '셔틀', '페리', '기타'];

const NAV_ITEMS = [
  { id: 'today', label: '오늘', icon: Home },
  { id: 'calendar', label: '캘린더', icon: CalendarDays },
  { id: 'timeline', label: '타임라인', icon: CalendarDays },
  { id: 'expenses', label: '소비', icon: WalletCards },
  { id: 'library', label: '라이브러리', icon: Library },
  { id: 'review', label: '글 검토', icon: FileText },
  { id: 'settings', label: '설정', icon: Settings },
];

const QUICK_ACTIONS = [
  { id: 'plan', label: '일정', icon: CalendarDays, color: '#2F3A5F' },
  { id: 'route', label: '이동', icon: Route, color: '#8A4B38' },
  { id: 'expense', label: '소비', icon: Coins, color: '#B56A34' },
  { id: 'photo', label: '사진', icon: Camera, color: '#4B587C' },
  { id: 'diary', label: '일기', icon: NotebookPen, color: '#6A5A40' },
  { id: 'checklist', label: '체크', icon: ClipboardList, color: '#2A2F3D' },
];

const GRAVO_CAT_META = {
  식비: { cat: '식사', tone: 'indigo', mark: '식' },
  카페: { cat: '카페', tone: 'warm', mark: '커' },
  장보기: { cat: '마트', tone: 'pos', mark: '마' },
  휴게소: { cat: '식사', tone: 'warm', mark: '휴' },
  주유비: { cat: '교통', tone: 'negative', mark: '주' },
  통행료: { cat: '교통', tone: 'negative', mark: '톨' },
  주차비: { cat: '교통', tone: 'negative', mark: 'P' },
  '관광/입장권': { cat: '여행', tone: 'indigo', mark: '관' },
  워터파크: { cat: '여행', tone: 'indigo', mark: '물' },
  렌탈비: { cat: '여행', tone: 'warm', mark: '렌' },
  숙박: { cat: '여행', tone: 'indigo', mark: '숙' },
  바비큐: { cat: '식사', tone: 'warm', mark: '바' },
  기타: { cat: '기타', tone: 'slate', mark: '기' },
};

const DEFAULT_VACATION = {
  cycleStart: '2026-03-01',
  cycleEnd: '2027-02-28',
  total: 16,
  usedBefore: 4,
  days: [],
};

const TEMPLATE_PROFILES = {
  domestic: {
    id: 'domestic',
    label: '국내 단기',
    title: '새 국내 여행',
    type: '국내 단기',
    currency: 'KRW',
    days: 3,
    checklists: [
      ['출발 전', ['숙소 예약 확인', '차량/교통편 확인', '날씨 확인', '보조배터리 충전']],
      ['여행 중 기록', ['대표 사진 찍기', '식사/카페 기록', '지출 입력', '오늘의 한 줄 작성']],
    ],
    expenseSeeds: ['식비', '카페', '주유비', '통행료', '주차비', '숙박'],
  },
  overseas: {
    id: 'overseas',
    label: '해외 도시여행',
    title: '새 해외 도시여행',
    type: '해외',
    currency: 'USD',
    days: 5,
    checklists: [
      ['서류/입국', ['여권', '비자/입국 서류', '항공권', '여행자보험', '숙소 바우처']],
      ['현지 준비', ['로밍/eSIM', '환전/카드', '공항 이동', '현지 교통앱', '비상 연락처']],
    ],
    expenseSeeds: ['식비', '카페', '숙박', '관광/입장권', '통행료', '기타'],
  },
  resort: {
    id: 'resort',
    label: '휴양여행',
    title: '새 휴양여행',
    type: '휴양',
    currency: 'KRW',
    days: 4,
    checklists: [
      ['휴양 준비', ['수영복/래시가드', '선크림', '모자/선글라스', '방수팩', '샌들']],
      ['느린 기록', ['좋았던 풍경', '맛있었던 음식', '휴식 만족도', '재방문 의사']],
    ],
    expenseSeeds: ['식비', '카페', '숙박', '렌탈비', '기타'],
  },
  long: {
    id: 'long',
    label: '장기여행',
    title: '새 장기여행',
    type: '장기여행',
    currency: 'USD',
    days: 10,
    checklists: [
      ['장기 체류', ['세탁 계획', '약/상비약', '예비 카드', '주간 예산', '중간 휴식일']],
      ['루틴 기록', ['도시 이동 기록', '주간 지출 점검', '컨디션 메모', '다음 도시 준비']],
    ],
    expenseSeeds: ['식비', '카페', '숙박', '관광/입장권', '기타'],
  },
  roadtrip: {
    id: 'roadtrip',
    label: '로드트립',
    title: '새 로드트립',
    type: '로드트립',
    currency: 'KRW',
    days: 4,
    checklists: [
      ['차량/동선', ['주유 계획', '휴게소 후보', '주차 가능 여부', '차량 점검']],
      ['도로 위 기록', ['이동 시간 기록', '휴게소 메뉴 기록', '교통체증 메모', '드라이브 코스 평가']],
    ],
    expenseSeeds: ['주유비', '통행료', '주차비', '휴게소', '식비', '카페'],
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function safeArr(value) {
  return Array.isArray(value) ? value : [];
}

function listFromText(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function dateRange(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return [todayISO()];
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatShortDate(date) {
  if (!date) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function formatKRW(value) {
  return `${Math.round(Number(value || 0)).toLocaleString()}원`;
}

function emptyDiaryDetails() {
  return {
    oneLine: '',
    good: '',
    bad: '',
    food: '',
    place: '',
    spendingSummary: '',
    routeSummary: '',
    tomorrowMemo: '',
    satisfaction: '',
    fatigue: '',
  };
}

function makePlanItem(patch = {}) {
  return {
    id: uid(),
    time: '',
    title: '',
    place: '',
    category: '기타',
    reservationStatus: '',
    plannedDuration: '',
    actualDuration: '',
    done: false,
    memo: '',
    rating: '',
    fatigue: '',
    ...patch,
  };
}

function makeRoute(patch = {}) {
  return {
    id: uid(),
    from: '',
    to: '',
    via: '',
    transport: '자차',
    plannedTime: '',
    actualTime: '',
    distance: '',
    ticketOrParkingMemo: '',
    trafficMemo: '',
    ...patch,
  };
}

function makeExpense(patch = {}) {
  const amount = Number(patch.amount || 0);
  const people = Number(patch.people || 1) || 1;
  return {
    id: uid(),
    date: patch.date || '',
    time: '',
    place: '',
    cat: '기타',
    title: '',
    amount,
    currency: patch.currency || 'KRW',
    krwAmount: Number(patch.krwAmount || amount),
    card: '',
    people,
    perPerson: people ? Math.round(amount / people) : amount,
    memo: '',
    rating: '',
    gravoReady: true,
    ...patch,
  };
}

function makeChecklistGroup(title, items = []) {
  return {
    id: uid(),
    title,
    items: items.map((text) => ({ id: uid(), text, done: false })),
  };
}

function createDay(date, patch = {}) {
  return {
    date,
    summary: '',
    planItems: [],
    routes: [],
    checklists: [],
    expenses: [],
    diaryDetails: emptyDiaryDetails(),
    photos: [],
    ...patch,
  };
}

function normalizeDay(day = {}, fallbackDate = todayISO()) {
  const date = day.date || fallbackDate;
  return {
    ...createDay(date),
    ...day,
    date,
    planItems: safeArr(day.planItems).map((item) => makePlanItem({ ...item, id: item.id || uid() })),
    routes: safeArr(day.routes).map((route) => makeRoute({ ...route, id: route.id || uid() })),
    checklists: safeArr(day.checklists).map((group) => ({
      id: group.id || uid(),
      title: group.title || '체크리스트',
      items: safeArr(group.items).map((item) => ({
        id: item.id || uid(),
        text: item.text || '',
        done: Boolean(item.done),
      })),
    })),
    expenses: safeArr(day.expenses).map((expense) => makeExpense({ date, ...expense, id: expense.id || uid() })),
    diaryDetails: { ...emptyDiaryDetails(), ...(day.diaryDetails || {}) },
    photos: safeArr(day.photos).map((photo) => ({ id: photo.id || uid(), title: '', memo: '', src: '', ...photo })),
  };
}

function normalizeTrip(trip = {}) {
  const startDate = trip.startDate || todayISO();
  const endDate = trip.endDate || startDate;
  const dayMap = Object.fromEntries(safeArr(trip.days).map((day) => [day.date, day]));
  return {
    id: trip.id || uid(),
    title: trip.title || '새 여행',
    type: trip.type || '국내 단기',
    startDate,
    endDate,
    companions: listFromText(trip.companions),
    regions: listFromText(trip.regions),
    lodgings: safeArr(trip.lodgings),
    countries: listFromText(trip.countries),
    cities: listFromText(trip.cities),
    flights: safeArr(trip.flights),
    transfers: safeArr(trip.transfers),
    documents: safeArr(trip.documents),
    timeZone: trip.timeZone || '',
    exchangeRateMemo: trip.exchangeRateMemo || '',
    currency: trip.currency || 'KRW',
    budget: trip.budget || '',
    templateId: trip.templateId || '',
    notes: trip.notes || '',
    stageNotes: {
      planning: '',
      recording: '',
      review: '',
      rating: '',
      lessons: '',
      ...(trip.stageNotes || {}),
    },
    days: dateRange(startDate, endDate).map((date) => normalizeDay(dayMap[date], date)),
  };
}

function normalizeVacation(vacation = {}) {
  return {
    ...DEFAULT_VACATION,
    ...vacation,
    total: Number(vacation.total || DEFAULT_VACATION.total),
    usedBefore: Number(vacation.usedBefore ?? DEFAULT_VACATION.usedBefore),
    days: safeArr(vacation.days).map((day) => ({
      id: day.id || uid(),
      date: day.date || todayISO(),
      tripId: day.tripId || '',
      note: day.note || '',
      canceled: Boolean(day.canceled),
    })),
  };
}

function getTripPhase(trip, now = todayISO()) {
  if (!trip) return 'planning';
  if (now < trip.startDate) return 'planning';
  if (now > trip.endDate) return 'review';
  return 'recording';
}

function tripPhaseMeta(phase) {
  return {
    planning: { label: '여행 전 · 계획단계', helper: '날짜, 이동, 예약, 체크리스트를 미리 정리하는 단계입니다.' },
    recording: { label: '여행 중 · 기록단계', helper: '오늘 있었던 일, 지출, 사진, 이동을 빠르게 남기는 단계입니다.' },
    review: { label: '여행 후 · 회고 평가단계', helper: '좋았던 점, 아쉬운 점, 다음 여행 개선점을 정리하는 단계입니다.' },
  }[phase] || { label: '계획단계', helper: '' };
}

function createTripFromTemplate(templateId) {
  const profile = TEMPLATE_PROFILES[templateId] || TEMPLATE_PROFILES.domestic;
  const startDate = todayISO();
  const endDate = addDays(startDate, profile.days - 1);
  const firstDay = createDay(startDate, {
    summary: '여행 첫날 준비와 이동을 기록해보세요.',
    checklists: profile.checklists.map(([title, items]) => makeChecklistGroup(title, items)),
    expenses: profile.expenseSeeds.slice(0, 3).map((cat) => makeExpense({ date: startDate, cat, title: `${cat} 예정`, amount: 0, currency: profile.currency })),
  });

  return normalizeTrip({
    id: uid(),
    title: profile.title,
    type: profile.type,
    startDate,
    endDate,
    currency: profile.currency,
    templateId: profile.id,
    days: [firstDay],
    countries: profile.type === '해외' || profile.type === '장기여행' ? [''] : [],
    cities: profile.type === '해외' || profile.type === '장기여행' ? [''] : [],
    documents: profile.type === '해외' || profile.type === '장기여행' ? ['여권', '여행자보험', '항공권'] : [],
  });
}

function createBlankTrip() {
  const startDate = todayISO();
  return normalizeTrip({
    id: uid(),
    title: '이름 없는 여행',
    startDate,
    endDate: startDate,
    days: [createDay(startDate)],
  });
}

function createGangwonTrip() {
  const trip = normalizeTrip({
    id: uid(),
    title: '2026 강원도 속초-홍천-양평 부부여행',
    type: '국내 단기',
    startDate: '2026-06-18',
    endDate: '2026-06-21',
    companions: ['와이프'],
    regions: ['서초역', '속초', '설악산', '홍천', '양평', '서울'],
    lodgings: ['한화리조트 설악 쏘라노 2박', '반스힐리조트 1박'],
    currency: 'KRW',
    budget: '',
    templateId: 'gangwon-2026',
    notes: '오전근무 후 와이프와 만나 떠나는 3박 4일 강원도 부부여행.',
  });

  const byDate = {
    '2026-06-18': {
      summary: '서초역에서 만나 속초로 출발하고 중앙시장 먹거리로 숙소 저녁을 즐기는 날',
      planItems: [
        makePlanItem({ time: '12:00', title: '서초역 근처 합류', place: '서초역', category: '이동', memo: '오전근무 후 와이프와 만나 점심' }),
        makePlanItem({ time: '13:00', title: '강원도 방향 출발', place: '서울양양고속도로', category: '이동' }),
        makePlanItem({ time: '17:00', title: '속초중앙시장 포장', place: '속초중앙시장', category: '맛집', memo: '닭강정, 오징어순대, 감자전 후보' }),
        makePlanItem({ time: '18:30', title: '쏘라노 체크인', place: '한화리조트 설악 쏘라노', category: '체크인/체크아웃' }),
      ],
      routes: [
        makeRoute({ from: '서초역', to: '한화리조트 설악 쏘라노', via: '가평휴게소 또는 홍천휴게소, 속초중앙시장', transport: '자차', plannedTime: '4~5시간', trafficMemo: '금요일 전날 오후 이동, 휴게소 우동 감성 기록' }),
      ],
      checklists: [
        makeChecklistGroup('첫날 체크', ['와이프 합류', '점심 후 출발', '휴게소 우동/간식', '닭강정 포장', '숙소 체크인']),
      ],
      expenses: [
        makeExpense({ date: '2026-06-18', cat: '식비', title: '서초역 점심' }),
        makeExpense({ date: '2026-06-18', cat: '휴게소', title: '가평/홍천휴게소 우동' }),
        makeExpense({ date: '2026-06-18', cat: '식비', title: '속초중앙시장 먹거리' }),
      ],
      diaryDetails: {
        ...emptyDiaryDetails(),
        oneLine: '오전근무 후 와이프와 서초역에서 만나 강원도로 출발한 날',
        good: '휴게소 우동 감성과 중앙시장 포장 저녁',
        tomorrowMemo: '설악산 케이블카와 소공원 산책',
      },
    },
    '2026-06-19': {
      summary: '설악산 케이블카와 속초 여유 관광을 즐기는 날',
      planItems: [
        makePlanItem({ time: '08:30', title: '설악산 소공원 이동', place: '설악산 소공원', category: '관광' }),
        makePlanItem({ time: '09:30', title: '설악산 케이블카', place: '권금성', category: '관광', memo: '현장 구매, 기상/대기시간 확인' }),
        makePlanItem({ time: '12:30', title: '순두부 또는 해산물 점심', place: '속초/설악권', category: '맛집' }),
        makePlanItem({ time: '15:00', title: '카페 또는 온천/해변', place: '속초', category: '카페' }),
      ],
      routes: [
        makeRoute({ from: '쏘라노', to: '설악산 소공원', transport: '자차', plannedTime: '20분', ticketOrParkingMemo: '주차비 기록' }),
      ],
      checklists: [
        makeChecklistGroup('설악산 체크', ['케이블카 운행 확인', '주차 위치 기록', '대기시간 기록', '신흥사/소공원 산책', '카페 후보 선택']),
      ],
      expenses: [
        makeExpense({ date: '2026-06-19', cat: '관광/입장권', title: '설악산 케이블카' }),
        makeExpense({ date: '2026-06-19', cat: '주차비', title: '설악산 주차' }),
        makeExpense({ date: '2026-06-19', cat: '식비', title: '속초 순두부 점심' }),
        makeExpense({ date: '2026-06-19', cat: '카페', title: '설악산 전망 카페' }),
      ],
      diaryDetails: {
        ...emptyDiaryDetails(),
        oneLine: '설악산 케이블카와 속초 여유 관광을 즐긴 날',
        good: '케이블카, 설악산 경치, 순두부/카페',
        tomorrowMemo: '오션월드와 반스힐리조트 이동',
      },
    },
    '2026-06-20': {
      summary: '쏘라노 체크아웃 후 오션월드 반나절 물놀이와 반스힐 바비큐를 즐기는 날',
      planItems: [
        makePlanItem({ time: '09:30', title: '쏘라노 체크아웃', place: '한화리조트 설악 쏘라노', category: '체크인/체크아웃' }),
        makePlanItem({ time: '11:30', title: '홍천/오션월드 근처 점심', place: '홍천', category: '맛집' }),
        makePlanItem({ time: '13:00', title: '오션월드 반나절 물놀이', place: '오션월드', category: '물놀이', memo: '3~4시간만 즐기고 숙소 휴식 살리기' }),
        makePlanItem({ time: '17:30', title: '반스힐리조트 체크인', place: '반스힐리조트', category: '체크인/체크아웃' }),
        makePlanItem({ time: '19:00', title: '바비큐', place: '반스힐리조트', category: '바비큐' }),
      ],
      routes: [
        makeRoute({ from: '쏘라노', to: '반스힐리조트', via: '내린천휴게소 서울방향, 오션월드, 장보기 장소', transport: '자차', plannedTime: '종일 이동+활동', trafficMemo: '전체 여행 중 피로도 높은 날' }),
      ],
      checklists: [
        makeChecklistGroup('오션월드 준비물', ['래시가드/수영복', '수모/캡모자', '아쿠아슈즈', '방수팩', '수건', '갈아입을 옷', '선크림', '젖은 옷 담을 봉투']),
        makeChecklistGroup('바비큐 준비', ['고기', '쌈채소', '버섯/마늘', '김치', '라면', '물', '맥주/음료', '숯/그릴 비용 확인', '우천 시 가능 여부']),
      ],
      expenses: [
        makeExpense({ date: '2026-06-20', cat: '휴게소', title: '내린천휴게소 간식' }),
        makeExpense({ date: '2026-06-20', cat: '워터파크', title: '오션월드 입장권' }),
        makeExpense({ date: '2026-06-20', cat: '렌탈비', title: '구명조끼/타월/썬베드' }),
        makeExpense({ date: '2026-06-20', cat: '장보기', title: '바비큐 장보기' }),
      ],
      diaryDetails: {
        ...emptyDiaryDetails(),
        oneLine: '속초에서 홍천으로 이동해 오션월드와 반스힐 바비큐를 즐긴 날',
        good: '오션월드 물놀이, 반스힐리조트 체크인, 바비큐',
        bad: '이동과 물놀이로 피로도가 높을 수 있음',
        tomorrowMemo: '양평 홍춘관 점심과 카페 후 귀가',
      },
    },
    '2026-06-21': {
      summary: '양평에서 점심과 카페를 즐기고 서울로 돌아오는 날',
      planItems: [
        makePlanItem({ time: '10:30', title: '반스힐리조트 체크아웃', place: '반스힐리조트', category: '체크인/체크아웃' }),
        makePlanItem({ time: '12:30', title: '양평 홍춘관 점심', place: '양평 홍춘관', category: '맛집' }),
        makePlanItem({ time: '14:00', title: '양평 카페 1곳', place: '양평', category: '카페', memo: '로우드, 구벼울, 칸트의 마을 후보' }),
        makePlanItem({ time: '15:00', title: '서울 방향 출발', place: '양평', category: '이동', memo: '17시 전후 도착 목표' }),
      ],
      routes: [
        makeRoute({ from: '반스힐리조트', to: '집', via: '양평 홍춘관, 양평 카페', transport: '자차', plannedTime: '4~5시간', trafficMemo: '일요일 귀경 정체 고려' }),
      ],
      checklists: [
        makeChecklistGroup('마무리 체크', ['숙소 짐 확인', '양평 카페 1곳만 선택', '15시 전후 출발', '전체 여행 소감 작성']),
      ],
      expenses: [
        makeExpense({ date: '2026-06-21', cat: '식비', title: '양평 홍춘관 점심' }),
        makeExpense({ date: '2026-06-21', cat: '카페', title: '양평 카페' }),
        makeExpense({ date: '2026-06-21', cat: '주유비', title: '주유비/통행료' }),
      ],
      diaryDetails: {
        ...emptyDiaryDetails(),
        oneLine: '양평에서 점심과 카페를 즐기고 여행을 마무리한 날',
        good: '홍춘관 점심, 양평 카페, 여유로운 귀가',
        bad: '일요일 귀경 정체 여부 기록',
      },
    },
  };

  return {
    ...trip,
    days: trip.days.map((day) => normalizeDay({ ...day, ...(byDate[day.date] || {}) }, day.date)),
  };
}

function tripTotals(trip) {
  return safeArr(trip?.days).reduce(
    (acc, day) => {
      const expenses = safeArr(day.expenses);
      acc.expense += expenses.reduce((sum, expense) => sum + Number(expense.krwAmount || expense.amount || 0), 0);
      acc.planItems += safeArr(day.planItems).length;
      acc.done += safeArr(day.planItems).filter((item) => item.done).length;
      acc.routes += safeArr(day.routes).length;
      acc.photos += safeArr(day.photos).length;
      return acc;
    },
    { expense: 0, planItems: 0, done: 0, routes: 0, photos: 0 },
  );
}

function dayExpenseTotal(day) {
  return safeArr(day?.expenses).reduce((sum, expense) => sum + Number(expense.krwAmount || expense.amount || 0), 0);
}

function pickTodayIndex(trip) {
  if (!trip?.days?.length) return 0;
  const today = todayISO();
  const exact = trip.days.findIndex((day) => day.date === today);
  if (exact >= 0) return exact;
  const future = trip.days.findIndex((day) => day.date > today);
  return future >= 0 ? future : trip.days.length - 1;
}

function findTripOnDate(trips, date) {
  return safeArr(trips).find((trip) => trip.startDate <= date && trip.endDate >= date);
}

function vacationUsage(vacation) {
  const normalized = normalizeVacation(vacation);
  const activeDays = normalized.days
    .filter((day) => !day.canceled)
    .sort((a, b) => a.date.localeCompare(b.date));
  const indexByDate = new globalThis.Map(activeDays.map((day, index) => [day.date, normalized.usedBefore + index + 1]));
  return {
    ...normalized,
    activeDays,
    used: normalized.usedBefore + activeDays.length,
    remaining: Math.max(0, normalized.total - normalized.usedBefore - activeDays.length),
    indexByDate,
  };
}

function monthDays(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function addMonths(month, diff) {
  const [year, monthIndex] = month.split('-').map(Number);
  const next = new Date(year, monthIndex - 1 + diff, 1);
  return next.toISOString().slice(0, 7);
}

function toGravoExpense(expense, trip, day) {
  const meta = GRAVO_CAT_META[expense.cat] || GRAVO_CAT_META.기타;
  return {
    date: expense.date || day.date,
    cat: meta.cat,
    title: expense.title || expense.place || '여행 지출',
    card: expense.card || '미지정',
    amount: Number(expense.krwAmount || expense.amount || 0),
    tone: meta.tone,
    mark: meta.mark,
    source: 'travel-studio',
    tripId: trip.id,
    dayDate: day.date,
    place: expense.place || '',
    memo: expense.memo || '',
    currency: expense.currency || trip.currency || 'KRW',
  };
}

function imageFileToDataUrl(file, maxSize = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진 파일을 읽지 못했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('사진을 처리하지 못했습니다.'));
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function analyzePost(text) {
  const content = text || '';
  const firstParagraph = content.split(/\n\s*\n/).find(Boolean) || content;
  const hashtags = content.match(/#[^\s#]+/g) || [];
  const imageMarkers = content.match(/!\[|<img|\[사진\]|사진:/gi) || [];
  const links = content.match(/https?:\/\/|지도|네이버지도|카카오맵|place\.map/gi) || [];
  const sentences = content.split(/[.!?。！？\n]/).map((item) => item.trim()).filter(Boolean);
  const infoWords = ['가격', '비용', '주차', '예약', '운영', '시간', '위치', '메뉴', '대기', '팁', '동선', '교통'];
  const infoHits = infoWords.filter((word) => content.includes(word));
  const keywordCandidates = [...new Set((content.match(/[가-힣A-Za-z0-9]{2,}/g) || []).slice(0, 50))];
  const firstKeyword = keywordCandidates.find((keyword) => firstParagraph.includes(keyword)) || '';

  return {
    length: content.replace(/\s/g, '').length,
    firstKeyword,
    hashtags,
    imageMarkers: imageMarkers.length,
    links: links.length,
    infoHits,
    score: [
      content.replace(/\s/g, '').length >= 900,
      firstParagraph.length > 80,
      imageMarkers.length >= 3,
      hashtags.length >= 3 && hashtags.length <= 15,
      links.length >= 1,
      infoHits.length >= 5,
    ].filter(Boolean).length,
  };
}

function AppStyles() {
  return (
    <style>{`
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Inter:wght@500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

      :root {
        color: ${T.ink};
        background: ${T.bg};
        font-family: ${T.bodyFont};
        font-size: 15px;
      }

      * { box-sizing: border-box; }
      body { margin: 0; background: ${T.bg}; }
      button, input, textarea, select { font: inherit; }
      input[type="date"] { font-family: system-ui, sans-serif; color-scheme: light; }
      input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      button { cursor: pointer; }

      .app-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at 4% 4%, rgba(47, 58, 95, 0.13), transparent 27rem),
          radial-gradient(circle at 92% 0%, rgba(181, 106, 52, 0.13), transparent 23rem),
          linear-gradient(135deg, #F7F3EA 0%, #F2E8D8 48%, #FCFAF6 100%);
      }

      .layout {
        display: grid;
        grid-template-columns: 252px minmax(0, 1fr);
        gap: 22px;
        width: min(1240px, calc(100% - 32px));
        margin: 0 auto;
        padding: 22px 0 104px;
      }

      .side-nav {
        position: sticky;
        top: 22px;
        align-self: start;
        min-height: calc(100vh - 44px);
        border: 1px solid rgba(231, 226, 216, 0.9);
        border-radius: 32px;
        padding: 20px;
        background: rgba(255, 255, 255, 0.74);
        box-shadow: 0 24px 80px rgba(28, 25, 23, 0.08);
        backdrop-filter: blur(18px);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 22px;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 18px;
        background: ${T.accent};
        color: white;
        box-shadow: 0 14px 34px rgba(47, 58, 95, 0.22);
      }

      .brand h1 {
        margin: 0;
        font: 700 21px/1 ${T.displayFont};
        letter-spacing: -0.03em;
      }

      .brand p {
        margin: 4px 0 0;
        color: ${T.sub};
        font: 700 11px/1 ${T.sansFont};
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .nav-list { display: grid; gap: 8px; }

      .nav-button {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        border: 0;
        border-radius: 18px;
        padding: 13px 14px;
        background: transparent;
        color: ${T.sub};
        text-align: left;
        font-weight: 700;
      }

      .nav-button.active {
        background: ${T.accent};
        color: white;
        box-shadow: 0 16px 34px rgba(47, 58, 95, 0.18);
      }

      .nav-meta {
        margin-top: 22px;
        padding: 16px;
        border-radius: 22px;
        background: ${T.cardSoft};
        border: 1px solid ${T.border};
      }

      .main { min-width: 0; }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
        margin-bottom: 18px;
      }

      .eyebrow {
        margin: 0 0 8px;
        font: 800 11px/1.2 ${T.sansFont};
        color: ${T.accent};
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .page-title {
        margin: 0;
        font: 700 clamp(22px, 3vw, 34px)/1.12 ${T.displayFont};
        letter-spacing: -0.035em;
      }

      .page-subtitle {
        max-width: 680px;
        margin: 12px 0 0;
        color: ${T.sub};
        font-size: 15px;
        line-height: 1.62;
      }

      .button-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        border: 1px solid ${T.border};
        border-radius: 999px;
        padding: 10px 16px;
        background: white;
        color: ${T.ink};
        font: 800 13px/1 ${T.sansFont};
        box-shadow: 0 10px 28px rgba(28, 25, 23, 0.06);
      }

      .btn.primary {
        border-color: ${T.accent};
        background: ${T.accent};
        color: white;
      }

      .btn.danger {
        border-color: rgba(153, 27, 27, 0.22);
        color: ${T.danger};
      }

      .btn.ghost {
        background: rgba(255,255,255,0.62);
        box-shadow: none;
      }

      .card {
        border: 1px solid rgba(231, 226, 216, 0.92);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.84);
        box-shadow: 0 24px 70px rgba(28, 25, 23, 0.08);
        backdrop-filter: blur(16px);
      }

      .card-pad { padding: 22px; }
      .section { display: grid; gap: 16px; }
      .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }

      .stat-card {
        min-height: 118px;
        padding: 18px;
        border-radius: 24px;
        background: ${T.card};
        border: 1px solid ${T.border};
      }

      .stat-card b {
        display: block;
        margin-top: 8px;
        font: 700 23px/1 ${T.displayFont};
        letter-spacing: -0.03em;
      }

      .stat-card span {
        color: ${T.sub};
        font: 800 11px/1 ${T.sansFont};
        letter-spacing: 0.04em;
      }

      .cockpit-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 16px;
      }

      .today-card {
        position: relative;
        overflow: hidden;
        padding: 28px;
        border-radius: 34px;
        background:
          linear-gradient(135deg, rgba(47, 58, 95, 0.96), rgba(73, 83, 120, 0.82)),
          radial-gradient(circle at 92% 12%, rgba(255, 255, 255, 0.28), transparent 16rem);
        color: white;
        box-shadow: 0 30px 90px rgba(47, 58, 95, 0.22);
      }

      .today-card::after {
        content: '';
        position: absolute;
        width: 220px;
        height: 220px;
        right: -82px;
        bottom: -82px;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 50%;
      }

      .today-card h2 {
        position: relative;
        margin: 0;
        font: 700 clamp(22px, 3.2vw, 32px)/1.18 ${T.displayFont};
        letter-spacing: -0.035em;
      }

      .today-card p {
        position: relative;
        max-width: 560px;
        margin: 14px 0 0;
        color: rgba(255,255,255,0.78);
        font-size: 15px;
        line-height: 1.62;
      }

      .quick-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .quick-action {
        display: grid;
        gap: 9px;
        min-height: 90px;
        border: 1px solid ${T.border};
        border-radius: 24px;
        padding: 14px;
        background: white;
        text-align: left;
        font-weight: 800;
      }

      .quick-icon {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 14px;
        color: white;
      }

      .day-strip {
        display: flex;
        gap: 9px;
        overflow-x: auto;
        padding-bottom: 3px;
      }

      .day-pill {
        min-width: 96px;
        border: 1px solid ${T.border};
        border-radius: 18px;
        padding: 11px 12px;
        background: white;
        color: ${T.sub};
        text-align: left;
      }

      .day-pill.active {
        border-color: ${T.accent};
        background: ${T.accentSoft};
        color: ${T.accent};
      }

      .day-pill b {
        display: block;
        margin-top: 3px;
        color: inherit;
      }

      .list { display: grid; gap: 10px; }

      .list-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        padding: 14px;
        border-radius: 20px;
        background: ${T.cardSoft};
        border: 1px solid ${T.border};
      }

      .time-badge {
        min-width: 58px;
        border-radius: 14px;
        padding: 8px 9px;
        background: white;
        color: ${T.accent};
        font: 800 12px/1 ${T.sansFont};
        text-align: center;
      }

      .item-title {
        margin: 0;
        font-weight: 800;
      }

      .item-meta {
        margin: 5px 0 0;
        color: ${T.sub};
        font-size: 13px;
        line-height: 1.45;
      }

      .checkline {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        border: 0;
        background: transparent;
        padding: 8px 0;
        color: ${T.ink};
        text-align: left;
      }

      .checkmark {
        display: grid;
        place-items: center;
        flex: 0 0 22px;
        width: 22px;
        height: 22px;
        border-radius: 8px;
        border: 1px solid ${T.border};
        color: transparent;
      }

      .checkline.done .checkmark {
        background: ${T.accent};
        border-color: ${T.accent};
        color: white;
      }

      .checkline.done span:last-child {
        color: ${T.sub};
        text-decoration: line-through;
      }

      .field {
        display: grid;
        gap: 7px;
      }

      .field label {
        color: ${T.sub};
        font: 800 12px/1 ${T.sansFont};
        letter-spacing: 0.04em;
      }

      .input, .textarea, .select {
        width: 100%;
        border: 1px solid ${T.border};
        border-radius: 18px;
        padding: 12px 14px;
        background: white;
        color: ${T.ink};
        outline: none;
      }

      .textarea { min-height: 112px; resize: vertical; line-height: 1.6; }
      .input:focus, .textarea:focus, .select:focus { border-color: ${T.accent}; box-shadow: 0 0 0 4px rgba(47, 58, 95, 0.1); }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: clamp(18px, 4vw, 48px);
        background: rgba(28, 25, 23, 0.34);
        backdrop-filter: blur(8px);
      }

      .modal {
        width: min(1040px, 100%);
        min-height: min(680px, calc(100vh - 96px));
        max-height: calc(100vh - 96px);
        overflow: auto;
        border: 1px solid rgba(255,255,255,0.8);
        border-radius: 34px;
        background: ${T.bg};
        box-shadow: 0 30px 120px rgba(28, 25, 23, 0.28);
      }

      .modal-head {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 18px 20px;
        background: rgba(250, 247, 242, 0.92);
        border-bottom: 1px solid ${T.border};
        backdrop-filter: blur(12px);
      }

      .icon-button {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 1px solid ${T.border};
        border-radius: 16px;
        background: white;
      }

      .empty-state {
        display: grid;
        place-items: center;
        min-height: 520px;
        padding: 34px;
        text-align: center;
      }

      .empty-state h2 {
        margin: 14px 0 8px;
        font: 700 clamp(24px, 4vw, 36px)/1.14 ${T.displayFont};
        letter-spacing: -0.035em;
      }

      .template-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .template-card {
        min-height: 150px;
        border: 1px solid ${T.border};
        border-radius: 24px;
        padding: 18px;
        background: white;
        text-align: left;
      }

      .template-card b {
        display: block;
        margin: 12px 0 6px;
        font-size: 16px;
      }

      .timeline-week {
        display: grid;
        gap: 12px;
      }

      .collapse-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        width: 100%;
        border: 1px solid ${T.border};
        border-radius: 22px;
        padding: 14px 16px;
        background: white;
        text-align: left;
      }

      .expense-table {
        display: grid;
        gap: 8px;
      }

      .expense-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 13px 14px;
        border-radius: 18px;
        background: ${T.cardSoft};
        border: 1px solid ${T.border};
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 8px;
      }

      .calendar-cell {
        min-height: 118px;
        border: 1px solid ${T.border};
        border-radius: 20px;
        padding: 10px;
        background: white;
        color: ${T.ink};
        text-align: left;
      }

      .calendar-cell.outside {
        opacity: 0.42;
      }

      .calendar-cell.has-trip {
        border-color: rgba(47, 58, 95, 0.32);
        background: ${T.accentSoft};
      }

      .calendar-cell.has-vacation {
        box-shadow: inset 0 0 0 2px rgba(181, 106, 52, 0.18);
      }

      .calendar-date {
        display: flex;
        justify-content: space-between;
        gap: 6px;
        font: 800 12px/1 ${T.sansFont};
      }

      .calendar-tags {
        display: grid;
        gap: 5px;
        margin-top: 10px;
      }

      .mini-tag {
        display: inline-flex;
        width: fit-content;
        max-width: 100%;
        border-radius: 999px;
        padding: 5px 8px;
        background: rgba(47, 58, 95, 0.09);
        color: ${T.accent};
        font: 800 11px/1 ${T.sansFont};
      }

      .mini-tag.vacation {
        background: rgba(181, 106, 52, 0.12);
        color: ${T.warning};
      }

      .mobile-nav {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 20;
        display: none;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
        padding: 8px;
        border: 1px solid rgba(231, 226, 216, 0.96);
        border-radius: 26px;
        background: rgba(255,255,255,0.86);
        box-shadow: 0 24px 70px rgba(28,25,23,0.16);
        backdrop-filter: blur(18px);
      }

      .mobile-nav button {
        display: grid;
        place-items: center;
        gap: 4px;
        border: 0;
        border-radius: 18px;
        padding: 9px 4px;
        background: transparent;
        color: ${T.sub};
        font: 800 10px/1 ${T.sansFont};
      }

      .mobile-nav button.active { background: ${T.accent}; color: white; }

      @media (max-width: 980px) {
        .layout { grid-template-columns: 1fr; width: min(100% - 24px, 760px); padding-top: 14px; }
        .side-nav { display: none; }
        .mobile-nav { display: grid; }
        .topbar { display: grid; }
        .cockpit-hero, .grid-2, .grid-3, .grid-4, .template-grid { grid-template-columns: 1fr; }
        .quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }

      @media (max-width: 560px) {
        .layout { width: min(100% - 18px, 760px); padding-bottom: 96px; }
        .card-pad, .today-card { padding: 18px; border-radius: 26px; }
        .page-title { font-size: 22px; line-height: 1.18; }
        .today-card h2 { font-size: 21px; line-height: 1.22; }
        .empty-state h2 { font-size: 24px; line-height: 1.18; }
        .stat-card { min-height: 96px; padding: 15px; }
        .stat-card b { font-size: 20px; }
        .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .list-item { grid-template-columns: minmax(0, 1fr); }
        .modal-backdrop { place-items: center; padding: 10px; }
        .modal {
          width: 100%;
          min-height: min(760px, calc(100dvh - 20px));
          max-height: calc(100dvh - 20px);
          border-radius: 26px;
        }
        .calendar-grid { gap: 5px; }
        .calendar-cell { min-height: 86px; padding: 7px; border-radius: 15px; }
        .mini-tag { font-size: 10px; padding: 4px 6px; }
      }
    `}</style>
  );
}

export default function TravelStudio() {
  const [storage, setStorage] = useState(() => loadStorage());
  const [activeTab, setActiveTab] = useState('today');
  const [activeTripId, setActiveTripId] = useState(storage.activeTripId || storage.trips[0]?.id || '');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [quickAction, setQuickAction] = useState(null);
  const [tripModal, setTripModal] = useState(null);
  const [vacationModal, setVacationModal] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_KEY) || '');

  const trips = storage.trips;
  const vacation = normalizeVacation(storage.vacation);
  const activeTrip = trips.find((trip) => trip.id === activeTripId) || trips[0] || null;
  const activeDay = activeTrip?.days?.[selectedDayIndex] || activeTrip?.days?.[0] || null;

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...storage, activeTripId }));
  }, [storage, activeTripId]);

  useEffect(() => {
    if (apiKey) localStorage.setItem(API_KEY_KEY, apiKey);
    else localStorage.removeItem(API_KEY_KEY);
  }, [apiKey]);

  useEffect(() => {
    if (!activeTrip) return;
    setSelectedDayIndex((current) => {
      if (activeTrip.days[current]) return current;
      return pickTodayIndex(activeTrip);
    });
  }, [activeTripId, activeTrip?.days?.length]);

  const updateTrip = (tripId, updater) => {
    setStorage((prev) => ({
      ...prev,
      trips: prev.trips.map((trip) => (trip.id === tripId ? normalizeTrip(typeof updater === 'function' ? updater(trip) : updater) : trip)),
    }));
  };

  const updateVacation = (updater) => {
    setStorage((prev) => ({
      ...prev,
      vacation: normalizeVacation(typeof updater === 'function' ? updater(normalizeVacation(prev.vacation)) : updater),
    }));
  };

  const updateActiveDay = (updater, dayIndex = selectedDayIndex) => {
    if (!activeTrip) return;
    updateTrip(activeTrip.id, (trip) => ({
      ...trip,
      days: trip.days.map((day, index) => (index === dayIndex ? normalizeDay(typeof updater === 'function' ? updater(day) : updater, day.date) : day)),
    }));
  };

  const addTrip = (trip) => {
    const normalized = normalizeTrip(trip);
    setStorage((prev) => ({ ...prev, trips: [normalized, ...prev.trips] }));
    setActiveTripId(normalized.id);
    setSelectedDayIndex(pickTodayIndex(normalized));
    setActiveTab('today');
  };

  const deleteTrip = (tripId) => {
    setStorage((prev) => {
      const nextTrips = prev.trips.filter((trip) => trip.id !== tripId);
      return { ...prev, trips: nextTrips };
    });
    if (activeTripId === tripId) {
      const next = trips.find((trip) => trip.id !== tripId);
      setActiveTripId(next?.id || '');
      setSelectedDayIndex(0);
    }
  };

  const handleTemplate = (templateId) => {
    addTrip(templateId === 'gangwon' ? createGangwonTrip() : createTripFromTemplate(templateId));
  };

  const resetAll = () => {
    if (!window.confirm('현재 Travel Studio v2 저장 데이터를 모두 삭제할까요?')) return;
    localStorage.removeItem(LS_KEY);
    setStorage({ trips: [], activeTripId: '' });
    setActiveTripId('');
    setSelectedDayIndex(0);
    setActiveTab('today');
  };

  const pageTitle = activeTrip ? activeTrip.title : 'Travel Studio';

  return (
    <div className="app-shell">
      <AppStyles />
      <div className="layout">
        <aside className="side-nav">
          <Brand />
          <nav className="nav-list">
            {NAV_ITEMS.map((item) => (
              <NavButton key={item.id} item={item} active={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
            ))}
          </nav>
          <div className="nav-meta">
            <p className="eyebrow">Active Trip</p>
            <strong>{activeTrip?.title || '아직 여행 없음'}</strong>
            <p className="item-meta">{activeTrip ? `${formatShortDate(activeTrip.startDate)} - ${formatShortDate(activeTrip.endDate)} · ${activeTrip.type}` : '프리셋이나 템플릿으로 시작하세요.'}</p>
          </div>
        </aside>

        <main className="main">
          {!activeTrip ? (
            <EmptyStart onCreateBlank={() => addTrip(createBlankTrip())} onTemplate={handleTemplate} />
          ) : (
            <>
              <header className="topbar">
                <div>
                  <p className="eyebrow">{activeTab === 'today' ? 'Today Cockpit' : activeTab}</p>
                  <h1 className="page-title">{activeTab === 'today' ? '오늘을 바로 기록하기' : pageTitle}</h1>
                  <p className="page-subtitle">
                    {activeTab === 'today'
                      ? '여행 중에는 길게 생각하지 않아도 됩니다. 일정, 이동, 소비, 사진, 일기를 빠른 기록으로 남겨두면 여행 후 글과 회고가 훨씬 쉬워집니다.'
                      : `${activeTrip.type} · ${formatShortDate(activeTrip.startDate)} - ${formatShortDate(activeTrip.endDate)}`}
                  </p>
                </div>
                <div className="button-row">
                  <button className="btn ghost" onClick={() => setTripModal({ mode: 'edit', trip: activeTrip })}><Edit3 size={16} /> 여행 수정</button>
                  <button className="btn primary" onClick={() => setQuickAction('plan')}><Plus size={16} /> 빠른 기록</button>
                </div>
              </header>

              {activeTab === 'today' && (
                <TodayCockpit
                  trip={activeTrip}
                  day={activeDay}
                  dayIndex={selectedDayIndex}
                  onSelectDay={setSelectedDayIndex}
                  onQuick={setQuickAction}
                  onUpdateDay={updateActiveDay}
                  onUpdateTrip={(updater) => updateTrip(activeTrip.id, updater)}
                />
              )}
              {activeTab === 'calendar' && (
                <VacationCalendar
                  trips={trips}
                  vacation={vacation}
                  activeTripId={activeTripId}
                  onOpenDate={(date) => {
                    const trip = findTripOnDate(trips, date);
                    if (trip) {
                      setActiveTripId(trip.id);
                      setSelectedDayIndex(Math.max(0, trip.days.findIndex((day) => day.date === date)));
                      setActiveTab('today');
                    } else {
                      setVacationModal({ date });
                    }
                  }}
                  onEditVacation={(date) => setVacationModal({ date })}
                  onUpdateVacation={updateVacation}
                />
              )}
              {activeTab === 'timeline' && (
                <Timeline
                  trip={activeTrip}
                  selectedDayIndex={selectedDayIndex}
                  onSelectDay={(index) => {
                    setSelectedDayIndex(index);
                    setActiveTab('today');
                  }}
                  onUpdateDay={updateActiveDay}
                />
              )}
              {activeTab === 'expenses' && <Expenses trip={activeTrip} onUpdateTrip={updateTrip} />}
              {activeTab === 'library' && (
                <TripLibrary
                  trips={trips}
                  activeTripId={activeTripId}
                  onSelect={(trip) => {
                    setActiveTripId(trip.id);
                    setSelectedDayIndex(pickTodayIndex(trip));
                    setActiveTab('today');
                  }}
                  onCreateBlank={() => addTrip(createBlankTrip())}
                  onTemplate={handleTemplate}
                  onEdit={(trip) => setTripModal({ mode: 'edit', trip })}
                  onDelete={deleteTrip}
                />
              )}
              {activeTab === 'review' && <Review apiKey={apiKey} onNeedKey={() => setActiveTab('settings')} />}
              {activeTab === 'settings' && (
                <SettingsPanel
                  apiKey={apiKey}
                  onApiKey={setApiKey}
                  storage={storage}
                  vacation={vacation}
                  onUpdateVacation={updateVacation}
                  onReset={resetAll}
                />
              )}
            </>
          )}
        </main>
      </div>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {quickAction && activeTrip && activeDay && (
        <QuickCaptureModal
          action={quickAction}
          trip={activeTrip}
          day={activeDay}
          onClose={() => setQuickAction(null)}
          onSave={(patcher) => {
            updateActiveDay(patcher);
            setQuickAction(null);
          }}
        />
      )}

      {tripModal && (
        <TripFormModal
          mode={tripModal.mode}
          trip={tripModal.trip}
          onClose={() => setTripModal(null)}
          onSave={(trip) => {
            if (tripModal.mode === 'edit') updateTrip(trip.id, trip);
            else addTrip(trip);
            setTripModal(null);
          }}
        />
      )}

      {vacationModal && (
        <VacationDayModal
          date={vacationModal.date}
          trips={trips}
          vacation={vacation}
          onClose={() => setVacationModal(null)}
          onSave={(entry) => {
            updateVacation((current) => {
              const originalDate = entry.originalDate || entry.date;
              const cleanEntry = { ...entry };
              delete cleanEntry.originalDate;
              const others = current.days.filter((day) => day.date !== originalDate && day.date !== cleanEntry.date);
              return {
                ...current,
                days: [...others, { id: entry.id || uid(), ...cleanEntry }],
              };
            });
            setVacationModal(null);
          }}
          onDelete={(date) => {
            updateVacation((current) => ({ ...current, days: current.days.filter((day) => day.date !== date) }));
            setVacationModal(null);
          }}
          onGoTrip={(trip, date) => {
            setActiveTripId(trip.id);
            setSelectedDayIndex(Math.max(0, trip.days.findIndex((day) => day.date === date)));
            setActiveTab('today');
            setVacationModal(null);
          }}
        />
      )}
    </div>
  );
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { trips: [], activeTripId: '', vacation: normalizeVacation() };
    const parsed = JSON.parse(raw);
    return {
      trips: safeArr(parsed.trips).map(normalizeTrip),
      activeTripId: parsed.activeTripId || '',
      vacation: normalizeVacation(parsed.vacation),
    };
  } catch {
    return { trips: [], activeTripId: '', vacation: normalizeVacation() };
  }
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Map size={23} /></div>
      <div>
        <h1>Travel Studio</h1>
        <p>Plan · Capture · Review</p>
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon size={19} />
      <span>{item.label}</span>
    </button>
  );
}

function EmptyStart({ onCreateBlank, onTemplate }) {
  return (
    <section className="card empty-state">
      <Sparkles size={42} color={T.accent} />
      <h2>여행을 하나 만들면, 기록이 훨씬 쉬워집니다.</h2>
      <p className="page-subtitle">
        기존 데이터는 사용하지 않는 새 구조입니다. 빈 여행으로 시작하거나 템플릿, 강원도 프리셋으로 바로 앱을 테스트해볼 수 있습니다.
      </p>
      <div className="button-row" style={{ justifyContent: 'center', margin: '24px 0' }}>
        <button className="btn primary" onClick={onCreateBlank}><Plus size={16} /> 빈 여행 만들기</button>
        <button className="btn" onClick={() => onTemplate('gangwon')}><MapPin size={16} /> 2026 강원도 프리셋</button>
      </div>
      <div className="template-grid" style={{ width: '100%' }}>
        {Object.values(TEMPLATE_PROFILES).map((template) => (
          <button key={template.id} className="template-card" onClick={() => onTemplate(template.id)}>
            <Plane size={22} color={T.accent} />
            <b>{template.label}</b>
            <span className="item-meta">{template.days}일 기본 구성 · 체크리스트와 소비 항목 포함</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TodayCockpit({ trip, day, dayIndex, onSelectDay, onQuick, onUpdateDay, onUpdateTrip }) {
  const totals = tripTotals(trip);
  const nextRoute = day.routes.find((route) => route.from || route.to);
  const unchecked = day.checklists.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id }))).filter((item) => !item.done).slice(0, 4);

  return (
    <div className="section">
      <div className="cockpit-hero">
        <section className="today-card">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.74)' }}>{formatDate(day.date)}</p>
          <h2>{day.summary || day.diaryDetails.oneLine || '오늘 여행의 핵심을 기록해보세요.'}</h2>
          <p>{nextRoute ? `${nextRoute.from || '출발지'}에서 ${nextRoute.to || '도착지'}까지 · ${nextRoute.transport}` : '다음 이동이 비어 있습니다. 빠른 기록에서 이동을 추가해두면 여행 중 동선 회고가 쉬워져요.'}</p>
        </section>
        <section className="card card-pad">
          <p className="eyebrow">Quick Capture</p>
          <div className="quick-grid">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.id} className="quick-action" onClick={() => onQuick(action.id)}>
                  <span className="quick-icon" style={{ background: action.color }}><Icon size={18} /></span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <DayStrip trip={trip} selectedDayIndex={dayIndex} onSelectDay={onSelectDay} />

      <TripStagePanel trip={trip} onUpdateTrip={onUpdateTrip} />

      <div className="grid-4">
        <Stat label="오늘 지출" value={formatKRW(dayExpenseTotal(day))} />
        <Stat label="완료 일정" value={`${day.planItems.filter((item) => item.done).length}/${day.planItems.length}`} />
        <Stat label="전체 지출" value={formatKRW(totals.expense)} />
        <Stat label="사진 기록" value={`${totals.photos}장`} />
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <SectionTitle icon={CalendarDays} title="오늘 일정" action={<button className="btn ghost" onClick={() => onQuick('plan')}><Plus size={15} /> 추가</button>} />
          <div className="list">
            {day.planItems.length ? day.planItems.map((item) => (
              <PlanItemCard key={item.id} item={item} onToggle={() => onUpdateDay((current) => ({
                ...current,
                planItems: current.planItems.map((target) => target.id === item.id ? { ...target, done: !target.done } : target),
              }))} />
            )) : <EmptyMini text="아직 일정이 없습니다. 빠른 기록으로 첫 일정을 추가하세요." />}
          </div>
        </section>

        <section className="card card-pad">
          <SectionTitle icon={Route} title="다음 이동" action={<button className="btn ghost" onClick={() => onQuick('route')}><Plus size={15} /> 추가</button>} />
          <div className="list">
            {day.routes.length ? day.routes.slice(0, 3).map((route) => <RouteCard key={route.id} route={route} />) : <EmptyMini text="이동 동선이 없습니다. 출발지와 도착지만 남겨도 충분합니다." />}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <SectionTitle icon={ClipboardList} title="바로 체크할 것" action={<button className="btn ghost" onClick={() => onQuick('checklist')}><Plus size={15} /> 추가</button>} />
          {unchecked.length ? (
            <div>
              {day.checklists.map((group) => (
                <div key={group.id}>
                  <p className="item-meta" style={{ fontWeight: 800 }}>{group.title}</p>
                  {group.items.slice(0, 5).map((item) => (
                    <ChecklistLine key={item.id} item={item} onToggle={() => onUpdateDay((current) => toggleChecklistItem(current, group.id, item.id))} />
                  ))}
                </div>
              ))}
            </div>
          ) : <EmptyMini text="체크할 항목이 없거나 모두 완료했습니다." />}
        </section>

        <section className="card card-pad">
          <SectionTitle icon={NotebookPen} title="오늘의 일기" action={<button className="btn ghost" onClick={() => onQuick('diary')}><Edit3 size={15} /> 쓰기</button>} />
          <p className="item-title">{day.diaryDetails.oneLine || '오늘의 한 줄이 비어 있습니다.'}</p>
          <p className="item-meta">{day.diaryDetails.good || '좋았던 순간, 맛있었던 음식, 아쉬운 점을 짧게 남겨두면 글 검토 단계에서 큰 재료가 됩니다.'}</p>
        </section>
      </div>
    </div>
  );
}

function DayStrip({ trip, selectedDayIndex, onSelectDay }) {
  return (
    <div className="day-strip">
      {trip.days.map((day, index) => (
        <button key={day.date} className={`day-pill ${index === selectedDayIndex ? 'active' : ''}`} onClick={() => onSelectDay(index)}>
          <span>Day {index + 1}</span>
          <b>{formatShortDate(day.date)}</b>
        </button>
      ))}
    </div>
  );
}

function TripStagePanel({ trip, onUpdateTrip }) {
  const phase = getTripPhase(trip);
  const meta = tripPhaseMeta(phase);
  const field = phase === 'planning' ? 'planning' : phase === 'recording' ? 'recording' : 'review';
  const stageNotes = trip.stageNotes || {};

  const updateStage = (key, value) => {
    onUpdateTrip((current) => ({
      ...current,
      stageNotes: { ...(current.stageNotes || {}), [key]: value },
    }));
  };

  return (
    <section className="card card-pad">
      <SectionTitle icon={BookOpen} title={meta.label} />
      <p className="item-meta" style={{ marginTop: -6 }}>{meta.helper}</p>
      <div className="grid-2" style={{ marginTop: 14 }}>
        <Textarea
          label={phase === 'planning' ? '여행 전 계획 메모' : phase === 'recording' ? '여행 중 상황 메모' : '여행 후 회고 메모'}
          value={stageNotes[field] || ''}
          onChange={(value) => updateStage(field, value)}
          placeholder={phase === 'planning' ? '예약, 준비물, 동선 변경 가능성 등을 적어두세요.' : phase === 'recording' ? '현장에서 바뀐 일정, 컨디션, 실제 느낌을 적어두세요.' : '좋았던 점, 아쉬웠던 점, 다음 여행 개선점을 적어두세요.'}
        />
        <div className="section">
          <Input
            label="전체 만족도"
            value={stageNotes.rating || ''}
            onChange={(value) => updateStage('rating', value)}
            placeholder="예: 4.5/5, 아주 만족"
          />
          <Textarea
            label="다음 여행에 반영할 점"
            value={stageNotes.lessons || ''}
            onChange={(value) => updateStage('lessons', value)}
            placeholder="다음에는 더 일찍 출발, 오션월드는 반나절만 등"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Icon size={19} color={T.accent} />
        <h2 style={{ margin: 0, font: `700 18px/1.18 ${T.displayFont}`, letterSpacing: '-0.025em' }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyMini({ text }) {
  return <p className="item-meta" style={{ padding: 14, border: `1px dashed ${T.border}`, borderRadius: 18 }}>{text}</p>;
}

function PlanItemCard({ item, onToggle }) {
  return (
    <div className="list-item">
      <div className="time-badge">{item.time || '시간'}</div>
      <div>
        <p className="item-title">{item.title || '제목 없는 일정'}</p>
        <p className="item-meta">{[item.place, item.category, item.memo].filter(Boolean).join(' · ')}</p>
      </div>
      <button className={`icon-button ${item.done ? 'active' : ''}`} onClick={onToggle} aria-label="일정 완료 토글">
        <CheckCircle2 size={19} color={item.done ? T.success : T.sub} />
      </button>
    </div>
  );
}

function RouteCard({ route }) {
  return (
    <div className="list-item">
      <div className="time-badge">{route.transport || '이동'}</div>
      <div>
        <p className="item-title">{route.from || '출발지'} <ArrowRight size={14} style={{ verticalAlign: 'middle' }} /> {route.to || '도착지'}</p>
        <p className="item-meta">{[route.via && `경유 ${route.via}`, route.plannedTime && `예상 ${route.plannedTime}`, route.actualTime && `실제 ${route.actualTime}`, route.trafficMemo].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  );
}

function ChecklistLine({ item, onToggle }) {
  return (
    <button className={`checkline ${item.done ? 'done' : ''}`} onClick={onToggle}>
      <span className="checkmark"><Check size={14} /></span>
      <span>{item.text}</span>
    </button>
  );
}

function toggleChecklistItem(day, groupId, itemId) {
  return {
    ...day,
    checklists: day.checklists.map((group) => group.id === groupId
      ? { ...group, items: group.items.map((item) => item.id === itemId ? { ...item, done: !item.done } : item) }
      : group),
  };
}

function Timeline({ trip, selectedDayIndex, onSelectDay, onUpdateDay }) {
  const [openWeeks, setOpenWeeks] = useState(() => new Set([Math.floor(selectedDayIndex / 7)]));
  const weeks = [];
  for (let index = 0; index < trip.days.length; index += 7) {
    weeks.push({ index: index / 7, days: trip.days.slice(index, index + 7), offset: index });
  }

  const toggleWeek = (weekIndex) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekIndex)) next.delete(weekIndex);
      else next.add(weekIndex);
      return next;
    });
  };

  return (
    <div className="section">
      <div className="grid-3">
        <Stat label="여행 일수" value={`${trip.days.length}일`} />
        <Stat label="전체 일정" value={`${tripTotals(trip).planItems}개`} />
        <Stat label="이동 동선" value={`${tripTotals(trip).routes}개`} />
      </div>
      {weeks.map((week) => (
        <section className="timeline-week" key={week.index}>
          <button className="collapse-head" onClick={() => toggleWeek(week.index)}>
            <div>
              <b>{week.index + 1}주차</b>
              <p className="item-meta">{formatShortDate(week.days[0].date)} - {formatShortDate(week.days[week.days.length - 1].date)}</p>
            </div>
            <ChevronDown size={19} style={{ transform: openWeeks.has(week.index) ? 'rotate(180deg)' : 'none' }} />
          </button>
          {openWeeks.has(week.index) && (
            <div className="grid-2">
              {week.days.map((day, localIndex) => (
                <article key={day.date} className="card card-pad">
                  <p className="eyebrow">Day {week.offset + localIndex + 1} · {formatDate(day.date)}</p>
                  <h2 style={{ margin: 0, font: `700 19px/1.28 ${T.displayFont}`, letterSpacing: '-0.025em' }}>{day.summary || day.diaryDetails.oneLine || '요약 없음'}</h2>
                  <p className="item-meta">{day.planItems.length}개 일정 · {day.routes.length}개 이동 · {formatKRW(dayExpenseTotal(day))}</p>
                  <div className="button-row" style={{ marginTop: 14 }}>
                    <button className="btn primary" onClick={() => onSelectDay(week.offset + localIndex)}>오늘 화면에서 열기</button>
                    <button className="btn ghost" onClick={() => onUpdateDay((current) => ({ ...current, summary: current.summary || current.diaryDetails.oneLine || '기록할 하루' }), week.offset + localIndex)}>요약 채우기</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function VacationCalendar({ trips, vacation, activeTripId, onOpenDate, onEditVacation, onUpdateVacation }) {
  const activeTrip = trips.find((trip) => trip.id === activeTripId) || trips[0];
  const [month, setMonth] = useState((activeTrip?.startDate || todayISO()).slice(0, 7));
  const usage = vacationUsage(vacation);
  const vacationByDate = new globalThis.Map(usage.days.map((day) => [day.date, day]));
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className="section">
      <div className="grid-3">
        <Stat label="총 휴가" value={`${usage.total}일`} />
        <Stat label="사용/예정" value={`${usage.used}/${usage.total}`} />
        <Stat label="남은 휴가" value={`${usage.remaining}일`} />
      </div>

      <section className="card card-pad">
        <SectionTitle icon={CalendarDays} title="휴가 캘린더" action={
          <div className="button-row">
            {activeTrip && <button className="btn primary" onClick={() => onUpdateVacation((current) => {
              const existingDates = new Set(current.days.map((day) => day.date));
              const newDays = activeTrip.days
                .filter((day) => !existingDates.has(day.date))
                .map((day) => ({ id: uid(), date: day.date, tripId: activeTrip.id, note: `${activeTrip.title} Day ${activeTrip.days.findIndex((target) => target.date === day.date) + 1}`, canceled: false }));
              return { ...current, days: [...current.days, ...newDays] };
            })}>현재 여행 휴가로 추가</button>}
            <button className="btn ghost" onClick={() => setMonth(addMonths(month, -1))}>이전</button>
            <button className="btn ghost" onClick={() => setMonth(todayISO().slice(0, 7))}>오늘</button>
            <button className="btn ghost" onClick={() => setMonth(addMonths(month, 1))}>다음</button>
          </div>
        } />
        <p className="item-meta">{monthLabel} · 휴가 산정기간 {usage.cycleStart} - {usage.cycleEnd}</p>
        <div className="grid-2" style={{ margin: '14px 0' }}>
          <Input label="총 휴가일수" type="number" value={usage.total} onChange={(total) => onUpdateVacation((current) => ({ ...current, total: Number(total || 0) }))} />
          <Input label="이미 사용한 휴가" type="number" value={usage.usedBefore} onChange={(usedBefore) => onUpdateVacation((current) => ({ ...current, usedBefore: Number(usedBefore || 0) }))} />
        </div>
        <div className="calendar-grid" style={{ marginTop: 14 }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => <div key={day} className="eyebrow" style={{ textAlign: 'center', margin: 0 }}>{day}</div>)}
          {monthDays(month).map((date) => {
            const trip = findTripOnDate(trips, date);
            const tripDay = trip?.days.findIndex((day) => day.date === date);
            const vacationDay = vacationByDate.get(date);
            const usageIndex = usage.indexByDate.get(date);
            const outside = !date.startsWith(month);
            return (
              <button
                key={date}
                className={`calendar-cell ${outside ? 'outside' : ''} ${trip ? 'has-trip' : ''} ${vacationDay && !vacationDay.canceled ? 'has-vacation' : ''}`}
                onClick={() => vacationDay && !trip ? onEditVacation(date) : onOpenDate(date)}
              >
                <div className="calendar-date">
                  <span>{Number(date.slice(-2))}</span>
                  {usageIndex && <span>{usageIndex}/{usage.total}</span>}
                </div>
                <div className="calendar-tags">
                  {trip && <span className="mini-tag">여행 Day {tripDay + 1}</span>}
                  {vacationDay && <span className="mini-tag vacation">{vacationDay.canceled ? '휴가 취소' : `${usageIndex || '-'} / ${usage.total} 휴가`}</span>}
                  {vacationDay?.note && <span className="item-meta">{vacationDay.note}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card card-pad">
        <SectionTitle icon={ClipboardList} title="휴가 목록" />
        <div className="list">
          {usage.days.length ? usage.days.sort((a, b) => a.date.localeCompare(b.date)).map((day) => {
            const trip = trips.find((item) => item.id === day.tripId) || findTripOnDate(trips, day.date);
            const number = usage.indexByDate.get(day.date);
            return (
              <div className="list-item" key={day.id}>
                <div className="time-badge">{number ? `${number}/${usage.total}` : '취소'}</div>
                <div>
                  <p className="item-title">{formatDate(day.date)} {day.canceled ? '휴가 취소됨' : '휴가'}</p>
                  <p className="item-meta">{[trip?.title, day.note].filter(Boolean).join(' · ') || '메모 없음'}</p>
                </div>
                <button className="btn ghost" onClick={() => onEditVacation(day.date)}>수정</button>
              </div>
            );
          }) : <EmptyMini text="아직 지정된 휴가가 없습니다. 캘린더에서 날짜를 눌러 휴가를 추가하세요." />}
        </div>
      </section>
    </div>
  );
}

function VacationDayModal({ date, trips, vacation, onClose, onSave, onDelete, onGoTrip }) {
  const existing = vacation.days.find((day) => day.date === date);
  const dateTrip = findTripOnDate(trips, date);
  const [form, setForm] = useState(() => ({
    id: existing?.id || '',
    originalDate: date,
    date,
    tripId: existing?.tripId || dateTrip?.id || '',
    note: existing?.note || '',
    canceled: Boolean(existing?.canceled),
  }));
  const linkedTrip = trips.find((trip) => trip.id === form.tripId) || findTripOnDate(trips, form.date);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <b>휴가 날짜 설정</b>
            <p className="item-meta" style={{ margin: 0 }}>{formatDate(form.date)}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="card-pad section" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
          <FormGrid>
            <Input label="휴가 날짜" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
            <div className="field">
              <label>연결할 여행</label>
              <select className="select" value={form.tripId} onChange={(event) => setForm({ ...form, tripId: event.target.value })}>
                <option value="">여행 미연결</option>
                {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
              </select>
            </div>
          </FormGrid>
          <p className="item-meta">날짜가 여행 기간 안에 있으면 캘린더 클릭 시 해당 여행 Day로 바로 이동합니다.</p>
          {linkedTrip && <p className="item-title">연결된 여행: {linkedTrip.title}</p>}
          <Textarea label="휴가 메모" value={form.note} onChange={(note) => setForm({ ...form, note })} placeholder="예: 강원도 여행 1일차, 병원 일정 후 출발 등" />
          <label className="checkline">
            <input type="checkbox" checked={form.canceled} onChange={(event) => setForm({ ...form, canceled: event.target.checked })} />
            <span>이 휴가를 취소 처리하고 사용일수에서 제외</span>
          </label>
          <div className="button-row" style={{ justifyContent: 'space-between' }}>
            <div className="button-row">
              {existing && <button className="btn danger" type="button" onClick={() => onDelete(date)}><Trash2 size={15} /> 삭제</button>}
              {linkedTrip && <button className="btn ghost" type="button" onClick={() => onGoTrip(linkedTrip, form.date)}>여행으로 이동</button>}
            </div>
            <button className="btn primary" type="submit">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Expenses({ trip, onUpdateTrip }) {
  const allExpenses = trip.days.flatMap((day) => day.expenses.map((expense) => ({ ...expense, dayDate: day.date })));
  const byCategory = allExpenses.reduce((acc, expense) => {
    const key = expense.cat || '기타';
    acc[key] = (acc[key] || 0) + Number(expense.krwAmount || expense.amount || 0);
    return acc;
  }, {});
  const byCurrency = allExpenses.reduce((acc, expense) => {
    const key = expense.currency || trip.currency || 'KRW';
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});
  const gravo = trip.days.flatMap((day) => day.expenses.filter((expense) => expense.gravoReady).map((expense) => toGravoExpense(expense, trip, day)));

  const copyGravo = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ expenses: gravo }, null, 2));
    window.alert('Gravo Finance 호환 JSON을 클립보드에 복사했습니다.');
  };

  return (
    <div className="section">
      <div className="grid-3">
        <Stat label="총 지출" value={formatKRW(tripTotals(trip).expense)} />
        <Stat label="기록 건수" value={`${allExpenses.length}건`} />
        <Stat label="Gravo 준비" value={`${gravo.length}건`} />
      </div>

      <div className="grid-2">
        <section className="card card-pad">
          <SectionTitle icon={WalletCards} title="카테고리별" />
          <div className="expense-table">
            {Object.entries(byCategory).length ? Object.entries(byCategory).map(([cat, amount]) => (
              <div className="expense-row" key={cat}><b>{cat}</b><strong>{formatKRW(amount)}</strong></div>
            )) : <EmptyMini text="아직 소비 기록이 없습니다." />}
          </div>
        </section>
        <section className="card card-pad">
          <SectionTitle icon={Coins} title="통화별 원금액" />
          <div className="expense-table">
            {Object.entries(byCurrency).length ? Object.entries(byCurrency).map(([currency, amount]) => (
              <div className="expense-row" key={currency}><b>{currency}</b><strong>{Number(amount).toLocaleString()}</strong></div>
            )) : <EmptyMini text="해외/장기여행 통화 기록도 여기에 표시됩니다." />}
          </div>
        </section>
      </div>

      <section className="card card-pad">
        <SectionTitle icon={Copy} title="Gravo Finance 내보내기" action={<button className="btn primary" onClick={copyGravo}><Copy size={15} /> JSON 복사</button>} />
        <textarea className="textarea" readOnly value={JSON.stringify({ expenses: gravo }, null, 2)} style={{ minHeight: 260, fontFamily: T.sansFont, fontSize: 13 }} />
      </section>

      <section className="card card-pad">
        <SectionTitle icon={CalendarDays} title="날짜별 지출" />
        <div className="expense-table">
          {trip.days.map((day, dayIndex) => (
            <div className="expense-row" key={day.date}>
              <div>
                <b>{formatDate(day.date)}</b>
                <p className="item-meta">{day.expenses.map((expense) => expense.title || expense.cat).filter(Boolean).join(', ') || '기록 없음'}</p>
              </div>
              <strong>{formatKRW(dayExpenseTotal(day))}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TripLibrary({ trips, activeTripId, onSelect, onCreateBlank, onTemplate, onEdit, onDelete }) {
  return (
    <div className="section">
      <div className="button-row">
        <button className="btn primary" onClick={onCreateBlank}><Plus size={16} /> 빈 여행</button>
        <button className="btn" onClick={() => onTemplate('gangwon')}><MapPin size={16} /> 강원도 프리셋</button>
      </div>
      <div className="template-grid">
        {Object.values(TEMPLATE_PROFILES).map((template) => (
          <button key={template.id} className="template-card" onClick={() => onTemplate(template.id)}>
            <Plane size={22} color={T.accent} />
            <b>{template.label}</b>
            <span className="item-meta">{template.days}일 템플릿 · {template.currency}</span>
          </button>
        ))}
      </div>
      <div className="grid-2">
        {trips.map((trip) => {
          const totals = tripTotals(trip);
          return (
            <article key={trip.id} className="card card-pad">
              <p className="eyebrow">{trip.id === activeTripId ? 'Active' : trip.type}</p>
              <h2 style={{ margin: 0, font: `700 21px/1.24 ${T.displayFont}`, letterSpacing: '-0.03em' }}>{trip.title}</h2>
              <p className="item-meta">{formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)} · {trip.days.length}일 · {formatKRW(totals.expense)}</p>
              <div className="button-row" style={{ marginTop: 16 }}>
                <button className="btn primary" onClick={() => onSelect(trip)}>열기</button>
                <button className="btn ghost" onClick={() => onEdit(trip)}>수정</button>
                <button className="btn danger" onClick={() => onDelete(trip.id)}><Trash2 size={15} /> 삭제</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Review({ apiKey, onNeedKey }) {
  const [text, setText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const metrics = useMemo(() => analyzePost(text), [text]);

  const runAiReview = async () => {
    if (!apiKey) {
      onNeedKey();
      return;
    }
    setLoading(true);
    setAiResult('');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '너는 네이버 블로그 여행글 편집자다. 자동으로 새 글을 만들지 말고, 사용자가 쓴 글의 퇴고 포인트와 SEO 개선점만 한국어로 간결하게 제안한다.' },
            { role: 'user', content: `목표 키워드: ${keyword || '미지정'}\n\n글:\n${text}` },
          ],
          temperature: 0.4,
        }),
      });
      const data = await response.json();
      setAiResult(data?.choices?.[0]?.message?.content || 'AI 피드백을 가져오지 못했습니다.');
    } catch (error) {
      setAiResult(`AI 피드백 요청 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <section className="card card-pad">
        <SectionTitle icon={FileText} title="직접 쓴 여행기 검토" />
        <div className="grid-2">
          <div className="field">
            <label>목표 키워드</label>
            <input className="input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="예: 속초 설악산 케이블카" />
          </div>
          <div className="field">
            <label>AI 검토</label>
            <button className="btn primary" onClick={runAiReview} disabled={loading || !text.trim()}>
              <Sparkles size={16} /> {loading ? '검토 중...' : apiKey ? 'AI 퇴고 받기' : 'API 키 설정하기'}
            </button>
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>본문</label>
          <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="여행 후 직접 쓴 블로그 초안을 붙여넣으세요. 앱은 새 글을 자동 생성하지 않고, 퇴고와 SEO 검토만 도와줍니다." style={{ minHeight: 320 }} />
        </div>
      </section>

      <div className="grid-3">
        <Stat label="공백 제외 글자수" value={`${metrics.length}자`} />
        <Stat label="SEO 체크" value={`${metrics.score}/6`} />
        <Stat label="해시태그" value={`${metrics.hashtags.length}개`} />
      </div>

      <section className="card card-pad">
        <SectionTitle icon={CheckCircle2} title="자동 점검" />
        <div className="grid-2">
          <CheckResult ok={metrics.length >= 900} title="본문 길이" text={metrics.length >= 900 ? '충분한 정보량입니다.' : '네이버 여행글은 경험과 정보를 조금 더 길게 풀어주는 편이 좋습니다.'} />
          <CheckResult ok={(keyword ? text.slice(0, 260).includes(keyword) : Boolean(metrics.firstKeyword))} title="첫 문단 키워드" text={keyword ? `첫 문단에 "${keyword}" 포함 여부를 봅니다.` : `자동 후보: ${metrics.firstKeyword || '없음'}`} />
          <CheckResult ok={metrics.imageMarkers >= 3} title="이미지 표식" text={`${metrics.imageMarkers}개 감지. 사진 위치를 [사진]처럼 표시해도 좋습니다.`} />
          <CheckResult ok={metrics.hashtags.length >= 3 && metrics.hashtags.length <= 15} title="해시태그" text={`${metrics.hashtags.length}개. 3~15개 정도가 다루기 쉽습니다.`} />
          <CheckResult ok={metrics.links >= 1} title="지도/링크" text={`${metrics.links}개 감지. 장소 링크나 지도 표식이 있으면 정보성이 올라갑니다.`} />
          <CheckResult ok={metrics.infoHits.length >= 5} title="정보 밀도" text={`감지 키워드: ${metrics.infoHits.join(', ') || '없음'}`} />
        </div>
      </section>

      {aiResult && (
        <section className="card card-pad">
          <SectionTitle icon={Sparkles} title="AI 피드백" />
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{aiResult}</p>
        </section>
      )}
    </div>
  );
}

function CheckResult({ ok, title, text }) {
  return (
    <div className="list-item" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
      <div className="quick-icon" style={{ background: ok ? T.success : T.warning }}><Check size={16} /></div>
      <div>
        <p className="item-title">{title}</p>
        <p className="item-meta">{text}</p>
      </div>
    </div>
  );
}

function SettingsPanel({ apiKey, onApiKey, storage, vacation, onUpdateVacation, onReset }) {
  const usage = vacationUsage(vacation);
  return (
    <div className="section">
      <section className="card card-pad">
        <SectionTitle icon={Settings} title="설정" />
        <div className="field">
          <label>OpenAI API Key</label>
          <input className="input" type="password" value={apiKey} onChange={(event) => onApiKey(event.target.value)} placeholder="글 검토 AI 피드백에만 사용합니다." />
        </div>
        <p className="item-meta">API 키가 없어도 기본 SEO 점검은 사용할 수 있습니다. 자동 여행기 생성 기능은 제공하지 않습니다.</p>
      </section>

      <section className="card card-pad">
        <SectionTitle icon={AlertCircle} title="데이터" />
        <div className="grid-3">
          <Stat label="저장 키" value="v2" />
          <Stat label="여행 수" value={`${storage.trips.length}개`} />
          <Stat label="저장 방식" value="Local" />
        </div>
        <div className="button-row" style={{ marginTop: 18 }}>
          <button className="btn danger" onClick={onReset}><Trash2 size={15} /> v2 데이터 초기화</button>
        </div>
      </section>

      <section className="card card-pad">
        <SectionTitle icon={CalendarDays} title="휴가 기준" />
        <div className="grid-2">
          <Input label="휴가 산정 시작일" type="date" value={usage.cycleStart} onChange={(cycleStart) => onUpdateVacation((current) => ({ ...current, cycleStart }))} />
          <Input label="휴가 산정 종료일" type="date" value={usage.cycleEnd} onChange={(cycleEnd) => onUpdateVacation((current) => ({ ...current, cycleEnd }))} />
          <Input label="총 휴가일수" type="number" value={usage.total} onChange={(total) => onUpdateVacation((current) => ({ ...current, total: Number(total || 0) }))} />
          <Input label="이미 사용한 휴가" type="number" value={usage.usedBefore} onChange={(usedBefore) => onUpdateVacation((current) => ({ ...current, usedBefore: Number(usedBefore || 0) }))} />
        </div>
        <p className="item-meta">현재 계산: {usage.used}/{usage.total} 사용 또는 예정 · 남은 휴가 {usage.remaining}일</p>
      </section>

      <section className="card card-pad">
        <SectionTitle icon={Camera} title="사진 저장과 고프로 영상" />
        <div className="list">
          <div className="list-item" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
            <div className="quick-icon" style={{ background: T.accent }}><Camera size={16} /></div>
            <div>
              <p className="item-title">사진은 브라우저 로컬 저장</p>
              <p className="item-meta">현재 사진은 업로드 서버가 아니라 이 기기의 브라우저 저장소에 저장됩니다. 앱은 저장 안정성을 위해 사진을 최대 1400px JPEG로 자동 압축합니다.</p>
            </div>
          </div>
          <div className="list-item" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
            <div className="quick-icon" style={{ background: T.warning }}><FileText size={16} /></div>
            <div>
              <p className="item-title">고프로 영상은 앱 내부 저장/편집 비권장</p>
              <p className="item-meta">고프로 영상은 용량과 코덱 부담이 커서 1차 앱에서는 업로드하지 않는 편이 안전합니다. 대신 컷편집 목록, 장면 메모, 쇼츠 구성안, 자막/내레이션 초안, 편집 순서표를 Codex가 도와줄 수 있습니다.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickCaptureModal({ action, trip, day, onClose, onSave }) {
  const actionMeta = QUICK_ACTIONS.find((item) => item.id === action) || QUICK_ACTIONS[0];
  const Icon = actionMeta.icon;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="quick-icon" style={{ background: actionMeta.color }}><Icon size={18} /></span>
            <div>
              <b>{actionMeta.label} 빠른 기록</b>
              <p className="item-meta" style={{ margin: 0 }}>{formatDate(day.date)} · {trip.title}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="card-pad">
          {action === 'plan' && <PlanQuickForm day={day} onSave={onSave} />}
          {action === 'route' && <RouteQuickForm onSave={onSave} />}
          {action === 'expense' && <ExpenseQuickForm trip={trip} day={day} onSave={onSave} />}
          {action === 'photo' && <PhotoQuickForm onSave={onSave} />}
          {action === 'diary' && <DiaryQuickForm day={day} onSave={onSave} />}
          {action === 'checklist' && <ChecklistQuickForm onSave={onSave} />}
        </div>
      </div>
    </div>
  );
}

function PlanQuickForm({ day, onSave }) {
  const [form, setForm] = useState({ time: '', title: '', place: '', category: '기타', memo: '' });
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, planItems: [...current.planItems, makePlanItem(form)] }))}>
      <FormGrid>
        <Input label="시간" value={form.time} onChange={(time) => setForm({ ...form, time })} placeholder="13:00" />
        <Input label="활동명" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="설악산 케이블카" />
        <Input label="장소" value={form.place} onChange={(place) => setForm({ ...form, place })} placeholder="설악산 소공원" />
        <Select label="카테고리" value={form.category} onChange={(category) => setForm({ ...form, category })} options={ACTIVITY_CATEGORIES} />
      </FormGrid>
      <Textarea label="메모" value={form.memo} onChange={(memo) => setForm({ ...form, memo })} placeholder="예약, 대기시간, 좋았던 점 등을 짧게 기록" />
    </QuickFormShell>
  );
}

function RouteQuickForm({ onSave }) {
  const [form, setForm] = useState({ from: '', to: '', via: '', transport: '자차', plannedTime: '', actualTime: '', trafficMemo: '' });
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, routes: [...current.routes, makeRoute(form)] }))}>
      <FormGrid>
        <Input label="출발지" value={form.from} onChange={(from) => setForm({ ...form, from })} placeholder="서초역" />
        <Input label="도착지" value={form.to} onChange={(to) => setForm({ ...form, to })} placeholder="속초중앙시장" />
        <Input label="경유지" value={form.via} onChange={(via) => setForm({ ...form, via })} placeholder="가평휴게소" />
        <Select label="이동수단" value={form.transport} onChange={(transport) => setForm({ ...form, transport })} options={TRANSPORT_OPTIONS} />
        <Input label="예상 시간" value={form.plannedTime} onChange={(plannedTime) => setForm({ ...form, plannedTime })} placeholder="3시간 30분" />
        <Input label="실제 시간" value={form.actualTime} onChange={(actualTime) => setForm({ ...form, actualTime })} placeholder="4시간" />
      </FormGrid>
      <Textarea label="교통/주차 메모" value={form.trafficMemo} onChange={(trafficMemo) => setForm({ ...form, trafficMemo })} />
    </QuickFormShell>
  );
}

function ExpenseQuickForm({ trip, day, onSave }) {
  const [form, setForm] = useState({ date: day.date, time: '', place: '', cat: '식비', title: '', amount: '', currency: trip.currency || 'KRW', krwAmount: '', card: '', people: 1, memo: '' });
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, expenses: [...current.expenses, makeExpense({ ...form, amount: Number(form.amount || 0), krwAmount: Number(form.krwAmount || form.amount || 0) })] }))}>
      <FormGrid>
        <Input label="제목" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="속초 중앙시장 닭강정" />
        <Input label="장소" value={form.place} onChange={(place) => setForm({ ...form, place })} placeholder="속초중앙시장" />
        <Select label="카테고리" value={form.cat} onChange={(cat) => setForm({ ...form, cat })} options={EXPENSE_CATEGORIES} />
        <Input label="금액" type="number" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} placeholder="25000" />
        <Select label="통화" value={form.currency} onChange={(currency) => setForm({ ...form, currency })} options={CURRENCIES} />
        <Input label="KRW 환산" type="number" value={form.krwAmount} onChange={(krwAmount) => setForm({ ...form, krwAmount })} placeholder="비우면 금액과 동일" />
        <Input label="카드/결제수단" value={form.card} onChange={(card) => setForm({ ...form, card })} placeholder="현대카드, 현금" />
        <Input label="인원" type="number" value={form.people} onChange={(people) => setForm({ ...form, people })} />
      </FormGrid>
      <Textarea label="메모" value={form.memo} onChange={(memo) => setForm({ ...form, memo })} />
    </QuickFormShell>
  );
}

function PhotoQuickForm({ onSave }) {
  const [form, setForm] = useState({ title: '', memo: '', src: '' });
  const [photoStatus, setPhotoStatus] = useState('');
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoStatus('사진을 모바일 저장에 맞게 줄이는 중입니다...');
    try {
      const src = await imageFileToDataUrl(file);
      setForm((prev) => ({ ...prev, src }));
      setPhotoStatus('사진이 준비되었습니다. 저장을 누르면 오늘 기록에 추가됩니다.');
    } catch (error) {
      setPhotoStatus(error.message || '사진 처리 중 오류가 발생했습니다.');
    } finally {
      event.target.value = '';
    }
  };
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, photos: [...current.photos, { id: uid(), ...form }] }))}>
      <FormGrid>
        <Input label="사진 제목" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="휴게소 우동" />
        <div className="field">
          <label>사진 촬영/업로드</label>
          <input className="input" type="file" accept="image/*" capture="environment" onChange={handleFile} />
          <p className="item-meta">모바일에서는 카메라가 바로 열릴 수 있습니다. 사진은 저장 안정성을 위해 자동으로 압축됩니다.</p>
        </div>
      </FormGrid>
      {photoStatus && <p className="item-meta">{photoStatus}</p>}
      <Textarea label="사진 메모" value={form.memo} onChange={(memo) => setForm({ ...form, memo })} placeholder="사진이 없어도 장면 설명만 남길 수 있습니다." />
      {form.src && <img src={form.src} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 20, border: `1px solid ${T.border}` }} />}
    </QuickFormShell>
  );
}

function DiaryQuickForm({ day, onSave }) {
  const [form, setForm] = useState(day.diaryDetails);
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, summary: form.oneLine || current.summary, diaryDetails: form }))}>
      <Input label="오늘의 한 줄" value={form.oneLine} onChange={(oneLine) => setForm({ ...form, oneLine })} placeholder="설악산 케이블카와 속초 여유 관광을 즐긴 날" />
      <FormGrid>
        <Textarea label="좋았던 순간" value={form.good} onChange={(good) => setForm({ ...form, good })} />
        <Textarea label="아쉬웠던 점" value={form.bad} onChange={(bad) => setForm({ ...form, bad })} />
        <Textarea label="맛있었던 음식" value={form.food} onChange={(food) => setForm({ ...form, food })} />
        <Textarea label="기억에 남는 장소" value={form.place} onChange={(place) => setForm({ ...form, place })} />
        <Textarea label="지출 요약" value={form.spendingSummary} onChange={(spendingSummary) => setForm({ ...form, spendingSummary })} />
        <Textarea label="내일 메모" value={form.tomorrowMemo} onChange={(tomorrowMemo) => setForm({ ...form, tomorrowMemo })} />
      </FormGrid>
    </QuickFormShell>
  );
}

function ChecklistQuickForm({ onSave }) {
  const [title, setTitle] = useState('새 체크리스트');
  const [items, setItems] = useState('');
  return (
    <QuickFormShell onSubmit={() => onSave((current) => ({ ...current, checklists: [...current.checklists, makeChecklistGroup(title, items.split('\n').map((item) => item.trim()).filter(Boolean))] }))}>
      <Input label="체크리스트 이름" value={title} onChange={setTitle} placeholder="오션월드 준비물" />
      <Textarea label="항목" value={items} onChange={setItems} placeholder={'래시가드\n방수팩\n수건\n선크림'} />
    </QuickFormShell>
  );
}

function QuickFormShell({ children, onSubmit }) {
  return (
    <form className="section" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      {children}
      <div className="button-row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" type="submit"><Check size={16} /> 저장</button>
      </div>
    </form>
  );
}

function FormGrid({ children }) {
  return <div className="grid-2">{children}</div>;
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = '' }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className="textarea" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function TripFormModal({ mode, trip, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...normalizeTrip(trip || createBlankTrip()),
    companionsText: safeArr(trip?.companions).join(', '),
    regionsText: safeArr(trip?.regions).join(', '),
    countriesText: safeArr(trip?.countries).join(', '),
    citiesText: safeArr(trip?.cities).join(', '),
    lodgingsText: safeArr(trip?.lodgings).join('\n'),
    documentsText: safeArr(trip?.documents).join('\n'),
  }));

  const save = () => {
    onSave(normalizeTrip({
      ...form,
      companions: listFromText(form.companionsText),
      regions: listFromText(form.regionsText),
      countries: listFromText(form.countriesText),
      cities: listFromText(form.citiesText),
      lodgings: form.lodgingsText.split('\n').map((item) => item.trim()).filter(Boolean),
      documents: form.documentsText.split('\n').map((item) => item.trim()).filter(Boolean),
    }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <b>{mode === 'edit' ? '여행 수정' : '새 여행'}</b>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="card-pad section" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <Input label="여행명" value={form.title} onChange={(title) => setForm({ ...form, title })} />
          <FormGrid>
            <Select label="여행 유형" value={form.type} onChange={(type) => setForm({ ...form, type })} options={TRIP_TYPES} />
            <Select label="기본 통화" value={form.currency} onChange={(currency) => setForm({ ...form, currency })} options={CURRENCIES} />
            <Input label="시작일" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
            <Input label="종료일" type="date" value={form.endDate} onChange={(endDate) => setForm({ ...form, endDate })} />
            <Input label="동행자" value={form.companionsText} onChange={(companionsText) => setForm({ ...form, companionsText })} placeholder="와이프, 부모님" />
            <Input label="지역" value={form.regionsText} onChange={(regionsText) => setForm({ ...form, regionsText })} placeholder="속초, 홍천, 양평" />
            <Input label="국가" value={form.countriesText} onChange={(countriesText) => setForm({ ...form, countriesText })} placeholder="일본, 태국" />
            <Input label="도시" value={form.citiesText} onChange={(citiesText) => setForm({ ...form, citiesText })} placeholder="도쿄, 방콕" />
            <Input label="예산" value={form.budget} onChange={(budget) => setForm({ ...form, budget })} placeholder="1500000" />
            <Input label="시간대" value={form.timeZone} onChange={(timeZone) => setForm({ ...form, timeZone })} placeholder="Asia/Tokyo" />
          </FormGrid>
          <Textarea label="숙소" value={form.lodgingsText} onChange={(lodgingsText) => setForm({ ...form, lodgingsText })} />
          <Textarea label="문서/준비물" value={form.documentsText} onChange={(documentsText) => setForm({ ...form, documentsText })} />
          <Textarea label="환율/여행 메모" value={form.exchangeRateMemo} onChange={(exchangeRateMemo) => setForm({ ...form, exchangeRateMemo })} />
          <div className="button-row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary" type="submit">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}
