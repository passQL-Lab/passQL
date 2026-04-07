# passQL Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DesignColor.md 문서를 기반으로 daisyUI 5 커스텀 테마, Tailwind CSS 4 디자인 토큰, 타이포그래피, 컴포넌트 상수를 구축한다.

**Architecture:** daisyUI 5의 `@plugin "daisyui/theme"` 으로 커스텀 테마를 정의하고, Tailwind CSS 4의 `@theme` 디렉티브로 프로젝트 전용 디자인 토큰(색상, 폰트, 간격, 그림자 등)을 등록한다. 상수는 `src/styles/` 디렉토리에 CSS 파일로 분리하고, TypeScript 상수는 `src/constants/design.ts`에 정의한다.

**Tech Stack:** Tailwind CSS 4 + daisyUI 5, CSS `@theme` directive, oklch color format, Google Fonts (Manrope, Pretendard, JetBrains Mono)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/styles/theme.css` | daisyUI 커스텀 테마 (passql-light) 정의 |
| Create | `src/styles/tokens.css` | Tailwind `@theme` 디자인 토큰 (색상, 폰트, 간격, 그림자, radius) |
| Create | `src/styles/typography.css` | 타이포그래피 유틸리티 클래스 |
| Create | `src/styles/components.css` | 커스텀 컴포넌트 스타일 (code-block, data-table, semantic-card, toast) |
| Create | `src/constants/design.ts` | TypeScript 디자인 상수 (색상 hex, 사이즈 등 JS에서 참조할 값) |
| Modify | `src/index.css` | 위 CSS 파일들을 import하는 엔트리 |
| Modify | `index.html` | Google Fonts preconnect 및 font link 추가 |

---

### Task 1: Google Fonts 연결 및 index.html 설정

**Files:**
- Modify: `index.html:3-8`

- [ ] **Step 1: index.html에 Google Fonts preconnect 및 font 링크 추가**

`<head>` 안에 다음을 추가한다:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&family=Manrope:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

Pretendard는 CDN으로 별도 추가:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>
```

- [ ] **Step 2: 브라우저에서 확인**

Run: `npm run dev`

브라우저 DevTools > Network 탭에서 폰트 4종(Manrope 600/700, JetBrains Mono 400, Pretendard)이 로드되는지 확인한다.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: Google Fonts 및 Pretendard CDN 연결"
```

---

### Task 2: daisyUI 커스텀 테마 정의

**Files:**
- Create: `src/styles/theme.css`
- Modify: `src/index.css`

- [ ] **Step 1: `src/styles/theme.css` 작성**

DesignColor.md의 Surface Hierarchy, Indigo Pulse, Semantic Colors를 daisyUI 5 테마 변수로 매핑한다.

```css
@plugin "daisyui/theme" {
  name: "passql";
  default: true;
  prefersdark: false;
  color-scheme: light;

  /* Surface Hierarchy (Paper-on-Desk) */
  --color-base-100: oklch(97.8% 0 0);       /* #f9f9f9 - Base Layer */
  --color-base-200: oklch(95.7% 0 0);       /* #f3f3f3 - surface-container-low */
  --color-base-300: oklch(92.2% 0 0);       /* #e8e8e8 - surface-container-high */
  --color-base-content: oklch(17.1% 0.02 256); /* #111827 - primary-text */

  /* The Indigo Pulse */
  --color-primary: oklch(44.9% 0.26 277);   /* #3525cd */
  --color-primary-content: oklch(100% 0 0);  /* #ffffff */

  /* Secondary (Indigo variant) */
  --color-secondary: oklch(50.6% 0.23 277);  /* #4f46e5 - primary-container */
  --color-secondary-content: oklch(100% 0 0);

  /* Accent */
  --color-accent: oklch(50.6% 0.23 277);
  --color-accent-content: oklch(100% 0 0);

  /* Neutral */
  --color-neutral: oklch(24.7% 0.02 256);   /* #1f2937 - toast bg */
  --color-neutral-content: oklch(100% 0 0);

  /* Semantic */
  --color-info: oklch(62.3% 0.18 249);
  --color-info-content: oklch(100% 0 0);
  --color-success: oklch(62.7% 0.19 145);   /* #22c55e */
  --color-success-content: oklch(100% 0 0);
  --color-warning: oklch(79.5% 0.18 86);
  --color-warning-content: oklch(17.1% 0.02 256);
  --color-error: oklch(57.7% 0.24 27);      /* #ef4444 */
  --color-error-content: oklch(100% 0 0);

  /* Geometry: soft-geometric (12px system standard) */
  --radius-selector: 1rem;
  --radius-field: 0.75rem;
  --radius-box: 0.75rem;

  --size-selector: 0.25rem;
  --size-field: 0.25rem;

  /* No-Line Rule: minimal borders */
  --border: 1px;

  /* Tonal Lift: no heavy shadows */
  --depth: 0;
  --noise: 0;
}
```

- [ ] **Step 2: `src/index.css`를 수정하여 theme.css를 import**

`src/index.css` 전체를 다음으로 교체:

```css
@import "tailwindcss";
@import "./styles/theme.css";
```

기존 `@plugin "daisyui"` 블록은 제거한다. 테마 파일 안에서 `@plugin "daisyui/theme"`을 사용하므로 별도 `@plugin "daisyui"`도 필요하다. 최종:

```css
@import "tailwindcss";
@plugin "daisyui";
@import "./styles/theme.css";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

