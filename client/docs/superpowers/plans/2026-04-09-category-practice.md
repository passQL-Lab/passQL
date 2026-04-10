# 카테고리 기반 AI 문제 생성 & 세트 풀이 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 문제 필터 목록을 카테고리 카드 선택 → AI 문제 생성 → 10문제 순차 풀이 → 3스텝 결과 요약 플로우로 교체

**Architecture:** `/questions` 페이지를 CategoryCards로 교체. 세트 풀이는 `/practice/:sessionId/:index` 전용 라우트에서 Zustand store로 상태 관리. 결과 요약은 3스텝 스와이프 UI. 기존 QuestionDetail은 수정하지 않고 세트 래퍼가 감싸는 구조.

**Tech Stack:** React 19, TypeScript, Zustand, React Router DOM, Tailwind CSS 4 + daisyUI 5, lucide-react

---

## File Structure

### 신규 파일
| 파일 | 책임 |
|------|------|
| `src/pages/CategoryCards.tsx` | 카테고리 카드 그리드 + 로딩 오버레이 |
| `src/pages/PracticeSet.tsx` | 세트 풀이 래퍼 (진행률 바 + QuestionDetail 재활용) |
| `src/pages/PracticeResult.tsx` | 3스텝 결과 요약 (점수/AI분석/문제별결과) |
| `src/stores/practiceStore.ts` | 세트 풀이 상태 (Zustand) |
| `src/api/practice.ts` | 문제 생성 & 결과 제출 API 함수 |
| `src/components/LoadingOverlay.tsx` | 로딩 오버레이 + 마이크로카피 |
| `src/components/ScoreCountUp.tsx` | 점수 카운트업 애니메이션 컴포넌트 |
| `src/components/StepNavigator.tsx` | 3스텝 네비게이션 (스와이프+버튼+dot indicator) |
| `src/constants/topicIcons.ts` | topic.code → lucide 아이콘 매핑 |
| `src/constants/microcopy.ts` | 로딩 마이크로카피 문구 배열 |

### 수정 파일
| 파일 | 변경 |
|------|------|
| `src/App.tsx` | 라우트 추가 (`/practice/:sessionId/:index`, `/practice/:sessionId/result`) + Questions import를 CategoryCards로 교체 |
| `src/types/api.ts` | `PracticeSession`, `PracticeResult`, `PracticeAnalysis` 타입 추가 |
| `src/api/mock-data.ts` | 문제 생성 & 결과 제출 mock 응답 추가 |

---

### Task 1: 타입 정의

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: Practice 관련 타입 추가**

`src/types/api.ts` 파일 하단에 추가:

```typescript
// === Practice ===
export interface PracticeQuestionResult {
  readonly questionUuid: string;
  readonly isCorrect: boolean;
  readonly selectedChoiceKey: string;
  readonly durationMs: number;
}

export interface PracticeSubmitPayload {
  readonly topicCode: string;
  readonly results: readonly PracticeQuestionResult[];
}

export interface PracticeAnalysis {
  readonly correctCount: number;
  readonly totalCount: number;
  readonly totalDurationMs: number;
  readonly greeting: string;
  readonly analysis: string;
  readonly tip: string;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/types/api.ts
git commit -m "feat: Practice 세트 풀이 타입 정의 추가"
```

---

### Task 2: 상수 파일 (아이콘 매핑 + 마이크로카피)

**Files:**
- Create: `src/constants/topicIcons.ts`
- Create: `src/constants/microcopy.ts`

- [ ] **Step 1: 아이콘 매핑 작성**

`src/constants/topicIcons.ts`:

```typescript
import { Combine, BarChart3, Layers, Table, ShieldCheck, FileQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  JOIN: Combine,
  GROUP_BY: BarChart3,
  SUBQUERY: Layers,
  DDL: Table,
  CONSTRAINT: ShieldCheck,
};

export const DEFAULT_TOPIC_ICON: LucideIcon = FileQuestion;

export function getTopicIcon(code: string): LucideIcon {
  return TOPIC_ICON_MAP[code] ?? DEFAULT_TOPIC_ICON;
}
```

