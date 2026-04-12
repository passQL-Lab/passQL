# Questions.tsx daisyUI 리팩토링 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Questions.tsx`의 커스텀 CSS 클래스(`card-base` 4곳, `filter-dropdown` 2곳)를 Tailwind 유틸리티 클래스로 교체하고, 단독 사용 중인 `.filter-dropdown` CSS를 `components.css`에서 삭제한다.

**Architecture:** `Questions.tsx`만 수정. `card-base`는 다른 파일에서도 사용 중이므로 `components.css`에서 삭제하지 않는다. `filter-dropdown`은 이 파일에서만 사용되므로 교체 후 CSS 3블록을 삭제한다. 시각적 결과는 변경 전후 동일하게 유지된다.

**Tech Stack:** React 19, Tailwind CSS 4, daisyUI 5, CSS custom properties (`@theme` in `src/styles/tokens.css`)

---

## 파일 구조

| 파일 | 작업 |
|------|------|
| `src/pages/Questions.tsx` | `card-base` 4곳, `filter-dropdown` 2곳 → Tailwind 유틸리티로 교체 |
| `src/styles/components.css` | `.filter-dropdown` 관련 3블록(26줄) 삭제 |

## Tailwind 클래스 대응표

프로젝트의 `src/styles/tokens.css`의 `@theme`에 정의된 CSS 변수가 Tailwind 4에서 유틸리티 클래스로 자동 생성된다.

| CSS 변수 | Tailwind 클래스 |
|----------|----------------|
| `--color-surface-card` (#FFFFFF) | `bg-surface-card` |
| `--color-border` (#E5E7EB) | `border-border`, `bg-border` |
| `--color-brand` (#4F46E5) | `border-brand` |
| `--color-brand-light` (#EEF2FF) | `bg-brand-light` |
| `--color-text-caption` (#9CA3AF) | `border-text-caption` |
| `border-radius: 16px` (--radius-box: 1rem) | `rounded-2xl` |

---

## Task 1: `card-base` 4곳 → Tailwind 유틸리티 교체

**Files:**
- Modify: `src/pages/Questions.tsx` (line 48, 60, 141, 150)

### 배경

`card-base`는 `components.css`에서 아래를 정의한다:
- `background-color: var(--color-surface-card)`
- `border: 1px solid var(--color-border)`
- `border-radius: 16px`
- `padding: 16px` (sm: 24px)
- transition 4개 (transform, background-color, border-color, box-shadow)

Tailwind 대응: `bg-surface-card border border-border rounded-2xl p-4 sm:p-6`

> **주의:** transition은 이미 각 사용처에서 `transition-all duration-200`으로 별도 지정 중이므로 추가 불필요.
> 스켈레톤 카드는 `sm:p-6` 불필요 (고정 높이 사용).

---

- [ ] **Step 1: 토픽 그리드 스켈레톤 카드 교체 (line 48)**

`src/pages/Questions.tsx` 48번 줄:

```tsx
// Before
<div key={i} className="card-base h-20 animate-pulse bg-border" />

// After
<div key={i} className="bg-surface-card border border-border rounded-2xl p-4 h-20 animate-pulse bg-border" />
```

- [ ] **Step 2: 토픽 카드 버튼 교체 (line 60)**

`src/pages/Questions.tsx` 60번 줄:

```tsx
// Before
className="card-base shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200 text-left"

// After
className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200 text-left"
```

- [ ] **Step 3: 문제 목록 스켈레톤 카드 교체 (line 141)**

`src/pages/Questions.tsx` 141번 줄:

```tsx
// Before
<div key={i} className="card-base h-24 animate-pulse bg-border" />

// After
<div key={i} className="bg-surface-card border border-border rounded-2xl p-4 h-24 animate-pulse bg-border" />
```

- [ ] **Step 4: 문제 카드 교체 (line 150)**

`src/pages/Questions.tsx` 150번 줄:

```tsx
// Before
className="card-base shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200"

// After
className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200"
```

- [ ] **Step 5: 개발 서버에서 시각적 확인**

```bash
npm run dev
```

확인 항목:
- `/questions` 접속 → 토픽 카드 그리드 렌더링 확인 (흰색 카드, 회색 테두리, 호버 시 인디고 테두리)
- 토픽 선택 후 문제 목록 확인 (카드 레이아웃, 스켈레톤 로딩)
- 모바일 뷰포트 (375px)에서 패딩 확인

- [ ] **Step 6: 커밋**

```bash
git add src/pages/Questions.tsx
git commit -m "refactor: card-base → Tailwind 유틸리티 교체 (Questions.tsx 4곳) #183"
```

---

## Task 2: `filter-dropdown` → Tailwind 유틸리티 교체 + CSS 삭제

**Files:**
- Modify: `src/pages/Questions.tsx` (line 100)
- Modify: `src/styles/components.css` (line 249–274 삭제)

### 배경

`filter-dropdown` / `filter-dropdown--active`는 `Questions.tsx`에서만 사용된다.

**기존 CSS 정의:**
```css
/* components.css line 249–274 */
.filter-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--color-text-primary);
  background-color: var(--color-surface-card);
  cursor: pointer;
  transition: all 250ms var(--ease-smooth);
}
.filter-dropdown:hover {
  border-color: var(--color-text-caption);
  transform: translateY(-1px);
}
.filter-dropdown--active {
  border-color: var(--color-brand);
  background-color: var(--color-brand-light);
}
```

**Tailwind 대응:**
- 기본 상태: `inline-flex items-center gap-1.5 h-10 px-4 border border-border rounded-full text-sm bg-surface-card cursor-pointer transition-all duration-[250ms] hover:border-text-caption hover:-translate-y-px`
- 활성 상태 (조건부): `border-brand bg-brand-light`

---

- [ ] **Step 1: 필터 버튼 클래스 교체 (line 100)**

`src/pages/Questions.tsx` 100번 줄:

```tsx
// Before
className={`filter-dropdown ${difficulty ? "filter-dropdown--active" : ""}`}

// After
className={`inline-flex items-center gap-1.5 h-10 px-4 border border-border rounded-full text-sm bg-surface-card cursor-pointer transition-all duration-[250ms] hover:border-text-caption hover:-translate-y-px ${difficulty ? "border-brand bg-brand-light" : ""}`}
```

- [ ] **Step 2: components.css에서 filter-dropdown 3블록 삭제**

`src/styles/components.css`에서 아래 블록 전체 삭제 (약 line 249–274):

```css
/* 삭제할 코드 */
/* ── 11. Filter Dropdown ── */
.filter-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--color-text-primary);
  background-color: var(--color-surface-card);
  cursor: pointer;
  transition: all 250ms var(--ease-smooth);
}

.filter-dropdown:hover {
  border-color: var(--color-text-caption);
  transform: translateY(-1px);
}

.filter-dropdown--active {
  border-color: var(--color-brand);
  background-color: var(--color-brand-light);
}
```

- [ ] **Step 3: 개발 서버에서 시각적 확인**

```bash
npm run dev
```

확인 항목:
- 토픽 선택 후 필터 바 확인 → "난이도" 버튼이 pill 형태로 렌더링
- 난이도 선택 시 버튼 활성 상태 (인디고 테두리 + 연보라 배경) 확인
- 드롭다운 열기/닫기 동작 확인
- 호버 시 테두리 색상 변화 + translateY 확인

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 오류 없음. `filter-dropdown` 클래스 미사용으로 인한 경고 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/pages/Questions.tsx src/styles/components.css
git commit -m "refactor: filter-dropdown → Tailwind 유틸리티 교체 + CSS 삭제 (Questions.tsx) #183"
```
