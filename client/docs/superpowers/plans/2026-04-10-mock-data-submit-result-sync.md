# Mock 데이터 SubmitResult 동기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `SubmitResult`에 추가된 `executionMode`, `selectedResult`, `correctResult` 필드를 mock 응답에 반영해, EXECUTABLE 문제와 CONCEPT_ONLY 문제의 제출 결과를 분기 처리한다.

**Architecture:** `getMockResponse`의 `/submit` 핸들러가 path의 UUID로 `MOCK_QUESTIONS`를 조회해 `executionMode`를 판별. EXECUTABLE이면 `selectedResult`/`correctResult`(ExecuteResult)를 포함한 응답 반환. CONCEPT_ONLY는 기존 필드만 반환.

**Tech Stack:** TypeScript, Vitest

---

## 배경

최근 커밋 `e984cb4`에서 `SubmitResult` 인터페이스에 아래 세 필드가 추가됐다:

```typescript
// src/types/api.ts
export interface SubmitResult {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly executionMode?: ExecutionMode;      // 신규
  readonly selectedResult?: ExecuteResult;     // 신규 — EXECUTABLE 전용
  readonly correctResult?: ExecuteResult;      // 신규 — EXECUTABLE 전용
}
```

`AnswerFeedback` 컴포넌트(`commit 4a085ec`)는 이 필드로 EXECUTABLE/CONCEPT_ONLY 분기 렌더링을 수행한다.
현재 `getMockResponse`의 `/submit` 핸들러는 `{ isCorrect, correctKey, rationale }`만 반환하므로, EXECUTABLE 모드 테스트 시 `selectedResult`/`correctResult`가 없어 피드백 화면이 정상 동작하지 않는다.

### EXECUTABLE 모드 문제 목록 (MOCK_QUESTIONS 기준)

| questionUuid | topicCode | executionMode |
|---|---|---|
| q-uuid-0006 | sql_join | EXECUTABLE |
| q-uuid-0002 | sql_subquery | EXECUTABLE |
| q-uuid-0003 | sql_group_aggregate | EXECUTABLE |
| q-uuid-0004 | sql_ddl_dml_tcl | EXECUTABLE |

---

## 파일 구조

| 파일 | 작업 | 설명 |
|------|------|------|
| `src/api/mock-data.ts` | 수정 | `/submit` 핸들러 — UUID로 executionMode 판별 후 분기 응답 |
| `src/api/mock-data.test.ts` | 수정 | EXECUTABLE/CONCEPT_ONLY 제출 결과 테스트 추가 |

---

## Task 1: `getMockResponse` `/submit` 핸들러 업데이트

**Files:**
- Modify: `src/api/mock-data.ts` (POST /submit 핸들러 블록)

- [ ] **Step 1: 실패 테스트 작성 (TDD RED)**

`src/api/mock-data.test.ts`의 `describe("Submit")` 블록에 아래 테스트를 추가한다.

```typescript
it("returns executionMode and result sets for EXECUTABLE question", () => {
  // q-uuid-0006 is EXECUTABLE mode
  const result = getMockResponse(
    "/questions/q-uuid-0006/submit",
    "POST",
    JSON.stringify({ selectedChoiceKey: "A" }),
  ) as SubmitResult;
  expect(result.executionMode).toBe("EXECUTABLE");
  expect(result.selectedResult).toBeDefined();
  expect(result.correctResult).toBeDefined();
  expect(result.selectedResult?.columns).toBeDefined();
  expect(result.correctResult?.columns).toBeDefined();
});

it("does not include selectedResult/correctResult for CONCEPT_ONLY question", () => {
  // q-uuid-0001 is CONCEPT_ONLY mode
  const result = getMockResponse(
    "/questions/q-uuid-0001/submit",
    "POST",
    JSON.stringify({ selectedChoiceKey: "B" }),
  ) as SubmitResult;
  expect(result.executionMode).toBe("CONCEPT_ONLY");
  expect(result.selectedResult).toBeUndefined();
  expect(result.correctResult).toBeUndefined();
});
```

- [ ] **Step 2: 테스트 실행 — RED 확인**

```bash
npx vitest run src/api/mock-data.test.ts
```

Expected: 2개 테스트 FAIL (executionMode undefined)

- [ ] **Step 3: `mock-data.ts` import에 `SubmitResult` 타입 확인**

`src/api/mock-data.ts` 상단의 import 블록을 확인한다. `SubmitResult`가 이미 import되어 있으므로 추가 불필요.

```typescript
// 현재 import (변경 없음)
import type {
  // ...
  SubmitResult,
  ExecuteResult,
  // ...
} from "../types/api";
```

