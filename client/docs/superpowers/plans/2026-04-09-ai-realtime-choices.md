# AI 실시간 선택지 생성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 `QuestionDetail.choices` 기반 문제 풀이를 SSE 스트리밍 AI 실시간 선택지 생성 모델로 전환한다.

**Architecture:** `POST /questions/{uuid}/generate-choices` SSE 엔드포인트를 통해 선택지를 실시간 스트리밍 수신. 프론트는 SSE 이벤트(status → complete/error)를 파싱하여 스켈레톤 → 실제 선택지로 교체. `choiceSetId`를 state에 보관하여 제출 시 함께 전송. 선택지 클릭 시점에 다음 문제 선택지 백그라운드 프리페치.

**Tech Stack:** TypeScript, React 19, fetch Streaming API (SSE), Zustand, React Router DOM, Vitest, React Testing Library

---

## 파일 변경 목록

| 파일 | 작업 | 내용 |
|------|------|------|
| `src/types/api.ts` | Modify | `QuestionDetail`에서 `choices` 제거, SSE 타입 4개 추가 |
| `src/api/mock-data.ts` | Modify | `generateChoicesMock()` 추가, submit mock `choiceSetId` 처리, `MOCK_QUESTION_DETAIL.choices` 제거 |
| `src/api/questions.ts` | Modify | `generateChoices()` SSE 함수 추가, `submitAnswer()` body에 `choiceSetId` 추가 |
| `src/hooks/useQuestionDetail.ts` | Modify | `useGenerateChoices` 훅 추가, `useSubmitAnswer` signature 변경 |
| `src/components/ChoicesSkeleton.tsx` | Create | 선택지 생성 중 스켈레톤 + phase 메시지 컴포넌트 |
| `src/hooks/usePrefetch.ts` | Create | 다음 문제 선택지 프리페치 캐시 훅 |
| `src/pages/QuestionDetail.tsx` | Modify | SSE 상태 UI, 스켈레톤, 에러/재시도, prefetch 트리거 |
| `src/pages/AnswerFeedback.tsx` | Modify | `FeedbackState`에 `choiceSetId` 추가 |
| `src/api/mock-data.test.ts` | Modify | `choices` 테스트 제거, `generateChoicesMock` 테스트 추가 |

---

## Task 1: 타입 정의 업데이트

**Files:**
- Modify: `src/types/api.ts`

- [ ] **Step 1: `QuestionDetail`에서 `choices` 제거, SSE 타입 추가**

```typescript
// src/types/api.ts

// QuestionDetail — choices 제거
export interface QuestionDetail {
  readonly questionUuid: string;
  readonly topicName: string;
  readonly subtopicName: string;
  readonly difficulty: number;
  readonly executionMode: ExecutionMode;
  readonly stem: string;
  readonly schemaDisplay: string;
  // choices 없음 — generate-choices SSE로 별도 수신
}

// SSE 타입 추가 (파일 끝에 추가)
export type ChoiceGenerationPhase = "generating" | "validating";

export interface ChoiceGenerationStatus {
  readonly phase: ChoiceGenerationPhase;
  readonly message: string;
}

export interface ChoiceSetComplete {
  readonly choiceSetId: string;
  readonly choices: readonly ChoiceItem[];
}

export interface ChoiceGenerationError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
}

// submitAnswer body 타입 추가
export interface SubmitPayload {
  readonly choiceSetId: string;
  readonly selectedChoiceKey: string;
}
```

- [ ] **Step 2: 빌드 에러 확인 (choices 참조 지점 파악)**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
npm run build 2>&1 | grep -E "error|choices" | head -30
```

Expected: `question.choices` 참조 에러가 `QuestionDetail.tsx`에서 발생. 다음 태스크에서 수정할 것이므로 지금은 에러 목록만 확인.

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: QuestionDetail choices 제거 + SSE 타입 추가 #21"
```

---

## Task 2: Mock 데이터 업데이트

**Files:**
- Modify: `src/api/mock-data.ts`
- Modify: `src/api/mock-data.test.ts`

- [ ] **Step 1: 실패 테스트 작성 (`mock-data.test.ts`)**

