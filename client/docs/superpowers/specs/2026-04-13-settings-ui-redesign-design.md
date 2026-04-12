# 설정 화면 UI 개선 — Design Spec

**Date:** 2026-04-13
**Issue:** #198 — `docs/issues/settings-ui-redesign.md`
**Branch:** `20260412_#198_설정_화면_UI_개선_콘텐츠_보강_및_시각적_완성도_향상`

---

## 1. 목표

현재 설정 화면은 단일 카드(닉네임/디바이스 ID/버전) + 로고만 있어 빈약함. 다음을 달성한다.

- 섹션 헤더로 정보 위계 명확화 (계정 / 건의사항 / 앱 정보)
- 건의사항 제출/조회 기능 추가 (백엔드 API 미구현 → 인터페이스만 정의 후 graceful fallback)
- 홈/문제/통계 화면과 시각 일관성 유지 (동일 카드/스페이싱/애니메이션 패턴)
- 모든 예외 상태(네트워크/서버/제출 실패/오프라인) 명시적 처리

비목표: 시험 일정 선택, 팀 소개 카드 통합, 다크모드.

---

## 2. 정보 구조 (B 레이아웃 확정)

```
[설정]                              ← h1, stagger(0)

계정                                ← 섹션 헤더, stagger(1)
┌─ 카드 ───────────────────┐
│ 닉네임      [용감한 판다]  ↻ │
│ ─────────────────────────  │
│ 디바이스 ID  [a1b2..]      ⧉ │
└─────────────────────────┘

건의사항                  [count]    ← 섹션 헤더, stagger(2)
┌─ 입력 카드 ─────────────┐
│ ✎ 의견 보내기            │
│ [textarea]               │
│ ─────────────────────    │
│ 0/500          [보내기 →] │
└─────────────────────────┘
┌─ 목록 카드 ─────────────┐         ← stagger(3)
│ [대기·] 다크모드…   2일 전 │
│ ─────────────────────    │
│ [반영됨] 스트릭…    1주 전 │
└─────────────────────────┘

앱 정보                              ← 섹션 헤더, stagger(4)
┌─────────────────────────┐
│ 버전           v1.0.0    │
└─────────────────────────┘

[로고 + © 2026 passQL]               ← stagger(5)
```

### 섹션 헤더 구성

- 좌측: `text-secondary text-sm` 라벨
- 우측: 항목 개수가 의미 있는 섹션은 인디고 카운트 pill (홈 화면 패턴 동일)
- 마진: `mt-6 mb-2` (첫 섹션은 `mt-0`)

---

## 3. 컴포넌트 분리

| 파일 | 역할 |
|------|------|
| `src/pages/Settings.tsx` | 페이지 컨테이너. 섹션 조합 + stagger 인덱스 관리 |
| `src/components/SettingsSection.tsx` | 섹션 헤더 + children 래퍼 (label, count props) |
| `src/components/SettingsRow.tsx` | row 단위 — label/value/action(아이콘 버튼) |
| `src/components/FeedbackForm.tsx` | textarea + 카운터 + 보내기 버튼 + 인라인 에러 |
| `src/components/FeedbackList.tsx` | 내 건의사항 목록 + 빈 상태 + 에러 분기 |
| `src/components/FeedbackItem.tsx` | 단일 row — pill + content + time |
| `src/api/feedback.ts` | `submitFeedback`, `fetchMyFeedback` (미구현 인터페이스) |
| `src/hooks/useFeedback.ts` | react-query mutation/query 래퍼 |

기존 `Settings.tsx`는 계정 카드만 남기고 나머지를 분리. row 패턴이 재사용되므로 `SettingsRow`를 먼저 추출.

---

## 4. API 인터페이스 (백엔드 미구현, 프론트만 선행)

