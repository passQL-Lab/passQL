# Home.tsx daisyUI 컴포넌트 클래스 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Home.tsx`의 커스텀 CSS 클래스 중 daisyUI로 1:1 대체 가능한 것을 교체해 점진적 마이그레이션 파일럿을 완성한다.

**Architecture:** 테마 base 색상 매핑을 먼저 수정한 뒤, Home.tsx에서 스켈레톤 → 뱃지 → 버튼 → 카드 순으로 교체한다. passQL 전용 클래스(typography, badge-topic, 시맨틱 카드)는 건드리지 않는다. UI 변경이므로 테스트 코드 작성은 생략한다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `client/src/styles/theme.css` | base-100 ↔ base-200 색상 매핑 수정 |
| `client/src/pages/Home.tsx` | skeleton, badge, btn, card 클래스 교체 |

변경하지 않는 파일: `tokens.css`, `typography.css`, `components.css`, 기타 페이지/컴포넌트

---

### Task 1: theme.css — base 색상 매핑 수정

daisyUI의 `card` 컴포넌트는 `bg-base-100`을 배경으로 사용한다. 현재 `base-100`이 `#FAFAFA`(페이지 배경색)로 매핑되어 있어 카드가 흰색이 아닌 회색이 된다. daisyUI 컨벤션에 맞게 `base-100` = 흰색(카드 표면), `base-200` = `#FAFAFA`(페이지 배경)으로 수정한다.

**Files:**
- Modify: `client/src/styles/theme.css`

- [ ] **Step 1: base-100과 base-200 색상 교체**

`theme.css`에서 아래 두 줄을 수정한다:

```css
/* 수정 전 */
--color-base-100: oklch(98.2% 0 0);       /* #FAFAFA - page background */
--color-base-200: oklch(96.2% 0.001 247);  /* #F3F4F6 - code bg */

/* 수정 후 */
--color-base-100: oklch(100% 0 0);         /* #FFFFFF - card/component surface */
--color-base-200: oklch(98.2% 0 0);        /* #FAFAFA - page background */
```

- [ ] **Step 2: 빌드 에러 없는지 확인**

```bash
cd client && npm run build
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 3: 커밋**

```bash
git add client/src/styles/theme.css
git commit -m "refactor: daisyUI base 색상 매핑 수정 (base-100=white, base-200=#FAFAFA) #167"
```

---

### Task 2: Home.tsx — 로딩 스켈레톤 → `skeleton`

daisyUI `skeleton` 클래스는 `bg-base-300`(`#E5E7EB`) + `animate-pulse` + `rounded`를 자동으로 제공한다. 현재 수동으로 조합한 펄스 클래스와 동일한 색상이다.

**Files:**
- Modify: `client/src/pages/Home.tsx`

**교체 대상 2곳:**

| 위치 | 현재 | 교체 후 |
|------|------|--------|
| 히트맵 로딩 | `h-16 bg-border animate-pulse rounded` | `skeleton h-16` |
| progress 로딩 (2개) | `h-24 rounded-xl bg-border animate-pulse` | `skeleton h-24` |

- [ ] **Step 1: 히트맵 스켈레톤 교체**

```tsx
// 수정 전
<div className="h-16 bg-border animate-pulse rounded" />

// 수정 후
<div className="skeleton h-16" />
```

- [ ] **Step 2: progress 스켈레톤 교체 (2개)**

```tsx
// 수정 전
<div className="h-24 rounded-xl bg-border animate-pulse" />

// 수정 후
<div className="skeleton h-24" />
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "refactor: 로딩 스켈레톤 daisyUI skeleton 클래스로 교체 #167"
```

---

### Task 3: Home.tsx — 연속 학습 뱃지 → `badge badge-warning badge-soft`

`badge-soft` modifier는 semantic 색상의 15% 불투명도로 배경을 만들어 현재 `bg-sem-warning-light` + `text-sem-warning-text` 조합과 시각적으로 유사하다.

**Files:**
- Modify: `client/src/pages/Home.tsx`

- [ ] **Step 1: streak 뱃지 클래스 교체**

```tsx
// 수정 전
<span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold bg-sem-warning-light text-sem-warning-text">
  <Flame size={14} className="inline mr-1" fill="currentColor" />
  연속 {streak}일
</span>

// 수정 후
<span className="badge badge-warning badge-soft font-bold gap-1">
  <Flame size={14} fill="currentColor" />
  연속 {streak}일
</span>
```

