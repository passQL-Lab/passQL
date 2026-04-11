# Fixed Bottom 액션 버튼 전 화면 통일 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 화면에서 액션 버튼(제출/다음/홈으로 등)을 `fixed bottom-0 inset-x-0 z-20`으로 통일해 UI 일관성 확보

**Architecture:** `QuestionDetail.tsx`의 제출 버튼을 스크롤 영역 밖 `fixed bottom-0`으로 이동. `AnswerFeedback.tsx`의 기존 fixed 버튼 스타일을 동일하게 통일. `PracticeFeedbackBar`(z-30)가 제출 후 제출 버튼(z-20)을 자연스럽게 덮는 기존 구조를 그대로 활용.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `client/src/pages/QuestionDetail.tsx` | 제출 버튼을 스크롤 영역 밖 fixed bottom으로 이동, pb-6 → pb-24 |
| `client/src/pages/AnswerFeedback.tsx` | fixed 버튼 컨테이너 스타일 통일 (배경색, 테두리, max-width) |

변경하지 않는 파일: `DailyChallenge.tsx`, `PracticeSet.tsx`, `PracticeFeedbackBar.tsx`

---

### Task 1: QuestionDetail — 제출 버튼 fixed bottom으로 이동

**Files:**
- Modify: `client/src/pages/QuestionDetail.tsx`

- [ ] **Step 1: 최상위 컨테이너 pb-6 → pb-24 변경**

`QuestionDetail.tsx` 289번째 줄의 최상위 div를 수정한다. fixed 버튼 높이(약 80px)만큼 스크롤 영역 하단 여백 확보.

```tsx
// 변경 전
<div className="flex flex-col px-1 pb-6">

// 변경 후
<div className="flex flex-col px-1 pb-24">
```

- [ ] **Step 2: 스크롤 영역 내 제출 버튼 래퍼 제거**

334~337번째 줄의 제출 버튼 래퍼를 제거한다.

```tsx
// 아래 블록 전체 삭제
<div className="px-3 pt-4">
  {submitButton}
</div>
```

- [ ] **Step 3: fixed bottom 제출 버튼 추가**

`AiExplanationSheet` 바로 위, `return` 블록 내 최상위 div의 닫는 태그 직전에 fixed 버튼을 추가한다. `submitMutation.isPending` 시에는 `LoadingOverlay`가 화면을 덮으므로 버튼은 항상 렌더링한다.

```tsx
{/* fixed bottom 제출 버튼 — PracticeFeedbackBar(z-30)가 제출 후 자연스럽게 덮음 */}
<div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page border-t border-border">
  <div className="mx-auto max-w-120 px-4 py-4">
    {submitButton}
  </div>
</div>
```

배치 위치 기준 — `QuestionDetail.tsx` return 블록:
```tsx
return (
  <div className="flex flex-col px-1 pb-24">
    {/* ... 헤더, 지문, 스키마, 선택지, SqlPlayground ... */}

    {/* fixed bottom 제출 버튼 */}
    <div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page border-t border-border">
      <div className="mx-auto max-w-120 px-4 py-4">
        {submitButton}
      </div>
    </div>

    <AiExplanationSheet ... />
    {submitMutation.isPending && <LoadingOverlay ... />}
    {!practiceMode && <ConfirmModal ... />}
  </div>
);
```

- [ ] **Step 4: 개발 서버에서 동작 확인**

```bash
cd client && npm run dev
```

확인 항목:
- `/questions` 목록에서 문제 선택 → 단독 모드: 제출 버튼이 항상 하단에 고정되어 있음
- `/daily-challenge`: 선택지 선택 전/후 제출 버튼이 항상 하단 고정
- `/daily-challenge`: 제출 후 PracticeFeedbackBar가 제출 버튼 위로 슬라이드업하며 덮음 (동시에 두 버튼이 보이지 않아야 함)
- 연습 세트(`/practice/:sessionId`): 동일하게 동작 확인

- [ ] **Step 5: 커밋**