에러 없이 빌드되는지 확인한다.

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css src/index.css
git commit -m "feat: daisyUI passql 커스텀 테마 정의"
```

---

### Task 3: Tailwind 디자인 토큰 등록

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css:3` (import 추가)

- [ ] **Step 1: `src/styles/tokens.css` 작성**

Tailwind CSS 4 `@theme` 디렉티브로 프로젝트 전용 토큰을 정의한다.

```css
@theme {
  /* ── Fonts ── */
  --font-display: "Manrope", sans-serif;
  --font-body: "Pretendard Variable", "Pretendard", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* ── Surface Colors (Tailwind utilities: bg-surface, bg-surface-card, etc.) ── */
  --color-surface: oklch(97.8% 0 0);            /* #f9f9f9 */
  --color-surface-card: oklch(100% 0 0);         /* #ffffff */
  --color-surface-muted: oklch(95.7% 0 0);       /* #f3f3f3 */
  --color-surface-active: oklch(92.2% 0 0);      /* #e8e8e8 */

  /* ── Text Colors ── */
  --color-text-primary: oklch(17.1% 0.02 256);   /* #111827 */
  --color-text-secondary: oklch(40% 0.02 256);
  --color-text-muted: oklch(55% 0.01 256);

  /* ── Indigo Palette ── */
  --color-indigo: oklch(44.9% 0.26 277);         /* #3525cd */
  --color-indigo-light: oklch(50.6% 0.23 277);   /* #4f46e5 */

  /* ── Semantic ── */
  --color-sem-success: oklch(62.7% 0.19 145);    /* #22c55e */
  --color-sem-error: oklch(57.7% 0.24 27);       /* #ef4444 */

  /* ── Code Block ── */
  --color-code-bg: oklch(96.7% 0.003 250);       /* #f3f4f6 */

  /* ── Ghost Border (15% opacity outline-variant) ── */
  --color-ghost-border: oklch(70% 0 0 / 15%);

  /* ── Toast ── */
  --color-toast-bg: oklch(24.7% 0.02 256);       /* #1f2937 */

  /* ── Ambient Shadow (Tonal Lift) ── */
  --shadow-ambient: 0 12px 40px oklch(17.1% 0.02 256 / 6%);

  /* ── Spacing (generous margins) ── */
  --spacing-module: 2rem;   /* 32px between content modules */

  /* ── Transitions ── */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 2: `src/index.css`에 import 추가**

```css
@import "tailwindcss";
@plugin "daisyui";
@import "./styles/theme.css";
@import "./styles/tokens.css";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