`choices` 테스트 제거, `generateChoicesMock` 테스트 추가:

```typescript
// src/api/mock-data.test.ts — 변경 부분

// 제거: choices 테스트 (Task 2 Step 1에서 먼저 삭제)
// it("returns question detail for GET /questions/:uuid", () => {
//   ...
//   expect(result.choices).toHaveLength(4);  // ← 이 줄 삭제
// });

// 유지 (choices 체크 없이):
it("returns question detail for GET /questions/:uuid", () => {
  const result = getMockResponse("/questions/q-uuid-0001", "GET") as QuestionDetail;
  expect(result.questionUuid).toBe("q-uuid-0001");
  expect(result.stem).toBeTruthy();
  // choices는 더 이상 QuestionDetail에 없음
});

// 추가: generateChoicesMock 테스트
import { generateChoicesMock } from "./mock-data";
import type { ChoiceSetComplete, ChoiceGenerationStatus } from "../types/api";

describe("generateChoicesMock", () => {
  it("calls onStatus then onComplete", async () => {
    const onStatus = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();

    const abort = generateChoicesMock("q-uuid-0001", { onStatus, onComplete, onError });

    // 완료까지 대기 (mock은 800ms)
    await new Promise((r) => setTimeout(r, 1000));

    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "generating" })
    );
    expect(onStatus).toHaveBeenCalledWith(
      expect.objectContaining({ phase: "validating" })
    );
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        choiceSetId: expect.stringContaining("cs-mock-"),
        choices: expect.arrayContaining([
          expect.objectContaining({ key: "A" }),
        ]),
      })
    );
    expect(onError).not.toHaveBeenCalled();
    abort(); // cleanup
  });

  it("calls cleanup without crashing if aborted before complete", async () => {
    const onComplete = vi.fn();
    const abort = generateChoicesMock("q-uuid-0001", {
      onStatus: vi.fn(),
      onComplete,
      onError: vi.fn(),
    });
    abort(); // 즉시 중단
    await new Promise((r) => setTimeout(r, 1000));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
npx vitest run src/api/mock-data.test.ts 2>&1 | tail -20
```

Expected: `generateChoicesMock is not a function` 또는 import 에러.

- [ ] **Step 3: `mock-data.ts` 구현**

`MOCK_QUESTION_DETAIL`에서 `choices` 제거, `generateChoicesMock` 추가:

```typescript
// src/api/mock-data.ts

// MOCK_QUESTION_DETAIL — choices 제거
const MOCK_QUESTION_DETAIL: QuestionDetail = {
  questionUuid: "q-uuid-0001",
  topicName: "JOIN",
  subtopicName: "INNER JOIN",
  difficulty: 2,
  executionMode: "EXECUTABLE",
  stem: "다음 SQL 중 고객별 주문 수를 올바르게 구하는 것은?",
  schemaDisplay: "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)",
  // choices 제거
};

// MOCK_CHOICES — 선택지를 별도 상수로 분리 (generateChoicesMock에서 사용)
const MOCK_CHOICES: readonly ChoiceItem[] = [
  { key: "A", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 1 },
  { key: "B", kind: "SQL", body: "SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.cust_id\nGROUP BY c.name", sortOrder: 2 },
  { key: "C", kind: "SQL", body: "SELECT name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY name", sortOrder: 3 },
  { key: "D", kind: "SQL", body: "SELECT c.name, SUM(o.amount) AS total\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name", sortOrder: 4 },
];

// SSE 콜백 타입
interface ChoiceGenerationCallbacks {
  readonly onStatus: (status: ChoiceGenerationStatus) => void;
  readonly onComplete: (result: ChoiceSetComplete) => void;
  readonly onError: (error: ChoiceGenerationError) => void;
}

/** Mock SSE 시뮬레이션 — 타이머 기반 순서 재현 */
export function generateChoicesMock(
  _questionUuid: string,
  callbacks: ChoiceGenerationCallbacks,
): () => void {
  let aborted = false;

  const t1 = setTimeout(() => {
    if (aborted) return;
    callbacks.onStatus({ phase: "generating", message: "선택지 생성 중..." });
  }, 200);

  const t2 = setTimeout(() => {
    if (aborted) return;
    callbacks.onStatus({ phase: "validating", message: "SQL 실행 검증 중..." });
  }, 500);

  const t3 = setTimeout(() => {
    if (aborted) return;
    callbacks.onComplete({
      choiceSetId: `cs-mock-${Date.now()}`,
      choices: MOCK_CHOICES,
    });
  }, 800);

  return () => {
    aborted = true;
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
}
```

