# Settings Feedback Subpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설정 탭에서 건의사항 풀 UI를 제거하고 `/settings/feedback` 독립 서브페이지로 분리한다.

**Architecture:** `/settings/feedback`을 AppLayout 밖 독립 라우트로 등록해 탭바 없는 몰입형 화면으로 구성한다. `FeedbackForm`/`FeedbackList` 컴포넌트는 수정 없이 재사용하고, `Settings.tsx`의 건의사항 섹션은 `SettingsRow` + `ChevronRight`로 교체해 navigate만 담당한다.

**Tech Stack:** React 19, React Router DOM v7, TypeScript, Tailwind CSS 4, lucide-react

---

## 파일 구조

| 파일 | 변경 | 역할 |
|------|------|------|
| `client/src/App.tsx` | 수정 | `/settings/feedback` 독립 라우트 추가 |
| `client/src/pages/Settings.tsx` | 수정 | 건의사항 섹션 → SettingsRow + ChevronRight, FeedbackForm/List 제거 |
| `client/src/pages/SettingsFeedback.tsx` | 신규 | 건의사항 서브페이지 (뒤로가기 헤더 + 오프라인 배너 + FeedbackForm + FeedbackList) |

---

## Task 1: SettingsFeedback 페이지 신규 생성

**Files:**
- Create: `client/src/pages/SettingsFeedback.tsx`

### 배경 지식

- `useOnline()` hook: `client/src/hooks/useOnline.ts` — 네트워크 연결 상태 boolean 반환
- `FeedbackForm`: `client/src/components/FeedbackForm.tsx` — `disabled?: boolean` prop
- `FeedbackList`: `client/src/components/FeedbackList.tsx` — `disabled?: boolean` prop
- `useNavigate`: React Router DOM — `-1`로 뒤로가기
- 헤더 패턴: `QuestionDetail.tsx` 상단의 `ArrowLeft` + sticky 헤더 참고
- 아이콘: `lucide-react`의 `ChevronLeft` 사용 (`ArrowLeft`가 아님 — 설정 서브페이지는 ChevronLeft가 표준)
- 인라인 `style` 속성 절대 금지 — Tailwind 클래스만 사용

- [ ] **Step 1: SettingsFeedback.tsx 파일 생성**

`client/src/pages/SettingsFeedback.tsx`에 아래 코드를 작성한다:

```tsx
import { useNavigate } from "react-router-dom";
import { ChevronLeft, WifiOff } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import FeedbackForm from "../components/FeedbackForm";
import FeedbackList from "../components/FeedbackList";

export default function SettingsFeedback() {
  const navigate = useNavigate();
  const isOnline = useOnline();

  return (
    <div className="min-h-screen bg-surface">
      {/* sticky 헤더 — ChevronLeft 뒤로가기 + 제목 */}
      <header className="sticky top-0 z-40 flex items-center gap-2 px-4 h-14 bg-surface-card border-b border-border">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-brand transition-colors"
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">건의사항</h1>
      </header>

      {/* 본문 */}
      <div className="mx-auto max-w-180 px-4 py-6 space-y-3">
        {/* 오프라인 배너 */}
        {!isOnline && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-sem-warning-light border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <WifiOff size={14} className="text-sem-warning-text shrink-0" />
            오프라인 상태예요. 연결되면 다시 시도할 수 있어요.
          </div>
        )}

        {/* 건의사항 입력 카드 */}
        <FeedbackForm disabled={!isOnline} />

        {/* 건의사항 목록 */}
        <FeedbackList disabled={!isOnline} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 파일이 올바르게 생성됐는지 확인**

```bash
ls client/src/pages/SettingsFeedback.tsx
```

Expected: 파일 경로 출력

---

## Task 2: App.tsx에 독립 라우트 추가

**Files:**
- Modify: `client/src/App.tsx`

### 배경 지식

- 현재 `App.tsx`의 라우트 구조: AppLayout 안(`/`, `/questions`, `/stats`, `/settings`)과 AppLayout 밖(`/questions/:questionUuid`, `/daily-challenge` 등) 두 그룹으로 나뉜다.
- `/settings/feedback`은 AppLayout 밖 독립 라우트로 추가 — 탭바 없음.
- `SettingsFeedback` import 추가 필요.

- [ ] **Step 1: SettingsFeedback import 추가**

`client/src/App.tsx` 상단 import 목록에 추가한다:

```tsx
import SettingsFeedback from "./pages/SettingsFeedback";
```

- [ ] **Step 2: 독립 라우트 추가**

`App.tsx`의 router 배열에서 AppLayout 밖 라우트 그룹 끝에 추가한다.
`// 홈 추천 문제` 주석 블록 바로 뒤에 삽입:

```tsx
{
  path: "settings/feedback",
  element: <SettingsFeedback />,
},
```

추가 후 라우터 배열 전체 구조 (확인용):

```tsx
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <CategoryCards /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "questions/:questionUuid", element: <QuestionDetail /> },
  { path: "daily-challenge", element: <DailyChallenge /> },
  { path: "questions/:questionUuid/result", element: <AnswerFeedback /> },
  { path: "practice/:sessionId", element: <PracticeSet /> },
  { path: "practice/:sessionId/result", element: <PracticeResult /> },
  { path: "recommendation/:questionUuid", element: <RecommendationPractice /> },
  { path: "settings/feedback", element: <SettingsFeedback /> },  // 추가
]);
```

---

## Task 3: Settings.tsx 건의사항 섹션 교체

**Files:**
- Modify: `client/src/pages/Settings.tsx`

### 배경 지식