```ts
// src/types/api.ts 추가
export type FeedbackStatus = "PENDING" | "REVIEWED" | "APPLIED";

export interface FeedbackItem {
  readonly feedbackUuid: string;
  readonly content: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string; // ISO 8601
}

export interface FeedbackListResponse {
  readonly items: readonly FeedbackItem[];
}

export interface FeedbackSubmitRequest {
  readonly content: string;
}

export interface FeedbackSubmitResponse {
  readonly feedbackUuid: string;
  readonly status: FeedbackStatus;
  readonly createdAt: string;
}
```

```ts
// src/api/feedback.ts
// POST /feedback — body: { content }, headers: X-Member-UUID
export async function submitFeedback(content: string): Promise<FeedbackSubmitResponse>;

// GET /feedback/me — headers: X-Member-UUID
export async function fetchMyFeedback(): Promise<FeedbackListResponse>;
```

### Status 매핑

| Status | 표시 | Pill 스타일 (기존 토큰) |
|--------|------|--------------------------|
| `PENDING` | 대기 | `bg-sem-warning-light text-sem-warning-text` + 도트 `#D97706` |
| `REVIEWED` | 확인됨 | `bg-brand-light text-brand` + 도트 `#4F46E5` |
| `APPLIED` | 반영됨 | `bg-sem-success-light text-sem-success-text` + 도트 `#16A34A` |

---

## 5. 건의사항 컴포넌트 사양 (A-refined 채택)

### FeedbackForm

- **Header row** — `✎` 아이콘(`bg-brand-light text-brand` 28x28) + "의견 보내기" + 우측 `백엔드 팀이 직접 확인해요`
- **Textarea** — `min-h-16`, 보더 없음, transparent bg, focus outline 없음
- **Footer** — `border-t border-[#F3F4F6] pt-2.5 mt-2.5` 안에 카운터(좌) + 보내기 버튼(우)
- **Counter** — `0 / 500`, 입력 시 숫자만 `text-brand`. `font-feature-settings: 'tnum'`
- **버튼** — 빈 입력 disabled(`bg-border text-text-caption`), 입력 시 active(`bg-brand text-white`)
- **카드 자체** — `border border-border rounded-2xl bg-surface-card`, `focus-within` 시 `border-brand`
- **글자수 제한** — 1~500자. 0 또는 500 초과 시 disabled

### FeedbackList