- [ ] **Step 4: EXECUTABLE 모드용 mock `ExecuteResult` 상수 추가**

`src/api/mock-data.ts`에서 `MOCK_CHOICES` 선언 바로 위에 아래 두 상수를 추가한다.

```typescript
// EXECUTABLE 문제 정답 실행 결과 (correctResult 용)
const MOCK_CORRECT_EXECUTE_RESULT: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [["홍길동", 2], ["김영희", 3], ["이철수", 1]],
  rowCount: 3,
  elapsedMs: 28,
  errorCode: null,
  errorMessage: null,
};

// EXECUTABLE 문제 오답 실행 결과 (selectedResult 용 — 오답 선택 시)
const MOCK_WRONG_EXECUTE_RESULT: ExecuteResult = {
  status: "SUCCESS",
  columns: ["name", "cnt"],
  rows: [["홍길동", 5], ["김영희", 1]],
  rowCount: 2,
  elapsedMs: 31,
  errorCode: null,
  errorMessage: null,
};
```

- [ ] **Step 5: `/submit` 핸들러 교체**

`src/api/mock-data.ts`에서 아래 블록을 찾아:

```typescript
  // POST /questions/:uuid/submit
  if (method === "POST" && path.includes("/submit")) {
    const parsed = body ? JSON.parse(body) : {};
    const selectedKey = (parsed.selectedChoiceKey ?? "A") as string;
    const isCorrect = selectedKey === "A";
    return { isCorrect, correctKey: "A", rationale: "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다." } satisfies SubmitResult;
  }
```

아래로 교체한다:

```typescript
  // POST /questions/:uuid/submit
  if (method === "POST" && path.includes("/submit")) {
    const parsed = body ? JSON.parse(body) : {};
    const selectedKey = (parsed.selectedChoiceKey ?? "A") as string;
    const isCorrect = selectedKey === "A";
    const questionUuid = path.split("/")[2];

    // UUID로 MOCK_QUESTIONS에서 executionMode 조회
    const matchedQuestion = MOCK_QUESTIONS.find((q) => q.questionUuid === questionUuid);
    // UUID가 없으면 기본값 CONCEPT_ONLY (알 수 없는 UUID 허용)
    const executionMode = matchedQuestion?.executionMode ?? "CONCEPT_ONLY";

    const baseResult = {
      isCorrect,
      correctKey: "A",
      rationale: "CUSTOMER와 ORDERS를 customer_id로 JOIN한 후 c.name으로 GROUP BY하면 고객별 주문 수를 정확히 구할 수 있습니다.",
      executionMode,
    };

    if (executionMode === "EXECUTABLE") {
      return {
        ...baseResult,
        // 정답이면 selectedResult = correctResult (동일 결과)
        // 오답이면 selectedResult = 다른 결과, correctResult = 정답 결과
        selectedResult: isCorrect ? MOCK_CORRECT_EXECUTE_RESULT : MOCK_WRONG_EXECUTE_RESULT,
        correctResult: MOCK_CORRECT_EXECUTE_RESULT,
      } satisfies SubmitResult;
    }

    return baseResult satisfies SubmitResult;
  }
```

- [ ] **Step 6: 테스트 실행 — GREEN 확인**

```bash
npx vitest run src/api/mock-data.test.ts
```

Expected: 모든 테스트 PASS (기존 테스트 포함)

- [ ] **Step 7: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/api/mock-data.ts src/api/mock-data.test.ts
git commit -m "fix: mock submit 응답에 executionMode, selectedResult, correctResult 추가 #70"
```

---

## 자체 리뷰

### 스펙 커버리지

| 요구사항 | 커버 태스크 |
|---|---|
| EXECUTABLE 문제 submit → selectedResult/correctResult 포함 | Task 1 Step 5 |
| CONCEPT_ONLY 문제 submit → selectedResult/correctResult 미포함 | Task 1 Step 5 |
| 알 수 없는 UUID → CONCEPT_ONLY 폴백 | Task 1 Step 5 (`?? "CONCEPT_ONLY"`) |
| 기존 submit 테스트 깨지지 않음 | Task 1 Step 6 |

### 플레이스홀더 검사

없음 — 모든 코드 완전히 작성됨.

### 타입 일관성

- `MOCK_CORRECT_EXECUTE_RESULT`, `MOCK_WRONG_EXECUTE_RESULT`: `ExecuteResult` satisfies로 타입 보장
- `baseResult satisfies SubmitResult`: CONCEPT_ONLY 반환도 타입 검사
- `{ ...baseResult, selectedResult, correctResult } satisfies SubmitResult`: EXECUTABLE 반환도 타입 검사
