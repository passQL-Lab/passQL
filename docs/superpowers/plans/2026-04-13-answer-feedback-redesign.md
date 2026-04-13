# AnswerFeedback 결과 화면 UI 전면 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AnswerFeedback 결과 화면에 문제 보기 토글과 SQL 아코디언 구조를 추가하고, dead code를 제거하여 UI를 전면 개선한다.

**Architecture:** QuestionDetail → AnswerFeedback 간 navigate state에 `stem`, `topicName`을 추가하고, AnswerFeedback에서 문제 보기 토글 카드와 아코디언 SQL 섹션을 신규 구현한다. Dead code(AI 해설 sheet 관련)는 이 과정에서 함께 제거한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react, @tanstack/react-query

---

### Task 1: QuestionDetail — navigate state에 stem/topicName 추가

**Files:**
- Modify: `client/src/pages/QuestionDetail.tsx` (lines 225–233)

- [ ] **Step 1: fullResult 객체에 stem과 topicName 추가**

`QuestionDetail.tsx`의 `handleSubmit` 내부 `fullResult` 객체를 다음과 같이 수정한다.

```typescript
const fullResult = {
  ...result,
  selectedKey,
  questionUuid,
  executionMode: question.executionMode,
  choices,
  // 결과 화면에서 문제 지문/토픽 표시용 — 백엔드 추가 호출 없이 전달
  stem: question.stem,
  topicName: question.topicName,
};
```

- [ ] **Step 2: 빌드 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: 타입 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/QuestionDetail.tsx
git commit -m "feat: 결과화면 이동 시 stem/topicName navigate state 추가 #55"
```

---

### Task 2: AnswerFeedback — FeedbackState 인터페이스에 stem/topicName 추가

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx` (lines 12–25)

- [ ] **Step 1: FeedbackState 인터페이스에 두 필드 추가**

```typescript
interface FeedbackState {
  readonly isCorrect: boolean;
  readonly correctKey: string;
  readonly rationale: string;
  readonly selectedKey: string;
  readonly selectedSql: string | null;
  readonly correctSql: string | null;
  readonly questionUuid: string;
  readonly executionMode?: ExecutionMode;
  readonly selectedResult: ExecuteResult | null;
  readonly correctResult: ExecuteResult | null;
  readonly isDailyChallenge?: boolean;
  readonly choices?: readonly ChoiceItem[];
  // 결과 화면 상단 문제 보기 토글용
  readonly stem?: string;
  readonly topicName?: string;
}
```

- [ ] **Step 2: state 구조분해에 stem/topicName 추가**

기존 구조분해 블록(line ~119)에 추가:

```typescript
const {
  isCorrect,
  rationale,
  selectedSql,
  correctSql,
  executionMode,
  isDailyChallenge,
  choices,
  selectedKey,
  correctKey,
  stem,
  topicName,
} = state;
```

- [ ] **Step 3: 빌드 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: 타입 에러 없이 빌드 성공

- [ ] **Step 4: 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "feat: FeedbackState에 stem/topicName 필드 추가 #55"
```

---

### Task 3: AnswerFeedback — Dead code 제거

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx`

현재 `AnswerFeedback.tsx`에는 사용하지 않는 코드가 남아 있다.

- [ ] **Step 1: 사용하지 않는 import 제거**

파일 상단 import 블록에서 다음을 제거:
```typescript
// 제거할 항목들
import { useMutation } from "@tanstack/react-query";
import { diffExplain } from "../api/ai";
import AiExplanationSheet from "../components/AiExplanationSheet";
```

`ChevronRight`는 유사 문제 섹션에서 계속 사용하므로 유지.

- [ ] **Step 2: dead state 및 mutation 제거**

컴포넌트 body에서 다음 코드 블록을 제거:

```typescript
// 제거: aiSheetOpen state
const [aiSheetOpen, setAiSheetOpen] = useState(false);
// 제거: aiText state
const [aiText, setAiText] = useState("");
// 제거: diffMutation
const diffMutation = useMutation({
  mutationFn: diffExplain,
  onSuccess: (result) => setAiText(result.text),
});
```

- [ ] **Step 3: AiExplanationSheet JSX 제거**

return 문 내부에서 다음 블록 제거:

```tsx
<AiExplanationSheet
  isOpen={aiSheetOpen}
  isLoading={diffMutation.isPending}
  text={aiText}
  onClose={() => setAiSheetOpen(false)}
/>
```

- [ ] **Step 4: 빌드 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: unused variable 경고 없이 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "refactor: AnswerFeedback dead code 제거 (AI 해설 sheet) #55"
```

---

### Task 4: CSS — 문제 보기 토글 카드 및 아코디언 클래스 추가

**Files:**
- Modify: `client/src/styles/components.css`

- [ ] **Step 1: 문제 보기 토글 카드 클래스 추가**

`components.css` 파일 끝에 다음을 추가한다:

```css
/* ── AnswerFeedback: 문제 보기 토글 카드 ── */
.stem-toggle-card {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.stem-toggle-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
}