- `SettingsRow`: `client/src/components/SettingsRow.tsx`
  - props: `label: string`, `value: ReactNode`, `action?: ReactNode`, `isLast?: boolean`
- `useNavigate`: React Router DOM — `navigate('/settings/feedback')`
- `ChevronRight`: `lucide-react`
- 제거 대상 import: `useOnline`, `useMyFeedback`, `FeedbackForm`, `FeedbackList`, `WifiOff`
- 제거 대상 state/변수: `isOnline`, `feedbackData`, `feedbackCount`, stagger `s2`, `s3`
- stagger 인덱스 재조정 필요: 건의사항 섹션 제거 후 `s2` 이후 인덱스가 당겨짐

현재 stagger 구조:
```
s0 = stagger(0)  // h1 "설정"
s1 = stagger(1)  // 계정 섹션
s2 = stagger(2)  // 건의사항 입력 카드  ← 제거
s3 = stagger(3)  // 건의사항 목록 카드  ← 제거
s4 = stagger(4)  // 앱 정보 섹션
s5 = stagger(5)  // 개발자 도구 섹션
s6 = stagger(6)  // 로고 + 카피라이트
```

변경 후 stagger 구조:
```
s0 = stagger(0)  // h1 "설정"
s1 = stagger(1)  // 계정 섹션
s2 = stagger(2)  // 건의사항 row 섹션  ← 단순 row 1개
s3 = stagger(3)  // 앱 정보 섹션
s4 = stagger(4)  // 개발자 도구 섹션
s5 = stagger(5)  // 로고 + 카피라이트
```

- [ ] **Step 1: 불필요한 import 제거 및 useNavigate 추가**

`Settings.tsx` import 블록을 아래와 같이 교체한다:

```tsx
import { useState, useRef, useEffect } from "react";
import { Copy, Check, RefreshCw, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemberStore } from "../stores/memberStore";
import logo from "../assets/logo/logo.png";
import { useRegenerateNickname } from "../hooks/useMember";
import { useStagger } from "../hooks/useStagger";
import SettingsSection from "../components/SettingsSection";
import SettingsRow from "../components/SettingsRow";
```

- [ ] **Step 2: 불필요한 state/변수 제거 및 stagger 재조정**

`Settings` 컴포넌트 내부 상단 변수 선언부를 아래와 같이 교체한다:

```tsx
const uuid = useMemberStore((s) => s.uuid);
const nickname = useMemberStore((s) => s.nickname);
const truncatedUuid = `${uuid.slice(0, 20)}...`;
const regenerateMutation = useRegenerateNickname();
const navigate = useNavigate();
const [copied, setCopied] = useState(false);
const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// localStorage 초기화 2단계 확인 상태 (실수 방지)
const [confirmClear, setConfirmClear] = useState(false);
const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 섹션별 순차 페이드인 (50ms 간격)
const stagger = useStagger();
const s0 = stagger(0); // h1 "설정"
const s1 = stagger(1); // 계정 섹션
const s2 = stagger(2); // 건의사항 섹션
const s3 = stagger(3); // 앱 정보 섹션
const s4 = stagger(4); // 개발자 도구 섹션
const s5 = stagger(5); // 로고 + 카피라이트
```

- [ ] **Step 3: JSX — 건의사항 섹션 교체 및 이후 섹션 stagger 인덱스 수정**

JSX에서 기존 `③ 건의사항 섹션 헤더 + 입력 카드` 블록과 `④ 건의사항 목록 카드` 블록 전체를 아래 단일 섹션으로 교체한다:

```tsx
{/* ③ 건의사항 섹션 */}
<section className={`mt-6 ${s2.className}`}>
  <SettingsSection label="건의사항">
    <div className="bg-surface-card border border-border rounded-2xl">
      <SettingsRow
        label="건의사항"
        value={
          <p className="text-sm text-text-secondary">의견 보내기 및 내역 확인</p>
        }
        action={
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-text-caption hover:text-brand transition-colors"
            onClick={() => navigate("/settings/feedback")}
            aria-label="건의사항 페이지로 이동"
          >
            <ChevronRight size={18} />
          </button>
        }
        isLast
      />
    </div>
  </SettingsSection>
</section>
```

그리고 이후 섹션들의 stagger 변수를 수정한다:

- `⑤ 앱 정보 섹션`: `s4.className` → `s3.className`
- `⑥ 개발자 도구 섹션`: `s5.className` → `s4.className`
- `⑦ 로고 + 카피라이트`: `s6.className` → `s5.className`

- [ ] **Step 4: TypeScript 컴파일 확인**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음 (오류 메시지 없이 종료)

---

## Self-Review

**Spec coverage 체크:**

| 요구사항 | 구현 태스크 |
|---------|------------|
| `/settings/feedback` 독립 라우트 | Task 2 |
| 탭바 없는 몰입형 화면 | Task 1 (AppLayout 밖) |
| 뒤로가기 헤더 (ChevronLeft) | Task 1 |
| 오프라인 배너 서브페이지로 이동 | Task 1 |
| FeedbackForm + FeedbackList 재사용 | Task 1 |
| Settings.tsx 건의사항 → ChevronRight row | Task 3 |
| FeedbackForm/List import 제거 | Task 3 Step 1 |
| feedbackCount pill 제거 | Task 3 Step 2 (feedbackData/feedbackCount 제거됨) |
| stagger 인덱스 재조정 | Task 3 Step 2-3 |

**Placeholder scan:** 없음 — 모든 step에 실제 코드 포함.

**Type consistency:** `navigate`, `useOnline`, `FeedbackForm`, `FeedbackList` — 모든 참조가 동일한 이름으로 일관됨.