- 목록 카드: `bg-surface-card border border-border rounded-2xl overflow-hidden`
- 각 row: `px-4 py-3.5 border-b border-[#F3F4F6]`, 마지막 row는 보더 없음
- Row hover: `bg-surface` (#FAFAFA)
- Row 구조: 상단 `[pill + 시간]` flex justify-between, 하단 본문 텍스트
- **빈 상태**: 카드 숨기지 않고 안에 ✎ 아이콘 + "아직 보낸 건의가 없어요" / "첫 의견을 들려주세요"

### FeedbackItem 애니메이션

- 각 item에 `useStagger` 사용해 0~N 인덱스로 순차 페이드인 (50ms 간격)

---

## 6. 예외 상태 처리

| 상황 | 감지 | 처리 |
|------|------|------|
| 목록 조회 실패 | `useQuery isError` | 목록 카드 → `<ErrorFallback errorType="server\|network" onRetry={refetch} />` |
| 제출 실패 | `useMutation isError` | 입력 카드 footer 아래에 인라인 에러 (A: soft fill). 입력 보존 |
| 오프라인 | `navigator.onLine === false` | 섹션 상단 노란 배너 + 입력 카드 disabled + 목록 ErrorFallback |
| API 미구현 (404) | `ApiError.status === 404` | 빈 배열로 fallback → 빈 상태 카드 표시 (섹션 자체는 유지) |

### 인라인 제출 에러 (A: Soft fill)

```tsx
<div className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 bg-sem-error-light rounded-lg text-xs text-sem-error-text">
  <AlertTriangle size={14} className="shrink-0" />
  <span className="flex-1">전송에 실패했어요</span>
  <button className="bg-white border border-[#FCA5A5] text-sem-error-text px-2.5 py-1 rounded-md text-[11px] font-bold">
    재시도
  </button>
</div>
```

- **보더 없음** (왼쪽 4px 보더 제거)
- 배경: `#FEF2F2` (sem-error-light)
- 텍스트: `#991B1B`
- 재시도 버튼: 흰 배경 + 옅은 빨강 보더

### 오프라인 배너

```tsx
<div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E] mb-2.5">
  <WifiOff size={14} className="text-sem-warning-text shrink-0" />
  오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
</div>
```

- `useEffect`에서 `online`/`offline` 이벤트 리스너 등록 → state 토글
- 오프라인 시 form disabled, list ErrorFallback (재시도 버튼 없음)

---

## 7. 애니메이션 (useStagger 재사용)

기존 `useStagger()` 훅을 그대로 사용. 50ms 간격 페이드인.

| 인덱스 | 대상 |
|--------|------|
| 0 | h1 "설정" |
| 1 | 계정 섹션 (헤더 + 카드) |
| 2 | 건의사항 입력 카드 |
| 3 | 건의사항 목록 카드 |
| 4 | 앱 정보 섹션 |
| 5 | 로고 + 카피라이트 |

목록 아이템 내부는 별도 stagger 인스턴스로 0~N 순차.

---

## 8. 디자인 토큰 — 전부 기존

신규 토큰 추가 없음. 다음 기존 토큰 재사용:

- **카드** — `bg-surface-card border border-border rounded-2xl`
- **섹션 헤더** — `text-text-secondary text-sm font-medium`
- **카운트 pill** — `bg-brand-light text-brand`
- **상태 pill** — `bg-sem-{warning|success|brand}-light text-sem-{...}-text`
- **에러 배경** — `bg-sem-error-light`, `text-sem-error-text`
- **경고 배경** — `bg-sem-warning-light`, `text-sem-warning-text`
- **아이콘** — 모두 `lucide-react` (Edit3, Send, Copy, Check, RefreshCw, AlertTriangle, WifiOff, ServerCrash)

---

## 9. 작업 순서

1. **타입 정의** — `src/types/api.ts`에 `FeedbackItem`, `FeedbackStatus`, request/response 타입 추가
2. **API 클라이언트** — `src/api/feedback.ts` 작성 (`apiFetch<T>` 래퍼 + `X-Member-UUID` 헤더)
3. **react-query 훅** — `src/hooks/useFeedback.ts` (mutation/query)
4. **컴포넌트 추출** — `SettingsSection`, `SettingsRow`
5. **건의사항 컴포넌트** — `FeedbackForm`, `FeedbackList`, `FeedbackItem`
6. **Settings.tsx 재구성** — 새 섹션 구조 + stagger 재할당
7. **오프라인 감지 훅** — `src/hooks/useOnline.ts` (재사용 가능하게)
8. **수동 검증** — `npm run dev`로 모든 상태 확인 (정상/빈 상태/네트워크 에러/제출 실패/오프라인)

---

## 10. 검증 체크리스트

- [ ] `npm run build` 통과 (tsc + vite)
- [ ] 모바일 375px / 데스크톱 1280px에서 레이아웃 깨짐 없음
- [ ] 첫 진입 시 stagger 애니메이션 0~5 순차 페이드인
- [ ] 입력 카드 focus 시 보더 인디고 전환
- [ ] 카운터 0일 때 버튼 disabled, 1자 이상일 때 active
- [ ] 500자 초과 시 입력 막힘
- [ ] API 미구현(404) 시 빈 상태 카드 표시 — 섹션 사라지지 않음
- [ ] 네트워크 끊김 시 오프라인 배너 표시 + 재연결 시 자동 복구
- [ ] 제출 실패 시 입력 내용 보존 + 인라인 에러 + 재시도 동작
- [ ] 모든 텍스트 한국어, 모든 아이콘 lucide-react (이모지 0)
- [ ] 인라인 style 속성 0