```bash
git add client/src/pages/QuestionDetail.tsx
git commit -m "fix: 제출 버튼 fixed bottom으로 이동해 PracticeFeedbackBar 겹침 해소 #035"
```

---

### Task 2: AnswerFeedback — fixed 버튼 컨테이너 스타일 통일

**Files:**
- Modify: `client/src/pages/AnswerFeedback.tsx`

- [ ] **Step 1: fixed 버튼 컨테이너 스타일 통일**

`AnswerFeedback.tsx` 262~293번째 줄의 fixed 버튼 컨테이너를 수정한다.

**현재 코드:**
```tsx
<div
  className="fixed bottom-0 inset-x-0 p-4 z-20"
  style={{
    backgroundColor: isCorrect
      ? "var(--color-sem-success-light)"
      : "var(--color-sem-error-light)",
  }}
>
  <div className="mx-auto max-w-180">
    <button
      type="button"
      className="w-full h-[52px] rounded-lg text-white font-bold text-base"
      style={{
        backgroundColor: isCorrect
          ? "var(--color-sem-success)"
          : "var(--color-sem-error)",
      }}
      onClick={() => {
        if (isDailyChallenge) {
          navigate(isCorrect ? "/" : "/daily-challenge", { replace: true });
        } else {
          navigate("/questions");
        }
      }}
    >
      {isDailyChallenge
        ? isCorrect ? "홈으로 가기" : "다시 풀기"
        : "문제 목록으로"}
    </button>
  </div>
</div>
```

**변경 후:**
```tsx
{/* fixed bottom 액션 버튼 — QuestionDetail과 동일한 컨테이너 구조 */}
<div className="fixed bottom-0 inset-x-0 z-20 bg-surface-page border-t border-border">
  <div className="mx-auto max-w-180 px-4 py-4">
    <button
      type="button"
      className="w-full h-12 rounded-lg text-white font-bold text-base"
      style={{
        backgroundColor: isCorrect
          ? "var(--color-sem-success)"
          : "var(--color-sem-error)",
      }}
      onClick={() => {
        if (isDailyChallenge) {
          navigate(isCorrect ? "/" : "/daily-challenge", { replace: true });
        } else {
          navigate("/questions");
        }
      }}
    >
      {isDailyChallenge
        ? isCorrect ? "홈으로 가기" : "다시 풀기"
        : "문제 목록으로"}
    </button>
  </div>
</div>
```

변경 내용:
- `p-4` 제거 → `px-4 py-4`는 내부 div로 이동 (QuestionDetail과 동일 구조)
- `style={{ backgroundColor: ... }}` 컨테이너 배경 제거 → `bg-surface-page border-t border-border`로 통일
- `max-w-180` 유지 (AnswerFeedback은 더 넓은 콘텐츠 영역 사용)
- `h-[52px]` → `h-12` (48px, QuestionDetail의 `btn-primary` 높이와 동일)

- [ ] **Step 2: 개발 서버에서 동작 확인**

```bash
cd client && npm run dev
```

확인 항목:
- 단독 문제 풀이 후 결과 화면(`/questions/:uuid/result`) 진입
- 하단 버튼 컨테이너가 흰 배경 + 상단 테두리 스타일로 표시됨
- 버튼 자체는 정답(초록)/오답(빨강) 색상 유지
- `pb-24` 스크롤 패딩으로 콘텐츠가 버튼에 가려지지 않음

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/AnswerFeedback.tsx
git commit -m "fix: AnswerFeedback fixed 버튼 컨테이너 스타일 QuestionDetail과 통일 #035"
```

---

## 최종 확인

- [ ] DailyChallenge에서 제출 후 "제출하기" 버튼과 PracticeFeedbackBar가 동시에 보이지 않음
- [ ] 모든 화면에서 스크롤 없이 액션 버튼이 항상 보임
- [ ] QuestionDetail, DailyChallenge, PracticeSet, AnswerFeedback 버튼 컨테이너 스타일 일관