`getMockResponse`에서 submit 핸들러 — `choiceSetId` 무시 (already handles `selectedChoiceKey`):
```typescript
// POST /questions/:uuid/submit — 이미 selectedChoiceKey 처리 중, choiceSetId는 무시해도 됨
// 기존 코드 그대로 유지
```

- [ ] **Step 4: import 타입 추가 (`mock-data.ts` 상단)**

```typescript
import type {
  // 기존 타입들...
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
  ChoiceItem,
} from "../types/api";
```

- [ ] **Step 5: 테스트 실행 — PASS 확인**

```bash
npx vitest run src/api/mock-data.test.ts 2>&1 | tail -20
```

Expected: 모든 테스트 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/api/mock-data.ts src/api/mock-data.test.ts
git commit -m "test: generateChoicesMock + choices 타입 제거 반영 #21"
```

---

## Task 3: `generateChoices` SSE API 함수

**Files:**
- Modify: `src/api/questions.ts`

- [ ] **Step 1: `generateChoices` 구현 추가**

```typescript
// src/api/questions.ts — 추가

import { generateChoicesMock } from "./mock-data";
import type {
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
} from "../types/api";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

interface ChoiceGenerationCallbacks {
  readonly onStatus: (status: ChoiceGenerationStatus) => void;
  readonly onComplete: (result: ChoiceSetComplete) => void;
  readonly onError: (error: ChoiceGenerationError) => void;
}

/**
 * POST /questions/{questionUuid}/generate-choices (SSE)
 * Returns a cleanup function — call it to abort the stream.
 */