- [ ] **Step 2: 마이크로카피 작성**

`src/constants/microcopy.ts`:

```typescript
const LOADING_MESSAGES: readonly string[] = [
  "AI가 머리를 굴리는 중...",
  "SQL 요정이 문제를 짓는 중...",
  "데이터베이스 세계에서 퀴즈를 가져오는 중...",
  "SELECT 난이도 FROM 적당한곳...",
  "뇌세포를 자극할 문제를 고르는 중...",
  "{topic} 마스터로 가는 길을 닦는 중...",
];

export function getRandomMessage(topicName: string): string {
  const idx = Math.floor(Math.random() * LOADING_MESSAGES.length);
  return LOADING_MESSAGES[idx].replace("{topic}", topicName);
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/constants/topicIcons.ts src/constants/microcopy.ts
git commit -m "feat: 카테고리 아이콘 매핑 및 로딩 마이크로카피 상수 추가"
```

---

### Task 3: Mock 데이터 확장

**Files:**
- Modify: `src/api/mock-data.ts`

- [ ] **Step 1: 문제 생성 & 결과 제출 mock 추가**

`src/api/mock-data.ts`에서 import에 `PracticeAnalysis` 추가하고, `getMockResponse` 함수 내 `return null;` 바로 위에 추가:

```typescript
  // POST /practice/generate
  if (method === "POST" && path === "/practice/generate") {
    const parsed = body ? JSON.parse(body) : {};
    const topicCode = parsed.topicCode as string;
    const topicDisplayName = MOCK_TOPICS.find((t) => t.code === topicCode)?.displayName;
    const filtered = topicDisplayName
      ? MOCK_QUESTIONS.filter((q) => q.topicName === topicDisplayName)
      : MOCK_QUESTIONS;
    // 10개 채우기: 부족하면 전체에서 반복 사용
    const questions: QuestionSummary[] = [];
    for (let i = 0; i < 10; i++) {
      const src = filtered.length > 0 ? filtered[i % filtered.length] : MOCK_QUESTIONS[i % MOCK_QUESTIONS.length];
      questions.push({ ...src, questionUuid: `practice-${topicCode}-${i + 1}` });
    }
    return { sessionId: `session-${Date.now()}`, questions };
  }

  // POST /practice/submit
  if (method === "POST" && path === "/practice/submit") {
    const parsed = body ? JSON.parse(body) : {};
    const results = (parsed.results ?? []) as readonly { isCorrect: boolean; durationMs: number }[];
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
    return {
      correctCount,
      totalCount: results.length,
      totalDurationMs,
      greeting: correctCount >= 9 ? "완벽해요!" : correctCount >= 7 ? "꽤 잘했어요!" : correctCount >= 5 ? "괜찮아요!" : "다시 도전해봐요!",
      analysis: "INNER JOIN과 테이블 별칭은 이미 익숙하게 쓰고 있어요. 다만 OUTER JOIN에서 NULL 처리가 아직 어색한 것 같아요.",
      tip: "LEFT JOIN + WHERE col IS NULL 패턴을 연습해보세요.",
    } satisfies PracticeAnalysis;
  }
```

import에 `PracticeAnalysis` 추가:

```typescript
import type {
  // ...기존 imports...
  PracticeAnalysis,
} from "../types/api";
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/api/mock-data.ts
git commit -m "feat: Practice 문제 생성/결과 제출 mock 데이터 추가"
```

---

### Task 4: Practice API 함수

**Files:**
- Create: `src/api/practice.ts`

- [ ] **Step 1: API 함수 작성**

```typescript
import { apiFetch } from "./client";
import type { QuestionSummary, PracticeSubmitPayload, PracticeAnalysis } from "../types/api";

interface GenerateResponse {
  readonly sessionId: string;
  readonly questions: readonly QuestionSummary[];
}

export async function generatePractice(topicCode: string): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/practice/generate", {
    method: "POST",
    body: JSON.stringify({ topicCode }),
  });
}

export async function submitPractice(payload: PracticeSubmitPayload): Promise<PracticeAnalysis> {
  return apiFetch<PracticeAnalysis>("/practice/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/api/practice.ts
git commit -m "feat: Practice 문제 생성/결과 제출 API 함수 추가"
```