- [ ] **Step 2: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "refactor: 연속 학습 뱃지 daisyUI badge로 교체 #167"
```

---

### Task 4: Home.tsx — 재시도 버튼 → `btn btn-xs btn-outline btn-primary`

현재 `btn-compact`(32px 높이, 14px 폰트, outline 스타일)와 대응된다. `btn-xs`는 daisyUI의 가장 작은 버튼 사이즈로 높이와 패딩이 유사하다.

**Files:**
- Modify: `client/src/pages/Home.tsx`

**교체 대상 2곳 (히트맵 에러, progress 에러):**

- [ ] **Step 1: 히트맵 재시도 버튼 교체**

```tsx
// 수정 전
<button
  type="button"
  className="btn-compact inline-flex items-center gap-1 text-xs"
  onClick={() => refetchHeatmap()}
>
  <RefreshCw size={12} />
  재시도
</button>

// 수정 후
<button
  type="button"
  className="btn btn-xs btn-outline btn-primary gap-1"
  onClick={() => refetchHeatmap()}
>
  <RefreshCw size={12} />
  재시도
</button>
```

- [ ] **Step 2: progress 재시도 버튼 교체**

```tsx
// 수정 전
<button
  type="button"
  className="btn-compact inline-flex items-center gap-1 text-xs"
  onClick={() => refetchProgress()}
>
  <RefreshCw size={12} />
  재시도
</button>

// 수정 후
<button
  type="button"
  className="btn btn-xs btn-outline btn-primary gap-1"
  onClick={() => refetchProgress()}
>
  <RefreshCw size={12} />
  재시도
</button>
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "refactor: 재시도 버튼 daisyUI btn으로 교체 #167"
```

---

### Task 5: Home.tsx — 카드 → `card p-4 sm:p-6`

daisyUI `card`는 `rounded-box`(16px, passql 테마 일치) + `bg-base-100`(Task 1 이후 white)을 제공한다. `card-body`를 쓰면 기본 패딩 20px가 고정되므로, 기존 `card-base`의 반응형 패딩(16px/24px)을 유지하려면 `p-4 sm:p-6`을 명시한다.

교체하지 않는 카드:
- 성공 완료 카드(`bg-sem-success-light border-l-4 border-sem-success`) — 시맨틱 카드, 유지

**Files:**
- Modify: `client/src/pages/Home.tsx`

**교체 대상 목록:**

| 용도 | 현재 클래스 시작 | 교체 후 시작 |
|------|-------------|------------|
| 미완료 오늘의 문제 카드 | `card-base shadow-sm h-full flex flex-col gap-2 …` | `card p-4 sm:p-6 shadow-sm h-full flex flex-col gap-2 …` |
| 시험 일정 있음 카드 | `card-base shadow-sm h-full flex flex-col justify-center` | `card p-4 sm:p-6 shadow-sm h-full flex flex-col justify-center` |
| 시험 일정 없음 카드 | `card-base shadow-sm h-full flex flex-col justify-center` | `card p-4 sm:p-6 shadow-sm h-full flex flex-col justify-center` |
| 학습 현황 카드 | `card-base shadow-sm mb-4` | `card p-4 sm:p-6 shadow-sm mb-4` |
| progress 에러 카드 | `card-base mb-4 flex items-center justify-between` | `card p-4 sm:p-6 mb-4 flex items-center justify-between` |
| AI 추천문제 없음 카드 | `card-base shadow-sm flex items-center gap-3 …` | `card p-4 sm:p-6 shadow-sm flex items-center gap-3 …` |
| 합격 준비도 카드 | `card-base shadow-sm mb-4` | `card p-4 sm:p-6 shadow-sm mb-4` |
| 통계 카드 (2개) | `card-base shadow-sm flex flex-col items-start` | `card p-4 sm:p-6 shadow-sm flex flex-col items-start` |

- [ ] **Step 1: 위 목록의 모든 `card-base` → `card p-4 sm:p-6`으로 일괄 교체**

`card-base`가 포함된 각 className에서 `card-base`를 `card p-4 sm:p-6`으로 치환한다.

- [ ] **Step 2: 커밋**

```bash
git add client/src/pages/Home.tsx
git commit -m "refactor: 카드 컴포넌트 daisyUI card 클래스로 교체 #167"
```

---

### Task 6: 최종 빌드 확인

- [ ] **Step 1: 프로덕션 빌드 통과 확인**

```bash
cd client && npm run build
```

Expected: 타입 에러, 빌드 에러 없음

- [ ] **Step 2: 개발 서버로 시각 확인**

```bash
npm run dev
```

브라우저에서 홈 화면 진입 후 확인:
- 카드: 흰색 배경, 16px radius, 적절한 패딩 ✓
- 연속 학습 뱃지: 연한 노랑 배경, 불꽃 아이콘 ✓
- 재시도 버튼: outline 스타일, 인디고 색상 ✓
- 스켈레톤: 회색 pulse 애니메이션 ✓
- 성공 카드(오늘의 문제 완료): 초록 배경 유지 ✓