export function generateChoices(
  questionUuid: string,
  callbacks: ChoiceGenerationCallbacks,
): () => void {
  if (USE_MOCK) {
    return generateChoicesMock(questionUuid, callbacks);
  }

  const controller = new AbortController();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

  (async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/questions/${questionUuid}/generate-choices`,
        {
          method: "POST",
          headers: {
            "X-Member-UUID": getMemberUuid(),
            Accept: "text/event-stream",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        },
      );

      if (!res.ok || !res.body) {
        callbacks.onError({ code: "HTTP_ERROR", message: `서버 오류 (${res.status})`, retryable: true });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 블록은 "\n\n"으로 구분
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const lines = block.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
          }

          if (!eventType || !dataStr) continue;

          const data = JSON.parse(dataStr);

          if (eventType === "status") {
            callbacks.onStatus(data as ChoiceGenerationStatus);
          } else if (eventType === "complete") {
            callbacks.onComplete(data as ChoiceSetComplete);
          } else if (eventType === "error") {
            callbacks.onError(data as ChoiceGenerationError);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      callbacks.onError({ code: "NETWORK_ERROR", message: "네트워크 오류가 발생했습니다", retryable: true });
    }
  })();

  return () => controller.abort();
}
```

- [ ] **Step 2: `submitAnswer` — `choiceSetId` 추가**

```typescript
// src/api/questions.ts — submitAnswer 수정
export function submitAnswer(
  questionUuid: string,
  choiceSetId: string,
  selectedChoiceKey: string,
): Promise<SubmitResult> {
  return apiFetch(`/questions/${questionUuid}/submit`, {
    method: "POST",
    headers: { "X-Member-UUID": getMemberUuid() },
    body: JSON.stringify({ choiceSetId, selectedChoiceKey }),
  });
}
```

- [ ] **Step 3: import 추가**

`src/api/questions.ts` 상단에:
```typescript
import type {
  // 기존...
  SubmitResult,
  ExecuteResult,
  TodayQuestionResponse,
  RecommendationsResponse,
  ChoiceGenerationStatus,
  ChoiceSetComplete,
  ChoiceGenerationError,
} from "../types/api";
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error" | head -20
```

Expected: `useSubmitAnswer` 호출부에서 인자 개수 에러 발생. Task 4에서 수정.

- [ ] **Step 5: Commit**

```bash
git add src/api/questions.ts
git commit -m "feat: generateChoices SSE 함수 추가, submitAnswer choiceSetId 추가 #21"
```

---

## Task 4: 훅 업데이트

**Files:**
- Modify: `src/hooks/useQuestionDetail.ts`

- [ ] **Step 1: `useGenerateChoices` 훅 추가, `useSubmitAnswer` 수정**

```typescript
// src/hooks/useQuestionDetail.ts — 전체 교체

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchQuestion, executeChoice, submitAnswer, generateChoices } from "../api/questions";
import type {
  ChoiceItem,
  ChoiceGenerationPhase,
  ChoiceGenerationError,
} from "../types/api";

export function useQuestionDetail(questionUuid: string) {
  return useQuery({
    queryKey: ["question", questionUuid],
    queryFn: () => fetchQuestion(questionUuid),
    staleTime: 0,
  });
}

export function useExecuteChoice(questionUuid: string) {
  return useMutation({
    mutationFn: (sql: string) => executeChoice(questionUuid, sql),
  });
}

export function useSubmitAnswer(questionUuid: string) {
  return useMutation({
    mutationFn: ({ choiceSetId, selectedChoiceKey }: { choiceSetId: string; selectedChoiceKey: string }) =>
      submitAnswer(questionUuid, choiceSetId, selectedChoiceKey),
  });
}

type GenerateState =
  | { kind: "idle" }
  | { kind: "loading"; phase: ChoiceGenerationPhase; message: string }
  | { kind: "done"; choiceSetId: string; choices: readonly ChoiceItem[] }
  | { kind: "error"; error: ChoiceGenerationError };

export function useGenerateChoices(questionUuid: string) {
  const [state, setState] = useState<GenerateState>({ kind: "idle" });
  const abortRef = useRef<(() => void) | null>(null);

  const generate = useCallback(() => {
    // 이전 스트림 정리
    abortRef.current?.();

    setState({ kind: "loading", phase: "generating", message: "선택지 생성 중..." });

    abortRef.current = generateChoices(questionUuid, {
      onStatus: ({ phase, message }) => {
        setState({ kind: "loading", phase, message });
      },
      onComplete: ({ choiceSetId, choices }) => {
        setState({ kind: "done", choiceSetId, choices });
        abortRef.current = null;
      },
      onError: (error) => {
        setState({ kind: "error", error });
        abortRef.current = null;
      },
    });
  }, [questionUuid]);

  // 마운트 시 자동 생성 시작, 언마운트 시 정리
  useEffect(() => {
    generate();
    return () => {
      abortRef.current?.();
    };
  }, [generate]);

  return { state, retry: generate };
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error" | head -20
```

Expected: `QuestionDetail.tsx`에서 `submitMutation.mutate(selectedKey, ...)` 호출부 에러. Task 7에서 수정.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useQuestionDetail.ts
git commit -m "feat: useGenerateChoices 훅 추가, useSubmitAnswer choiceSetId 인자 추가 #21"
```

---

## Task 5: `ChoicesSkeleton` 컴포넌트

**Files:**
- Create: `src/components/ChoicesSkeleton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```typescript
// src/components/ChoicesSkeleton.tsx

import type { ChoiceGenerationPhase } from "../types/api";

interface ChoicesSkeletonProps {
  readonly phase: ChoiceGenerationPhase;
  readonly message: string;
}

export function ChoicesSkeleton({ phase, message }: ChoicesSkeletonProps) {
  return (
    <div className="mt-4 space-y-3">
      <div className="card-base">
        <p className="text-secondary text-sm animate-pulse">{message}</p>
        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-brand animate-pulse"
            style={{ width: phase === "validating" ? "75%" : "40%" }}
          />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="card-base space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-border animate-pulse" />
            <div className="w-4 h-4 rounded bg-border animate-pulse" />
          </div>
          <div className="h-16 rounded-lg bg-border animate-pulse" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChoicesSkeleton.tsx
git commit -m "feat: ChoicesSkeleton 컴포넌트 추가 #21"
```

---

## Task 6: `usePrefetch` 훅

**Files:**
- Create: `src/hooks/usePrefetch.ts`

- [ ] **Step 1: 훅 작성**

```typescript
// src/hooks/usePrefetch.ts

import { useRef, useCallback } from "react";
import { generateChoices } from "../api/questions";
import type { ChoiceSetComplete } from "../types/api";

// 세션 동안 유지되는 모듈 수준 캐시
const prefetchCache = new Map<string, ChoiceSetComplete>();

export function usePrefetch() {
  // 진행 중인 prefetch abort 함수들
  const inFlightRef = useRef(new Map<string, () => void>());

  const prefetch = useCallback((questionUuid: string) => {
    // 이미 캐시에 있거나 진행 중이면 skip
    if (prefetchCache.has(questionUuid)) return;
    if (inFlightRef.current.has(questionUuid)) return;

    const abort = generateChoices(questionUuid, {
      onStatus: () => {}, // prefetch는 status 표시 없음
      onComplete: (result) => {
        prefetchCache.set(questionUuid, result);
        inFlightRef.current.delete(questionUuid);
      },
      onError: () => {
        // 프리페치 실패는 무시 — 진입 시 새로 생성
        inFlightRef.current.delete(questionUuid);
      },
    });

    inFlightRef.current.set(questionUuid, abort);
  }, []);

  const getCached = useCallback((questionUuid: string): ChoiceSetComplete | null => {
    return prefetchCache.get(questionUuid) ?? null;
  }, []);

  const consumeCache = useCallback((questionUuid: string): ChoiceSetComplete | null => {
    const cached = prefetchCache.get(questionUuid) ?? null;
    prefetchCache.delete(questionUuid);
    return cached;
  }, []);

  return { prefetch, getCached, consumeCache };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePrefetch.ts
git commit -m "feat: usePrefetch 훅 추가 (다음 문제 선택지 프리페치 캐시) #21"
```

---

## Task 7: `QuestionDetail.tsx` 페이지 업데이트

**Files:**
- Modify: `src/pages/QuestionDetail.tsx`

이 태스크는 가장 많은 변경이 있다. 핵심 변경:
1. `question.choices` → `useGenerateChoices`에서 받아온 choices
2. 선택지 로딩 중 `ChoicesSkeleton` 표시
3. 에러 시 재시도 버튼 표시
4. `submitAnswer`에 `choiceSetId` 전달
5. 선택지 클릭 시 `usePrefetch` 트리거
6. `handleSubmit`에서 navigate state에 choices 포함 (AnswerFeedback이 필요)

- [ ] **Step 1: 전체 교체**

```typescript
// src/pages/QuestionDetail.tsx

import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { ChoiceCard } from "../components/ChoiceCard";
import { ChoicesSkeleton } from "../components/ChoicesSkeleton";
import AiExplanationSheet from "../components/AiExplanationSheet";
import { useQuestionDetail, useExecuteChoice, useSubmitAnswer, useGenerateChoices } from "../hooks/useQuestionDetail";
import { usePrefetch } from "../hooks/usePrefetch";
import { fetchRecommendations } from "../api/questions";
import { explainError } from "../api/ai";
import type { ExecuteResult } from "../types/api";

export default function QuestionDetail() {
  const { questionUuid } = useParams<{ questionUuid: string }>();
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestionDetail(questionUuid!);
  const { state: choicesState, retry: retryGenerate } = useGenerateChoices(questionUuid!);
  const executeMutation = useExecuteChoice(questionUuid!);
  const submitMutation = useSubmitAnswer(questionUuid!);
  const { prefetch } = usePrefetch();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [executeCache, setExecuteCache] = useState<Record<string, ExecuteResult>>({});
  const executeCacheRef = useRef(executeCache);
  executeCacheRef.current = executeCache;
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const prefetchTriggeredRef = useRef(false);

  const explainMutation = useMutation({
    mutationFn: explainError,
    onSuccess: (result) => setAiText(result.text),
  });

  const handleExecute = useCallback((choiceKey: string, sql: string) => {
    if (executeCacheRef.current[choiceKey]) return;
    executeMutation.mutate(sql, {
      onSuccess: (result) => {
        setExecuteCache((prev) => ({ ...prev, [choiceKey]: result }));
      },
    });
  }, [executeMutation]);

  const handleSelect = useCallback((choiceKey: string, sql: string) => {
    setSelectedKey(choiceKey);
    if (!executeCacheRef.current[choiceKey]) {
      handleExecute(choiceKey, sql);
    }
    // 첫 선택 시 다음 문제 프리페치 트리거
    if (!prefetchTriggeredRef.current) {
      prefetchTriggeredRef.current = true;
      fetchRecommendations(1, questionUuid)
        .then((res) => {
          const nextUuid = res.questions[0]?.questionUuid;
          if (nextUuid) prefetch(nextUuid);
        })
        .catch(() => {}); // 프리페치 실패는 무시
    }
  }, [handleExecute, prefetch, questionUuid]);

  const handleSubmit = useCallback(() => {
    if (!selectedKey || !question || choicesState.kind !== "done") return;
    const { choiceSetId, choices } = choicesState;
    submitMutation.mutate({ choiceSetId, selectedChoiceKey: selectedKey }, {
      onSuccess: (result) => {
        const selectedChoice = choices.find((c) => c.key === selectedKey);
        const correctChoice = choices.find((c) => c.key === result.correctKey);
        navigate(`/questions/${questionUuid}/result`, {
          state: {
            ...result,
            selectedKey,
            selectedSql: selectedChoice?.body,
            correctSql: correctChoice?.body,
            questionUuid,
            choiceSetId,
          },
        });
      },
    });
  }, [selectedKey, submitMutation, question, choicesState, questionUuid, navigate]);

  const handleAskAi = useCallback((choiceKey: string, _errorCode: string, errorMessage: string) => {
    setAiSheetOpen(true);
    setAiText("");
    if (choicesState.kind !== "done") return;
    const choice = choicesState.choices.find((c) => c.key === choiceKey);
    explainMutation.mutate({
      questionUuid: questionUuid!,
      sql: choice?.body ?? "",
      error_message: errorMessage,
    });
  }, [choicesState, questionUuid, explainMutation]);

  if (isLoading || !question) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-14 bg-border animate-pulse rounded" />
        <div className="h-24 bg-border animate-pulse rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (<div key={i} className="h-40 bg-border animate-pulse rounded-xl" />))}
        </div>
      </div>
    );
  }

  const isSubmitReady = selectedKey !== null && choicesState.kind === "done" && !submitMutation.isPending;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 bg-surface-card border-b border-border px-4 -mx-4 lg:-mx-0">
        <button type="button" className="text-text-primary" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-caption">{questionUuid?.slice(0, 8)}</span>
          <span className="badge-topic">{question.topicName}</span>
          <StarRating level={question.difficulty} />
        </div>
      </header>

      <section className="card-base mt-4"><p className="text-body">{question.stem}</p></section>

      {question.schemaDisplay && (
        <section className="mt-3">
          <button type="button" className="flex items-center gap-2 text-secondary text-sm w-full" onClick={() => setSchemaOpen((prev) => !prev)}>
            <span>스키마 보기</span>
            {schemaOpen ? <ChevronUp size={16} className="text-text-caption" /> : <ChevronDown size={16} className="text-text-caption" />}
          </button>
          {schemaOpen && (<pre className="code-block mt-2"><code>{question.schemaDisplay}</code></pre>)}
        </section>
      )}

      {/* 선택지 영역 */}
      {choicesState.kind === "loading" && (
        <ChoicesSkeleton phase={choicesState.phase} message={choicesState.message} />
      )}

      {choicesState.kind === "error" && (
        <div className="mt-4 card-base text-center space-y-3">
          <p className="text-secondary">
            {choicesState.error.retryable
              ? "선택지 생성에 실패했습니다"
              : "일시적인 문제가 발생했습니다"}
          </p>
          {choicesState.error.retryable ? (
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={retryGenerate}>
              <RefreshCw size={16} />
              다시 시도
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={() => navigate("/questions")}>
              문제 목록으로
            </button>
          )}
        </div>
      )}

      {choicesState.kind === "done" && (
        <section className="mt-4 space-y-3">
          {choicesState.choices.map((choice) => (
            <ChoiceCard
              key={choice.key}
              choice={choice}
              isSelected={selectedKey === choice.key}
              cached={executeCache[choice.key]}
              isExecutable={question.executionMode === "EXECUTABLE"}
              isExecuting={executeMutation.isPending && executeMutation.variables === choice.body}
              onSelect={handleSelect}
              onExecute={handleExecute}
              onAskAi={handleAskAi}
            />
          ))}
        </section>
      )}

      <AiExplanationSheet
        isOpen={aiSheetOpen}
        isLoading={explainMutation.isPending}
        text={aiText}
        onClose={() => setAiSheetOpen(false)}
      />

      <div className="fixed bottom-0 inset-x-0 lg:left-55 bg-surface-card border-t border-border p-4 z-20">
        <div className="mx-auto max-w-180">
          <button
            type="button"
            className={`w-full h-12 rounded-lg text-base font-bold ${isSubmitReady ? "bg-brand text-white" : "bg-border text-text-caption cursor-not-allowed"}`}
            disabled={!isSubmitReady}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? "제출 중..." : "답안 제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build 2>&1 | grep -E "error" | head -20
```

Expected: `AnswerFeedback.tsx`의 `FeedbackState`에 `choiceSetId` 없음 에러 가능. Task 8에서 수정.

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuestionDetail.tsx
git commit -m "feat: QuestionDetail SSE 선택지 생성 UI 적용 + prefetch 트리거 #21"
```

---

## Task 8: `AnswerFeedback.tsx` 업데이트 + 최종 빌드

**Files:**
- Modify: `src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: `FeedbackState`에 `choiceSetId` 추가**

```typescript
// src/pages/AnswerFeedback.tsx — FeedbackState 수정

interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql?: string;
  readonly correctSql?: string;
  readonly questionUuid: string;
  readonly choiceSetId: string; // 추가
}
```

`handleAskAi` 내부 `diffMutation.mutate` — `question_id` 필드는 현재 `0`으로 하드코딩 상태. 그대로 유지 (백엔드 `questionUuid` 기반 diff-explain 마이그레이션은 별도 이슈).

- [ ] **Step 2: 전체 빌드 PASS 확인**

```bash
cd /Users/luca/Documents/GitHub/passQL/client
npm run build 2>&1
```

Expected: 빌드 성공, 에러 없음.

- [ ] **Step 3: 전체 테스트 PASS 확인**

```bash
npx vitest run 2>&1 | tail -10
```

Expected: 모든 테스트 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AnswerFeedback.tsx
git commit -m "feat: AnswerFeedback FeedbackState에 choiceSetId 추가 #21"
```

---

## 자기 검토 (Spec Coverage)

| 스펙 항목 | 구현 태스크 |
|-----------|------------|
| `QuestionDetail`에서 `choices` 제거 | Task 1, 2 |
| `POST /generate-choices` SSE 함수 | Task 3 |
| `status` 이벤트 → phase 메시지 업데이트 | Task 3, 4 |
| `complete` 이벤트 → 선택지 + choiceSetId | Task 3, 4 |
| `error` 이벤트 → retryable 분기 | Task 3, 4 |
| 스켈레톤 UI (animate-pulse) | Task 5 |
| 에러 시 재시도/돌아가기 버튼 | Task 7 |
| `submitAnswer` body에 `choiceSetId` | Task 3, 4 |
| 선택지 클릭 시 prefetch 트리거 | Task 7 |
| `prefetchCache` Map + consumeCache | Task 6 |
| `AnswerFeedback` state에 `choiceSetId` | Task 8 |
| Mock SSE 시뮬레이션 | Task 2 |