---

### Task 5: Zustand Practice Store

**Files:**
- Create: `src/stores/practiceStore.ts`

- [ ] **Step 1: 스토어 작성**

```typescript
import { create } from "zustand";
import type { QuestionSummary, PracticeQuestionResult } from "../types/api";

interface PracticeState {
  readonly sessionId: string | null;
  readonly topicCode: string | null;
  readonly topicName: string | null;
  readonly questions: readonly QuestionSummary[];
  readonly currentIndex: number;
  readonly results: readonly PracticeQuestionResult[];
  readonly startedAt: number | null;
}

interface PracticeActions {
  readonly startSession: (sessionId: string, topicCode: string, topicName: string, questions: readonly QuestionSummary[]) => void;
  readonly startTimer: () => void;
  readonly recordResult: (questionUuid: string, isCorrect: boolean, selectedChoiceKey: string) => void;
  readonly nextQuestion: () => void;
  readonly reset: () => void;
}

const INITIAL_STATE: PracticeState = {
  sessionId: null,
  topicCode: null,
  topicName: null,
  questions: [],
  currentIndex: 0,
  results: [],
  startedAt: null,
};

export const usePracticeStore = create<PracticeState & PracticeActions>()((set, get) => ({
  ...INITIAL_STATE,

  startSession: (sessionId, topicCode, topicName, questions) =>
    set({ ...INITIAL_STATE, sessionId, topicCode, topicName, questions }),

  startTimer: () => set({ startedAt: Date.now() }),

  recordResult: (questionUuid, isCorrect, selectedChoiceKey) => {
    const { startedAt, results } = get();
    const completedAt = Date.now();
    const durationMs = startedAt ? completedAt - startedAt : 0;
    const newResult: PracticeQuestionResult = { questionUuid, isCorrect, selectedChoiceKey, durationMs };
    set({ results: [...results, newResult], startedAt: null });
  },

  nextQuestion: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),

  reset: () => set(INITIAL_STATE),
}));
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/stores/practiceStore.ts
git commit -m "feat: Practice 세트 풀이 Zustand 스토어 추가"
```

---

### Task 6: LoadingOverlay 컴포넌트

**Files:**
- Create: `src/components/LoadingOverlay.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
import { useState, useEffect } from "react";
import { getRandomMessage } from "../constants/microcopy";

interface LoadingOverlayProps {
  readonly topicName: string;
}

export default function LoadingOverlay({ topicName }: LoadingOverlayProps) {
  const [message, setMessage] = useState(() => getRandomMessage(topicName));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(getRandomMessage(topicName));
    }, 3000);
    return () => clearInterval(interval);
  }, [topicName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-card rounded-2xl p-10 text-center max-w-[360px] w-[90%]">
        <div className="w-12 h-12 border-3 border-accent-light border-t-brand rounded-full animate-spin mx-auto mb-5" />
        <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-4">
          {topicName}
        </span>
        <p className="text-body">{message}</p>
        <p className="text-xs text-text-caption mt-2">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/LoadingOverlay.tsx
git commit -m "feat: 문제 생성 로딩 오버레이 컴포넌트 추가"
```

---

### Task 7: CategoryCards 페이지 (기존 Questions 교체)

**Files:**
- Create: `src/pages/CategoryCards.tsx`

- [ ] **Step 1: 카테고리 카드 그리드 작성**

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopics } from "../hooks/useTopics";
import { getTopicIcon } from "../constants/topicIcons";
import { generatePractice } from "../api/practice";
import { usePracticeStore } from "../stores/practiceStore";
import LoadingOverlay from "../components/LoadingOverlay";
import ErrorFallback from "../components/ErrorFallback";