.stem-toggle-preview {
  flex: 1;
  font-size: 0.6875rem; /* 11px */
  color: var(--color-text-caption);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.stem-toggle-body {
  border-top: 1px solid var(--color-border-muted);
  padding: 8px 12px 12px;
}

/* ── AnswerFeedback: SQL 아코디언 카드 ── */
.acc-sql-card {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.acc-sql-card.is-wrong {
  background-color: #FEF2F2;
  border-color: #FECACA;
}

.acc-sql-card.is-correct {
  background-color: #F0FDF4;
  border-color: #BBF7D0;
}

.acc-sql-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
}

.acc-sql-preview {
  flex: 1;
  font-size: 0.625rem; /* 10px */
  color: var(--color-text-caption);
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.acc-sql-body {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding: 9px 12px;
  background-color: rgba(255, 255, 255, 0.7);
}

/* ── AnswerFeedback: 모두 실행 버튼 ── */
.btn-run-all {
  font-size: 0.625rem; /* 10px */
  font-weight: 600;
  color: #4F46E5;
  border: 1px solid #C7D2FE;
  border-radius: 6px;
  padding: 3px 9px;
  background-color: #EEF2FF;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color 150ms ease;
}

.btn-run-all:active {
  background-color: #E0E7FF;
}

/* ── AnswerFeedback: 행수 pill ── */
.row-count-pill {
  font-size: 0.625rem; /* 10px */
  font-weight: 600;
  color: #16A34A;
  background-color: #F0FDF4;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: CSS 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add client/src/styles/components.css
git commit -m "feat: AnswerFeedback 아코디언/토글 CSS 클래스 추가 #55"
```

---

### Task 5: AnswerFeedback — 문제 보기 토글 카드 구현

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: stemOpen state 및 BookOpen/ChevronDown import 추가**

파일 상단 lucide import에 `BookOpen`, `ChevronDown` 추가:

```typescript
import { ChevronRight, AlertCircle, RefreshCw, BookOpen, ChevronDown } from "lucide-react";
```

컴포넌트 body에 state 추가:

```typescript
const [stemOpen, setStemOpen] = useState(false);
```

- [ ] **Step 2: stemToggleSection JSX 작성**

`conceptSection` 선언 위에 다음을 추가:

```tsx
// ── 문제 보기 토글 카드 — stem이 없으면 렌더링하지 않음 ──
const stemToggleSection = stem ? (
  <div
    className="stem-toggle-card feedback-card-anim-1"
    onClick={() => setStemOpen((v) => !v)}
  >
    <div className="stem-toggle-header">
      <BookOpen size={13} className="text-base-content/50 shrink-0" />
      <span className="text-xs font-semibold text-base-content/50">문제 보기</span>
      {!stemOpen && (
        <span className="stem-toggle-preview">{stem}</span>
      )}
      <ChevronDown
        size={13}
        className={`text-base-content/30 shrink-0 ml-auto transition-transform duration-200 ${stemOpen ? "rotate-180" : ""}`}
      />
    </div>
    {stemOpen && (
      <div className="stem-toggle-body" onClick={(e) => e.stopPropagation()}>
        {topicName && (
          <span className="badge-topic mb-2 inline-block">{topicName}</span>
        )}
        <p className="text-sm text-base-content leading-relaxed">{stem}</p>
      </div>
    )}
  </div>
) : null;
```

- [ ] **Step 3: return 문에 stemToggleSection 삽입**

`conceptSection` 앞에 `stemToggleSection` 삽입:

```tsx
<div className="flex-1 mx-auto max-w-180 w-full px-4 pt-4 pb-24 space-y-3">
  {stemToggleSection}
  {conceptSection}
  {rationaleSection}
  {choiceListSection}
  ...
</div>
```

- [ ] **Step 4: 개발 서버 실행 후 브라우저 확인**

```bash
cd client && npm run dev
```

`http://localhost:5174` 접속 후 문제를 풀고 결과 화면에서:
- "문제 보기" 카드가 접힌 상태로 상단에 표시되는지 확인
- 클릭 시 지문과 토픽 뱃지가 표시되는지 확인
- CONCEPT_ONLY / EXECUTABLE 모두 동일하게 동작하는지 확인

- [ ] **Step 5: 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "feat: AnswerFeedback 문제 보기 토글 카드 추가 #55"
```

---

### Task 6: AnswerFeedback — SQL 아코디언 구조 구현

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: openKeys state 추가**

EXECUTABLE 모드에서 기본 펼침 대상(내 선택 + 정답)을 초기값으로 갖는 state:

```typescript
// 아코디언 열림 상태 — 내 선택/정답 카드는 기본 펼침
const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
  if (!state) return new Set();
  const defaultOpen = new Set<string>();
  if (state.selectedKey) defaultOpen.add(state.selectedKey);
  if (state.correctKey) defaultOpen.add(state.correctKey);
  return defaultOpen;
});

const toggleOpen = useCallback((key: string) => {
  setOpenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}, []);
```

- [ ] **Step 2: handleRunAll 구현**

```typescript
// 미실행 선택지 전체 병렬 실행 — 이미 실행 중이거나 캐시된 항목은 executingKeyRef guard로 자동 스킵
const handleRunAll = useCallback(async () => {
  if (!state) return;
  const unexecuted = sqlChoices.filter(
    (c) => !resultCacheRef.current[c.key] && !executingKeyRef.current.has(c.key)
  );
  await Promise.allSettled(unexecuted.map((c) => handleExecute(c)));
}, [state, sqlChoices, handleExecute]);
```

`handleRunAll`은 `sqlChoices`에 의존하므로, `sqlChoices` 선언 이후에 위치시켜야 한다.

- [ ] **Step 3: getChoiceCardClass 수정 — A/B/C/D 키 레이블 반환 제거**

기존 함수에서 반환 타입을 수정한다. `key` 표시 제거를 위해 wrapperClass, badgeClass, badgeText만 유지 (기존과 동일):

```typescript
/** EXECUTABLE 선택지 카드 상태에 따른 Tailwind 클래스 반환 */
function getChoiceCardClass(isAnswer: boolean, isMyChoice: boolean): {
  cardClass: string;
  badgeClass: string;
  badgeText: string | null;
} {
  if (isAnswer && isMyChoice) {
    return {
      cardClass: "acc-sql-card is-correct",
      badgeClass: "badge badge-sm bg-success/20 text-success-content border-0",
      badgeText: "내 선택 · 정답",
    };
  }
  if (isAnswer) {
    return {
      cardClass: "acc-sql-card is-correct",
      badgeClass: "badge badge-sm bg-success/20 text-success-content border-0",
      badgeText: "정답",
    };
  }
  if (isMyChoice) {
    return {
      cardClass: "acc-sql-card is-wrong",
      badgeClass: "badge badge-sm bg-error/20 text-error border-0",
      badgeText: "내 선택",
    };
  }
  return {
    cardClass: "acc-sql-card",
    badgeClass: "",
    badgeText: null,
  };
}
```

- [ ] **Step 4: choiceListSection JSX 전면 교체**

기존 `choiceListSection`을 다음으로 교체:

```tsx
// ── EXECUTABLE: SQL 아코디언 비교 섹션 ──
const choiceListSection = isExecutable && sqlChoices.length > 0 ? (
  <section className="space-y-2 feedback-card-anim-3">
    {/* 섹션 헤더: 레이블 + 모두 실행 버튼 */}
    <div className="flex items-center justify-between px-0.5">
      <p className="text-xs text-base-content/40 uppercase tracking-widest font-medium">
        SQL 실행 비교
      </p>
      <button
        type="button"
        className="btn-run-all"
        onClick={handleRunAll}
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        모두 실행
      </button>
    </div>

    {/* 선택지 아코디언 목록 */}
    {sqlChoices.map((choice) => {
      const isAnswer = choice.key === correctKey;
      const isMyChoice = choice.key === selectedKey;
      const cached = resultCache[choice.key];
      const isRunning = executing.has(choice.key);
      const error = execErrors[choice.key];
      const isOpen = openKeys.has(choice.key);
      const { cardClass, badgeClass, badgeText } = getChoiceCardClass(isAnswer, isMyChoice);

      return (
        <div key={choice.key} className={cardClass}>
          {/* 아코디언 헤더 — 클릭으로 열기/닫기 */}
          <div
            className="acc-sql-header"
            onClick={() => toggleOpen(choice.key)}
          >
            {/* 뱃지 (정답/내 선택만 표시) */}
            {badgeText && (
              <span className={`${badgeClass} shrink-0`}>{badgeText}</span>
            )}

            {/* SQL 미리보기 — 닫혀 있을 때만 표시 */}
            {!isOpen && (
              <span className="acc-sql-preview">{choice.body}</span>
            )}

            {/* 행수 pill — 캐시 있고 닫혀있을 때 */}
            {!isOpen && cached && !cached.errorCode && (
              <span className="row-count-pill">{cached.rows?.length ?? 0}행</span>
            )}

            {/* 실행 중 인디케이터 */}
            {isRunning && (
              <span className="text-xs text-base-content/40 shrink-0">실행 중…</span>
            )}

            <ChevronDown
              size={13}
              className={`text-base-content/30 shrink-0 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>

          {/* 아코디언 바디 — 열렸을 때만 표시 */}
          {isOpen && (
            <div className="acc-sql-body">
              {/* SQL 본문 */}
              <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words mb-3 text-base-content bg-base-200 rounded-lg p-3">
                {choice.body}
              </pre>

              {/* 실행 에러 */}
              {error ? (
                <div className="error-card mt-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                    <p className="text-sm text-error leading-snug break-words">{error}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-compact inline-flex items-center gap-1.5 shrink-0"
                    onClick={() => handleExecute(choice)}
                  >
                    <RefreshCw size={12} />
                    재시도
                  </button>
                </div>
              ) : !cached ? (
                /* 미실행 — 개별 실행 버튼 */
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn-compact inline-flex items-center gap-1.5"
                    onClick={() => handleExecute(choice)}
                    disabled={isRunning}
                  >
                    {isRunning ? "실행 중…" : "실행"}
                  </button>
                </div>
              ) : null}

              {/* 실행 결과 테이블 */}
              {cached && <ResultTable result={cached} />}
            </div>
          )}
        </div>
      );
    })}
  </section>
) : null;
```

- [ ] **Step 5: 개발 서버에서 EXECUTABLE 문제 결과 화면 확인**

```bash
cd client && npm run dev
```

`http://localhost:5174` 접속 후 EXECUTABLE 문제를 풀고 결과 화면에서:
- 내 선택 카드와 정답 카드가 기본 펼침 상태인지 확인
- 나머지 선택지가 접혀있고 SQL 미리보기가 표시되는지 확인
- 개별 "실행" 버튼 클릭 시 실행되는지 확인
- "모두 실행" 버튼 클릭 시 미실행 선택지가 일괄 실행되는지 확인
- A/B/C/D 키 레이블이 없는지 확인
- 정답인 경우 "내 선택 · 정답" 카드 1개만 펼쳐지는지 확인

- [ ] **Step 6: 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "feat: AnswerFeedback SQL 비교 섹션 아코디언 구조로 개편 #55"
```

---

### Task 7: animClass stagger 버그 수정

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx`

Task 6 완료 후 확인할 사항 — 기존 animClass 계산에 버그가 있다.

- [ ] **Step 1: choiceListSection의 animClass 확인**

Task 6에서 교체한 choiceListSection은 이미 `feedback-card-anim-3`으로 고정되어 있으므로 별도 수정 불필요.

다만, `stemToggleSection`에 `feedback-card-anim-1`, `conceptSection`에 `feedback-card-anim-1`가 중복 적용되어 있다면 순서를 조정한다:

```tsx
// stemToggleSection: feedback-card-anim-1
// conceptSection(CONCEPT_ONLY): feedback-card-anim-2  
// rationaleSection: feedback-card-anim-2
// choiceListSection: feedback-card-anim-3
```

`conceptSection` 내부 div에 `feedback-card-anim-1` 대신 `feedback-card-anim-2` 적용:

```tsx
const conceptSection = !isExecutable ? (
  <div className="space-y-2 feedback-card-anim-2">
    ...
  </div>
) : null;
```

`rationaleSection`도 마찬가지로 `feedback-card-anim-2` 유지.

- [ ] **Step 2: 빌드 및 최종 확인**

```bash
cd client && npm run build 2>&1 | tail -20
```

Expected: 빌드 성공, 타입 에러 없음

- [ ] **Step 3: 최종 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "fix: AnswerFeedback 애니메이션 stagger 클래스 순서 수정 #55"
```

---

## 자기 검토 (Spec Coverage)

| 스펙 요구사항 | 구현 태스크 |
|---|---|
| FeedbackState에 stem/topicName 추가 | Task 2 |
| QuestionDetail navigate state에 stem/topicName 전달 | Task 1 |
| 문제 보기 토글 카드 (BookOpen 아이콘, 접힘/펼침) | Task 5 |
| stem 없을 때 카드 미렌더링 | Task 5 |
| SQL 섹션 아코디언 (내 선택+정답 기본 펼침) | Task 6 |
| A/B/C/D 키 레이블 제거 | Task 6 |
| 모두 실행 버튼 | Task 6 |
| 개별 실행 버튼 | Task 6 |
| Dead code 제거 (AI 해설 sheet) | Task 3 |
| CSS 클래스 추가 (인라인 style 금지) | Task 4 |
| animClass stagger 버그 수정 | Task 7 |
| CONCEPT_ONLY: SQL 섹션 없음, 문제 보기+해설+답 카드만 | Task 6 (isExecutable 분기로 처리됨) |
| 에러 시 기존 error-card + 재시도 버튼 | Task 6 |
