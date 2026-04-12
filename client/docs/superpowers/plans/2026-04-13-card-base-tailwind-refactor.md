# card-base → Tailwind 유틸리티 교체 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `card-base` 커스텀 CSS 클래스 15곳을 순수 Tailwind 유틸리티로 교체하고 CSS 블록을 삭제한다.

**Architecture:** Pages 5개 파일(9곳) → Commit 1, Components 5개 파일(6곳) + CSS 삭제 → Commit 2. 기능 변경 없는 순수 리팩토링이므로 시각적 결과가 기존과 동일한지 빌드로 검증한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite

---

## Task 1: Pages — card-base 교체 (9곳)

**Files:**
- Modify: `src/pages/Stats.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/QuestionDetail.tsx`
- Modify: `src/pages/AnswerFeedback.tsx`
- Modify: `src/pages/Home.tsx`

---

- [ ] **Step 1: Stats.tsx — 1번째 교체 (`!p-0` 오버라이드)**

`src/pages/Stats.tsx` 에서 아래를 찾아 교체:

```tsx
// Before
`card-base !p-0 ${s1.className}`

// After
`bg-surface-card border border-border rounded-2xl p-0 ${s1.className}`
```

- [ ] **Step 2: Stats.tsx — 2번째 교체 (`py-12` 오버라이드)**

```tsx
// Before
`card-base text-center py-12 ${s2.className}`

// After
`bg-surface-card border border-border rounded-2xl text-center py-12 ${s2.className}`
```

- [ ] **Step 3: Settings.tsx — 교체 (`p-0` 오버라이드)**

`src/pages/Settings.tsx` 에서:

```tsx
// Before
`card-base p-0 ${s1.className}`

// After
`bg-surface-card border border-border rounded-2xl p-0 ${s1.className}`
```

- [ ] **Step 4: QuestionDetail.tsx — 1번째 교체 (`py-8` 오버라이드)**

`src/pages/QuestionDetail.tsx` 에서:

```tsx
// Before
"mt-4 card-base text-center py-8 space-y-2"

// After
"mt-4 bg-surface-card border border-border rounded-2xl text-center py-8 space-y-2"
```

- [ ] **Step 5: QuestionDetail.tsx — 2번째 교체 (일반)**

```tsx
// Before
"card-base shadow-sm w-full text-left flex items-start gap-2 mt-2"

// After
"bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm w-full text-left flex items-start gap-2 mt-2"
```

- [ ] **Step 6: AnswerFeedback.tsx — 1번째 교체 (일반)**

`src/pages/AnswerFeedback.tsx` 에서:

```tsx
// Before
<div className="card-base">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
```

- [ ] **Step 7: AnswerFeedback.tsx — 2번째 교체 (일반 + mt-4)**

```tsx
// Before
<div className="card-base mt-4">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mt-4">
```

- [ ] **Step 8: AnswerFeedback.tsx — 3번째 교체 (인터랙티브)**

```tsx
// Before
<div className="card-base flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors">
```

- [ ] **Step 9: Home.tsx — 교체 (인터랙티브 + shadow)**

`src/pages/Home.tsx` 에서:

```tsx
// Before
<div className="card-base shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
```

- [ ] **Step 10: 빌드 검증**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공. TypeScript 타입 오류 없음.

- [ ] **Step 11: card-base 잔존 여부 확인**

```bash
grep -rn "card-base" src/pages/
```

Expected: 출력 없음 (0건)

- [ ] **Step 12: Commit 1**

```bash
git add src/pages/Stats.tsx src/pages/Settings.tsx src/pages/QuestionDetail.tsx src/pages/AnswerFeedback.tsx src/pages/Home.tsx
git commit -m "refactor: card-base → Tailwind 유틸리티 교체 (pages) #187"
```

---

## Task 2: Components + CSS 삭제 (6곳 + CSS)

**Files:**
- Modify: `src/components/SqlPlayground.tsx`
- Modify: `src/components/StatsBarChart.tsx`
- Modify: `src/components/StatsAnalysisCard.tsx`
- Modify: `src/components/StatsTopicList.tsx`
- Modify: `src/components/StatsRadarChart.tsx`
- Modify: `src/styles/components.css`

---

- [ ] **Step 1: SqlPlayground.tsx — 교체**

`src/components/SqlPlayground.tsx` 에서:

```tsx
// Before
<div className="card-base mt-3">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 mt-3">
```

- [ ] **Step 2: StatsBarChart.tsx — 교체**

`src/components/StatsBarChart.tsx` 에서:

```tsx
// Before
<div className="card-base">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
```

- [ ] **Step 3: StatsAnalysisCard.tsx — 1번째 교체**

`src/components/StatsAnalysisCard.tsx` 에서:

```tsx
// Before
<div className="card-base flex gap-3">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 flex gap-3">
```

- [ ] **Step 4: StatsAnalysisCard.tsx — 2번째 교체**

```tsx
// Before
<div className="card-base">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
```

- [ ] **Step 5: StatsTopicList.tsx — 교체**

`src/components/StatsTopicList.tsx` 에서:

```tsx
// Before
<div className="card-base">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
```

- [ ] **Step 6: StatsRadarChart.tsx — 교체**

`src/components/StatsRadarChart.tsx` 에서:

```tsx
// Before
<div className="card-base">

// After
<div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6">
```

- [ ] **Step 7: components.css — `.card-base` 블록 삭제**

`src/styles/components.css` 에서 아래 두 블록을 완전히 삭제:

```css
/* 삭제 대상 1 — 기본 블록 */
.card-base {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  transition: transform 250ms var(--ease-smooth), background-color 250ms var(--ease-smooth), border-color 250ms var(--ease-smooth), box-shadow 250ms var(--ease-smooth);
}

/* 삭제 대상 2 — 반응형 블록 */
@media (min-width: 640px) {
  .card-base {
    padding: 24px;
  }
}
```

- [ ] **Step 8: 전체 card-base 잔존 여부 최종 확인**

```bash
grep -rn "card-base" src/
```

Expected: 출력 없음 (0건)

- [ ] **Step 9: 빌드 검증**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공.

- [ ] **Step 10: Commit 2**

```bash
git add src/components/SqlPlayground.tsx src/components/StatsBarChart.tsx src/components/StatsAnalysisCard.tsx src/components/StatsTopicList.tsx src/components/StatsRadarChart.tsx src/styles/components.css
git commit -m "refactor: card-base → Tailwind 유틸리티 교체 (components) + CSS 삭제 #187"
```