에러 없이 빌드되는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/index.css
git commit -m "feat: Tailwind @theme 디자인 토큰 등록"
```

---

### Task 4: 타이포그래피 유틸리티 클래스

**Files:**
- Create: `src/styles/typography.css`
- Modify: `src/index.css` (import 추가)

- [ ] **Step 1: `src/styles/typography.css` 작성**

DesignColor.md의 Typography 표를 CSS 유틸리티 클래스로 변환한다.

```css
/* DesignColor.md Typography System */

.text-display-md {
  font-family: var(--font-display);
  font-size: 2.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.text-headline-sm {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.text-title-md {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.4;
}

.text-body-lg {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.6;
}

.text-label-md {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.5;
}

.text-code-sm {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.6;
}
```

- [ ] **Step 2: `src/index.css`에 import 추가**

```css
@import "tailwindcss";
@plugin "daisyui";
@import "./styles/theme.css";
@import "./styles/tokens.css";
@import "./styles/typography.css";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/styles/typography.css src/index.css
git commit -m "feat: 타이포그래피 유틸리티 클래스 정의"
```

---

### Task 5: 커스텀 컴포넌트 스타일

**Files:**
- Create: `src/styles/components.css`
- Modify: `src/index.css` (import 추가)

- [ ] **Step 1: `src/styles/components.css` 작성**

DesignColor.md의 Components 섹션을 CSS 클래스로 구현한다.

```css
/* ── SQL Code Block ── */
.sql-code-block {
  background-color: var(--color-code-bg);
  border-left: 4px solid var(--color-indigo-light);
  border-radius: var(--radius-box);
  padding: 1rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  color: var(--color-text-primary);
}

/* ── Data Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.875rem;
}

.data-table th {
  text-align: left;
  padding: 0.5rem 1rem;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}

.data-table td {
  padding: 0.5rem 1rem;
  height: 36px;
  font-variant-numeric: tabular-nums;
}

.data-table tr:nth-child(even) {
  background-color: var(--color-surface-muted);
}

/* ── Semantic Card (Success/Error left border) ── */
.semantic-card {
  background-color: var(--color-surface-card);
  border-radius: var(--radius-box);
  padding: 1rem 1.25rem;
  border-left: 4px solid transparent;
}

.semantic-card--success {
  border-left-color: var(--color-sem-success);
}

.semantic-card--error {
  border-left-color: var(--color-sem-error);
}

/* ── Toast ── */
.toast-passql {
  background-color: var(--color-toast-bg);
  color: white;
  backdrop-filter: blur(12px);
  border-radius: var(--radius-field);
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  box-shadow: var(--shadow-ambient);
}

/* ── Pill Filter ── */
.pill-filter {
  border-radius: 999px;
  background-color: var(--color-surface-muted);
  color: var(--color-text-primary);
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 200ms var(--ease-smooth);
  cursor: pointer;
  border: none;
}

.pill-filter:hover {
  background-color: var(--color-surface-active);
}

.pill-filter--active {
  background-color: var(--color-indigo-light);
  color: white;
}

/* ── Ghost Border (inputs, code containers) ── */
.ghost-border {
  border: 1px solid var(--color-ghost-border);
}

/* ── Glassmorphism (mobile bottom sheet) ── */
.glass-surface {
  background-color: oklch(100% 0 0 / 80%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* ── Global body defaults ── */
body {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
}
```

- [ ] **Step 2: `src/index.css`에 import 추가**

```css
@import "tailwindcss";
@plugin "daisyui";
@import "./styles/theme.css";
@import "./styles/tokens.css";
@import "./styles/typography.css";
@import "./styles/components.css";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/styles/components.css src/index.css
git commit -m "feat: 커스텀 컴포넌트 스타일 (code-block, data-table, semantic-card, toast, pill)"
```

---

### Task 6: TypeScript 디자인 상수

**Files:**
- Create: `src/constants/design.ts`

- [ ] **Step 1: `src/constants/design.ts` 작성**

JS 런타임에서 참조해야 하는 디자인 값들을 상수로 정의한다 (차트 라이브러리, 인라인 스타일 등).

```typescript
/** Surface Hierarchy */
export const SURFACE = {
  base: "#f9f9f9",
  card: "#ffffff",
  muted: "#f3f3f3",
  active: "#e8e8e8",
} as const;

/** Primary Brand Colors */
export const BRAND = {
  indigo: "#3525cd",
  indigoLight: "#4f46e5",
} as const;

/** Text Colors */
export const TEXT = {
  primary: "#111827",
  secondary: "#6b7280",
  muted: "#9ca3af",
} as const;

/** Semantic Colors */
export const SEMANTIC = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

/** Toast / Dark UI */
export const DARK_UI = {
  toast: "#1f2937",
} as const;

/** Typography Font Families */
export const FONT_FAMILY = {
  display: "'Manrope', sans-serif",
  body: "'Pretendard Variable', 'Pretendard', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Border Radius (px) */
export const RADIUS = {
  box: 12,
  field: 12,
  pill: 999,
} as const;

/** Ambient Shadow */
export const SHADOW = {
  ambient: "0 12px 40px rgba(17, 24, 39, 0.06)",
} as const;
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/constants/design.ts
git commit -m "feat: TypeScript 디자인 상수 정의"
```

---

### Task 7: 통합 검증

**Files:**
- Modify: `src/pages/Home.tsx` (임시 검증용, 이후 페이지 구현 시 교체)

- [ ] **Step 1: Home.tsx에 디자인 시스템 검증 마크업 작성**

모든 토큰과 컴포넌트가 올바르게 렌더링되는지 확인하는 임시 페이지.

```tsx
export default function Home() {
  return (
    <div className="bg-surface min-h-screen p-8">
      {/* Typography */}
      <h1 className="text-display-md text-text-primary">passQL</h1>
      <h2 className="text-headline-sm text-text-primary mt-4">SQL 자격증 학습</h2>
      <p className="text-body-lg text-text-secondary mt-2">
        논리적 사고로 SQL을 마스터하세요.
      </p>
      <span className="text-label-md text-text-muted mt-2 block">난이도: 중급</span>

      {/* Surface Cards */}
      <div className="bg-surface-card rounded-box mt-8 p-6">
        <h3 className="text-title-md">Surface Card (#fff on #f9f9f9)</h3>
      </div>

      {/* Code Block */}
      <pre className="sql-code-block mt-8">
        <code>{"SELECT u.name, COUNT(*) AS total\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.name;"}</code>
      </pre>

      {/* Semantic Cards */}
      <div className="mt-8 space-y-3">
        <div className="semantic-card semantic-card--success">정답입니다!</div>
        <div className="semantic-card semantic-card--error">오답입니다. 다시 시도하세요.</div>
      </div>

      {/* Pill Filters */}
      <div className="mt-8 flex gap-2">
        <button className="pill-filter pill-filter--active" type="button">전체</button>
        <button className="pill-filter" type="button">SELECT</button>
        <button className="pill-filter" type="button">JOIN</button>
        <button className="pill-filter" type="button">서브쿼리</button>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-3">
        <button className="btn btn-primary h-11" type="button">제출하기</button>
        <button className="btn bg-surface-active text-text-primary font-mono h-8 min-h-8 text-sm" type="button">
          실행
        </button>
      </div>

      {/* Toast Preview */}
      <div className="toast-passql mt-8 inline-block">
        답안이 저장되었습니다.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 개발 서버에서 시각적 확인**

Run: `npm run dev`

확인 항목:
- Manrope: Display-MD, Headline-SM에 적용되는가
- Pretendard: Body, Title, Label에 적용되는가
- JetBrains Mono: code block에 적용되는가
- Surface 계층: #f9f9f9 위에 #ffffff 카드가 보이는가
- Indigo 버튼: #4f46e5 계열의 primary 버튼
- Semantic Card: 좌측 4px 보더 (초록/빨강)
- Pill Filter: 둥근 필터, active 상태 인디고 배경
- Toast: 다크 배경 + blur

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`

에러 없이 빌드 성공.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: 디자인 시스템 통합 검증 페이지"
```
