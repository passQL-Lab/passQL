# 전체 반응형 수정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일(320-375px)에서 깨지는 레이아웃을 글로벌 CSS + 컴포넌트 + 페이지 레벨에서 근본 수정

**Architecture:** 글로벌 CSS(`typography.css`, `components.css`)에서 반응형 기본값을 잡고, 고정 폭 컨테이너를 가진 페이지들에 모바일 패딩을 추가. 히트맵 셀 크기를 축소하여 좁은 화면에 맞춤.

**Tech Stack:** Tailwind CSS 4, CSS media queries, React

---

### Task 1: 글로벌 Typography 반응형

**Files:**
- Modify: `src/styles/typography.css:1-19`

- [ ] **Step 1: `.text-h1` 반응형 크기 적용**

`.text-h1`의 `font-size`를 모바일 22px, `sm`(640px) 이상 28px으로 변경:

```css
.text-h1 {
  font-family: var(--font-ui);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.5px;
  color: var(--color-text-primary);
}

@media (min-width: 640px) {
  .text-h1 {
    font-size: 28px;
  }
}
```

- [ ] **Step 2: `.text-h2` 반응형 크기 적용**

`.text-h2`의 `font-size`를 모바일 18px, `sm` 이상 22px으로 변경:

```css
.text-h2 {
  font-family: var(--font-ui);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.3px;
  color: var(--color-text-primary);
}

@media (min-width: 640px) {
  .text-h2 {
    font-size: 22px;
  }
}
```

- [ ] **Step 3: 브라우저에서 확인**

Run: `npm run dev`

320px 뷰포트에서 Home 페이지 제목, Stats 페이지 숫자 등이 줄어든 크기로 표시되는지 확인.

- [ ] **Step 4: Home.tsx에서 임시 text-lg 제거**

Task 1에서 `.text-h2`가 이미 반응형이 되었으므로, Home.tsx의 `text-lg sm:text-h2` 오버라이드를 원래 `text-h2`로 복원:

```tsx
// Before
<h1 className="text-lg sm:text-h2">

// After
<h1 className="text-h2">
```

- [ ] **Step 5: Commit**

```bash
git add src/styles/typography.css src/pages/Home.tsx
git commit -m "fix: heading 반응형 크기 적용 (모바일 22/18px → sm 28/22px) #41"
```

---

### Task 2: 글로벌 Card 반응형 패딩

**Files:**
- Modify: `src/styles/components.css:1-8`

- [ ] **Step 1: `.card-base` 패딩을 모바일 16px, sm 이상 24px으로 변경**

```css
/* ── 1. Card ── */
.card-base {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px;
  transition: transform 250ms var(--ease-smooth), background-color 250ms var(--ease-smooth);
}

@media (min-width: 640px) {
  .card-base {
    padding: 24px;
  }
}
```

- [ ] **Step 2: 브라우저에서 확인**

320px 뷰포트에서 Home, CategoryCards, QuestionDetail, AnswerFeedback의 카드 내부 여백이 적절한지 확인. 콘텐츠가 잘리지 않는지 체크.

- [ ] **Step 3: Commit**

```bash
git add src/styles/components.css
git commit -m "fix: card-base 모바일 패딩 16px → sm 24px 반응형 #41"
```

---

### Task 3: HeatmapCalendar 셀 크기 축소

**Files:**
- Modify: `src/components/HeatmapCalendar.tsx:48-67`

- [ ] **Step 1: 셀 크기 w-7 h-7 → w-6 h-6, gap-1 유지**

히트맵 셀(28px)을 24px로 줄여 좁은 화면에서 줄바꿈 횟수 감소:

```tsx
// Before (line 56)
className="w-7 h-7 rounded flex items-center justify-center text-[10px]"

// After
className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
```

- [ ] **Step 2: 브라우저에서 확인**

320px 뷰포트에서 히트맵이 카드 내부에 깔끔하게 배치되는지 확인. 30개 셀이 적절히 줄바꿈되는지 체크.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeatmapCalendar.tsx
git commit -m "fix: 히트맵 셀 크기 축소 (28px → 24px) 모바일 대응 #41"
```

---

### Task 4: PracticeSet 모바일 패딩

**Files:**
- Modify: `src/pages/PracticeSet.tsx:52`

- [ ] **Step 1: 컨테이너에 `px-4` 추가**

`max-w-120`은 상한선이므로 그대로 두되, 모바일에서 좌우 패딩이 없는 문제를 해결:

```tsx
// Before (line 52)
<div className="flex flex-col h-screen max-w-120 mx-auto w-full">

// After
<div className="flex flex-col h-screen max-w-120 mx-auto w-full px-4 sm:px-0">
```

주의: line 53의 내부 `px-4`와 line 76의 `px-4`는 이미 있으므로, 외부 컨테이너의 px-4는 전체 영역에 적용. 내부 px-4와 중복되므로, 대신 내부 px-4를 제거하지 않고 외부에만 추가하면 중첩됨.

실제로 확인하면: line 52의 컨테이너는 `max-w-120`(480px)으로 모바일에서 화면 폭을 초과하지 않음(480px > 320px이지만 `w-full`이 있어 320px로 제한됨). 내부 line 53 `px-4`와 line 76 `px-4`가 이미 좌우 패딩을 제공.

따라서 PracticeSet.tsx는 **수정 불필요**. `max-w-120` + `w-full` + 내부 `px-4`로 이미 모바일 대응됨.

- [ ] **Step 2: 실제로 320px에서 확인하여 검증**

Run: `npm run dev`

320px 뷰포트에서 PracticeSet 페이지가 정상 표시되는지 확인. 문제 없으면 이 Task는 스킵.

---

### Task 5: PracticeResult 모바일 패딩

**Files:**
- Modify: `src/pages/PracticeResult.tsx:85, 136`

- [ ] **Step 1: 외부 컨테이너에 px-4 추가**

```tsx
// Before (line 136)
<div className="h-screen max-w-120 mx-auto">

// After
<div className="h-screen max-w-120 mx-auto px-4 sm:px-0">
```

- [ ] **Step 2: step2의 max-w-90 제거**

`max-w-90`(360px)은 320px 화면에서 좌우 여백 없이 꽉 차므로, 상위 컨테이너 패딩에 맡김:

```tsx
// Before (line 85)
<div className="text-left w-full max-w-90">

// After
<div className="text-left w-full max-w-90 px-2 sm:px-0">
```

- [ ] **Step 3: 브라우저에서 확인**

320px 뷰포트에서 PracticeResult의 3개 스텝(점수, 분석, 문제별 결과)이 정상 표시되는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PracticeResult.tsx
git commit -m "fix: PracticeResult 모바일 패딩 추가 #41"
```

---

### Task 6: 최종 확인 및 정리

- [ ] **Step 1: 모든 페이지 320px 뷰포트 확인**

확인 대상:
- `/` (Home) — 제목, 카드, 히트맵, 통계, 추천문제
- `/questions` (CategoryCards)
- `/questions/:uuid` (QuestionDetail)
- `/questions/:uuid/result` (AnswerFeedback)
- `/practice/:id` (PracticeSet)
- `/practice/:id/result` (PracticeResult)
- `/stats` (Stats)
- `/settings` (Settings)

- [ ] **Step 2: 375px 뷰포트 확인**

동일 페이지를 iPhone SE/iPhone 14 크기에서 확인.

- [ ] **Step 3: 데스크톱(1280px) 확인**

반응형 변경이 데스크톱 레이아웃을 깨뜨리지 않았는지 확인.

- [ ] **Step 4: Commit (필요 시)**

누락된 수정이 있으면 추가 커밋.