export default function CategoryCards() {
  const { data: topics, isLoading, isError, refetch } = useTopics();
  const [generating, setGenerating] = useState<string | null>(null);
  const navigate = useNavigate();
  const startSession = usePracticeStore((s) => s.startSession);

  const handleSelect = async (code: string, displayName: string) => {
    setGenerating(displayName);
    try {
      const { sessionId, questions } = await generatePractice(code);
      startSession(sessionId, code, displayName, questions);
      navigate(`/practice/${sessionId}/0`);
    } catch {
      setGenerating(null);
    }
  };

  if (isError) return <ErrorFallback onRetry={() => refetch()} />;

  return (
    <div className="py-6">
      <h1 className="text-h1 mb-1">문제 풀기</h1>
      <p className="text-secondary mb-6">
        카테고리를 선택하면 AI가 맞춤 문제 10개를 생성합니다
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="card-base h-28 animate-pulse bg-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {topics?.map((t) => {
            const Icon = getTopicIcon(t.code);
            return (
              <button
                key={t.code}
                type="button"
                className="card-base flex flex-col items-center text-center cursor-pointer hover:border-brand transition-colors"
                onClick={() => handleSelect(t.code, t.displayName)}
              >
                <div className="w-11 h-11 bg-accent-light rounded-[10px] flex items-center justify-center mb-3">
                  <Icon size={22} className="text-brand" />
                </div>
                <span className="text-body font-bold">{t.displayName}</span>
                <span className="text-xs text-text-caption mt-1">
                  {t.subtopics.length > 0 ? t.subtopics.map((s) => s.displayName).join(", ") : t.displayName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {generating && <LoadingOverlay topicName={generating} />}
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/pages/CategoryCards.tsx
git commit -m "feat: 카테고리 카드 선택 페이지 추가"
```

---

### Task 8: ScoreCountUp 컴포넌트

**Files:**
- Create: `src/components/ScoreCountUp.tsx`

- [ ] **Step 1: 카운트업 애니메이션 컴포넌트 작성**

```typescript
import { useState, useEffect, useRef } from "react";

const COLOR_SCALE = [
  "#EF4444", "#EF4444", "#EF4444", "#EF4444",
  "#F59E0B", "#F59E0B", "#F59E0B",
  "#4F46E5", "#4F46E5",
  "#22C55E", "#22C55E",
] as const;

interface ScoreCountUpProps {
  readonly target: number;
  readonly total: number;
  readonly onComplete?: () => void;
}

export default function ScoreCountUp({ target, total, onComplete }: ScoreCountUpProps) {
  const [count, setCount] = useState(0);
  const [animating, setAnimating] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let step = 0;
    const tick = () => {
      step++;
      setCount(step);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 200);
      if (step < target) {
        setTimeout(tick, 60 + step * 30);
      } else {
        setTimeout(() => onCompleteRef.current?.(), 200);
      }
    };
    const timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, [target]);

  const color = COLOR_SCALE[count] ?? COLOR_SCALE[0];

  return (
    <div
      className="text-[96px] font-bold leading-none transition-colors duration-200"
      style={{
        color,
        transform: animating ? "scale(1.3)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s",
      }}
    >
      {count} <span className="text-4xl font-normal text-text-caption">/ {total}</span>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/ScoreCountUp.tsx
git commit -m "feat: 점수 카운트업 애니메이션 컴포넌트 추가"
```

---

### Task 9: StepNavigator 컴포넌트

**Files:**
- Create: `src/components/StepNavigator.tsx`

- [ ] **Step 1: 3스텝 네비게이션 컴포넌트 작성**

```typescript
import { useState, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Grid2x2 } from "lucide-react";

interface StepNavigatorProps {
  readonly steps: readonly ReactNode[];
  readonly lastButtonLabel?: string;
  readonly onLastStep?: () => void;
}

export default function StepNavigator({ steps, lastButtonLabel = "다른 카테고리", onLastStep }: StepNavigatorProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const total = steps.length;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < total) setCurrent(idx);
  };

  const handleNext = () => {
    if (current < total - 1) goTo(current + 1);
    else onLastStep?.();
  };

  const isLast = current === total - 1;

  return (
    <div
      className="flex flex-col h-full"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (diff > 50) handleNext();
        else if (diff < -50) goTo(current - 1);
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14">
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center bg-surface-card border border-border rounded-lg"
          onClick={() => goTo(current - 1)}
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </button>
        <span className="text-sm text-text-secondary font-semibold">
          {current + 1} / {total}
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-400 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {steps.map((step, i) => (
            <div key={i} className="min-w-full h-full flex flex-col items-center justify-center px-6 text-center">
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 py-3">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-brand" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-6">
        <button
          type="button"
          className="w-full h-12 bg-brand text-white font-bold rounded-lg flex items-center justify-center gap-1.5"
          onClick={handleNext}
        >
          {isLast ? lastButtonLabel : "다음"}
          {isLast ? <Grid2x2 size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/StepNavigator.tsx
git commit -m "feat: 3스텝 네비게이션 컴포넌트 추가"
```

---

### Task 10: PracticeSet 페이지 (세트 풀이 래퍼)

**Files:**
- Create: `src/pages/PracticeSet.tsx`

- [ ] **Step 1: 세트 풀이 래퍼 작성**

```typescript
import { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { usePracticeStore } from "../stores/practiceStore";
import QuestionDetail from "./QuestionDetail";

export default function PracticeSet() {
  const { sessionId, index } = useParams<{ sessionId: string; index: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();
  const currentIndex = Number(index ?? 0);
  const question = store.questions[currentIndex];

  useEffect(() => {
    if (question) {
      store.startTimer();
    }
  }, [currentIndex, question]);

  // 세션이 없으면 카테고리로 리다이렉트
  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  // 모든 문제 완료
  if (currentIndex >= store.questions.length) {
    return <Navigate to={`/practice/${sessionId}/result`} replace />;
  }

  const handleSubmitComplete = (isCorrect: boolean, selectedChoiceKey: string) => {
    store.recordResult(question.questionUuid, isCorrect, selectedChoiceKey);
    store.nextQuestion();
    navigate(`/practice/${sessionId}/${currentIndex + 1}`, { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-secondary">
            {currentIndex + 1} / {store.questions.length}
          </span>
          <span className="badge-topic">{store.topicName}</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / store.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* QuestionDetail — questionUuid를 key로 전달하여 리렌더링 */}
      <div className="flex-1 overflow-y-auto">
        <QuestionDetail
          key={question.questionUuid}
          practiceMode
          onPracticeSubmit={handleSubmitComplete}
        />
      </div>
    </div>
  );
}
```

참고: QuestionDetail에 `practiceMode`와 `onPracticeSubmit` prop을 전달해야 함. QuestionDetail이 이 prop들을 받아서 제출 후 결과 화면 대신 콜백을 호출하도록 수정이 필요한데, 이는 QuestionDetail 내부의 submit 핸들러에서 `practiceMode`일 때 `navigate` 대신 `onPracticeSubmit(isCorrect, selectedChoiceKey)`를 호출하는 최소한의 분기만 추가하면 됨. 이 수정은 Task 12에서 처리.

- [ ] **Step 2: 빌드 확인 (QuestionDetail prop 미추가 상태라 타입 에러 예상)**

Run: `npx tsc --noEmit`
Expected: QuestionDetail prop 관련 에러 (Task 12에서 해결)

- [ ] **Step 3: 커밋**

```bash
git add src/pages/PracticeSet.tsx
git commit -m "feat: 세트 풀이 래퍼 페이지 추가"
```

---

### Task 11: PracticeResult 페이지 (3스텝 결과 요약)

**Files:**
- Create: `src/pages/PracticeResult.tsx`

- [ ] **Step 1: 3스텝 결과 페이지 작성**

```typescript
import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { Check, RotateCcw } from "lucide-react";
import { usePracticeStore } from "../stores/practiceStore";
import { submitPractice } from "../api/practice";
import type { PracticeAnalysis } from "../types/api";
import ScoreCountUp from "../components/ScoreCountUp";
import StepNavigator from "../components/StepNavigator";

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return remSec > 0 ? `${min}분 ${remSec}초` : `${min}분`;
}

export default function PracticeResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const store = usePracticeStore();
  const [analysis, setAnalysis] = useState<PracticeAnalysis | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!store.topicCode || store.results.length === 0) return;
    submitPractice({ topicCode: store.topicCode, results: store.results })
      .then(setAnalysis)
      .catch(() => {
        // 실패 시 로컬 데이터로 fallback
        const correctCount = store.results.filter((r) => r.isCorrect).length;
        const totalDurationMs = store.results.reduce((sum, r) => sum + r.durationMs, 0);
        setAnalysis({
          correctCount,
          totalCount: store.results.length,
          totalDurationMs,
          greeting: correctCount >= 7 ? "꽤 잘했어요!" : "다시 도전해봐요!",
          analysis: "",
          tip: "",
        });
      });
  }, [store.topicCode, store.results]);

  if (!store.sessionId || store.sessionId !== sessionId) {
    return <Navigate to="/questions" replace />;
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-3 border-accent-light border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const totalDuration = formatDuration(analysis.totalDurationMs);
  const avgDuration = formatDuration(Math.round(analysis.totalDurationMs / analysis.totalCount));

  const step1 = (
    <>
      <span className="inline-block bg-accent-light text-brand text-sm font-medium px-3.5 py-1 rounded-full mb-8">
        {store.topicName}
      </span>
      <ScoreCountUp
        target={analysis.correctCount}
        total={analysis.totalCount}
        onComplete={() => setStatsVisible(true)}
      />
      <p
        className="text-body text-text-secondary mt-2 transition-opacity duration-300"
        style={{ opacity: statsVisible ? 1 : 0 }}
      >
        정답
      </p>
      <div
        className="flex gap-8 mt-8 transition-all duration-400"
        style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(12px)" }}
      >
        <div className="text-center">
          <div className="text-lg font-bold">{Math.round((analysis.correctCount / analysis.totalCount) * 100)}%</div>
          <div className="text-xs text-text-caption mt-0.5">정답률</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{totalDuration}</div>
          <div className="text-xs text-text-caption mt-0.5">총 시간</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{avgDuration}</div>
          <div className="text-xs text-text-caption mt-0.5">평균</div>
        </div>
      </div>
    </>
  );

  const step2 = (
    <div className="text-left w-full max-w-[360px]">
      <p className="text-2xl font-bold text-center mb-5">{analysis.greeting}</p>
      {analysis.analysis && (
        <p className="text-body leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis.analysis }} />
      )}
      {analysis.tip && (
        <div className="mt-5 p-3.5 bg-code rounded-lg text-sm text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Tip</strong> — {analysis.tip}
        </div>
      )}
    </div>
  );

  const step3 = (
    <div className="w-full text-left overflow-y-auto">
      <p className="text-sm font-medium text-text-caption mb-3">문제별 결과</p>
      <div className="flex flex-col gap-2">
        {store.results.map((r, i) => {
          const q = store.questions[i];
          return (
            <div
              key={r.questionUuid}
              className={`flex items-center gap-3 p-3 bg-surface-card border rounded-[10px] ${
                r.isCorrect ? "border-border" : "border-red-300"
              }`}
            >
              <span className={`text-sm font-bold w-5 text-center ${r.isCorrect ? "text-green-600" : "text-red-600"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{q?.stemPreview}</p>
                <p className="text-xs text-text-caption mt-0.5">{formatDuration(r.durationMs)}</p>
              </div>
              {r.isCorrect ? (
                <Check size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <Link
                  to={`/questions/${r.questionUuid}`}
                  className="flex items-center gap-1 text-xs font-medium text-brand bg-accent-light rounded-md px-2.5 py-1.5"
                >
                  <RotateCcw size={13} /> 다시
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-screen">
      <StepNavigator
        steps={[step1, step2, step3]}
        lastButtonLabel="다른 카테고리"
        onLastStep={() => {
          store.reset();
          navigate("/questions", { replace: true });
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (또는 Task 12 미완 시 minor 에러)

- [ ] **Step 3: 커밋**

```bash
git add src/pages/PracticeResult.tsx
git commit -m "feat: 3스텝 결과 요약 페이지 추가"
```

---

### Task 12: QuestionDetail에 practiceMode prop 추가 (최소 수정)

**Files:**
- Modify: `src/pages/QuestionDetail.tsx`

- [ ] **Step 1: QuestionDetail.tsx 현재 코드 읽기**

QuestionDetail.tsx를 읽고, 현재 submit 핸들러에서 결과 화면으로 navigate하는 부분을 찾는다.

- [ ] **Step 2: prop 인터페이스 추가 및 분기**

파일 상단에 props 인터페이스 추가:

```typescript
interface QuestionDetailProps {
  readonly practiceMode?: boolean;
  readonly onPracticeSubmit?: (isCorrect: boolean, selectedChoiceKey: string) => void;
}
```

함수 시그니처를 변경:

```typescript
export default function QuestionDetail({ practiceMode, onPracticeSubmit }: QuestionDetailProps = {})
```

submit 성공 후 navigate하는 부분에 분기 추가:

```typescript
// 기존: navigate(`/questions/${questionUuid}/result`, { state: { result } });
// 변경:
if (practiceMode && onPracticeSubmit) {
  onPracticeSubmit(result.isCorrect, selectedKey);
} else {
  navigate(`/questions/${questionUuid}/result`, { state: { result } });
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/pages/QuestionDetail.tsx
git commit -m "feat: QuestionDetail에 practiceMode prop 추가"
```

---

### Task 13: 라우팅 연결

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 라우트 추가**

`src/App.tsx` 수정:

import 변경:
```typescript
// 기존
import Questions from "./pages/Questions";
// 변경
import CategoryCards from "./pages/CategoryCards";
```

import 추가:
```typescript
import PracticeSet from "./pages/PracticeSet";
import PracticeResult from "./pages/PracticeResult";
```

라우터에 children 배열 수정:
```typescript
{ path: "questions", element: <CategoryCards /> },
```

AppLayout children 바깥, `questions/:questionUuid/result` 옆에 추가:
```typescript
{
  path: "practice/:sessionId/:index",
  element: <PracticeSet />,
},
{
  path: "practice/:sessionId/result",
  element: <PracticeResult />,
},
```

- [ ] **Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 개발 서버에서 확인**

Run: `npm run dev`
Expected: `/questions`에 카테고리 카드 표시, 클릭 시 로딩 → 세트 풀이 흐름 동작

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx
git commit -m "feat: Practice 라우트 연결 및 Questions→CategoryCards 교체"
```

---

### Task 14: 전체 빌드 & 수동 테스트

**Files:** 없음 (검증만)

- [ ] **Step 1: 프로덕션 빌드**

Run: `npm run build`
Expected: 에러 없음

- [ ] **Step 2: 기존 테스트 실행**

Run: `npx vitest run`
Expected: 기존 테스트 통과 (mock-data 변경으로 인한 깨짐 있으면 수정)

- [ ] **Step 3: 수동 플로우 테스트**

1. `/questions` → 카테고리 카드 5개 표시됨
2. JOIN 카드 클릭 → 로딩 오버레이 + 마이크로카피 전환
3. 로딩 완료 → `/practice/:sessionId/0` 이동, 진행률 바 "1/10"
4. 문제 제출 → 자동으로 다음 문제 이동, "2/10"
5. 10문제 완료 → `/practice/:sessionId/result`
6. 스텝 1: 점수 카운트업 (색상 전환 + 이징)
7. 스텝 2: AI 분석 텍스트
8. 스텝 3: 문제별 결과 카드 + "다시" 버튼
9. "다른 카테고리" → `/questions` 복귀

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "fix: 빌드 및 테스트 수정"
```
