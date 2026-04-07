# Design System V2 — Prompt0 기반 재구축 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 DesignColor.md 기반 디자인 시스템을 Prompt0_DesignSystem.md 스펙으로 전면 교체한다. 색상, 타이포그래피, 컴포넌트 스타일, 반응형 네비게이션을 새 스펙에 맞춘다.

**Architecture:** daisyUI 테마 색상을 Prompt0 스펙(#4F46E5 primary, #FAFAFA bg, #E5E7EB border)으로 재정의하고, Tailwind @theme 토큰을 전면 교체한다. Manrope 폰트를 제거하고 Pretendard 단일 UI 폰트로 통일한다. 반응형 네비게이션(Desktop 사이드바 + Mobile 하단탭)을 새로 구현한다.

**Tech Stack:** Tailwind CSS 4 + daisyUI 5, Pretendard + JetBrains Mono, React Router DOM

---

## 변경 요약 (현재 → Prompt0)

| 항목 | 현재 | Prompt0 | 영향 파일 |
|------|------|---------|-----------|
| Primary | #3525cd | #4F46E5 | theme.css, tokens.css, design.ts |
| Background | #f9f9f9 | #FAFAFA | theme.css, tokens.css, design.ts |
| Border 방식 | ghost-border 15% | 명시적 #E5E7EB | tokens.css, components.css |
| UI 폰트 | Manrope + Pretendard | Pretendard 단일 | index.html, tokens.css, typography.css |
| Font Scale | rem 기반 6단계 | px 기반 (28/22/16/14/12) | typography.css |
| 신규 토큰 | — | accent-light, accent-medium, semantic-light 변형 | tokens.css, design.ts |
| 컴포넌트 | 기본 5종 | 12종 (badge, radio, filter dropdown 등 추가) | components.css |
| Navigation | Mobile 하단탭만 | Desktop 사이드바 + Mobile 하단탭 | BottomTabLayout.tsx → AppLayout.tsx |
| Glassmorphism | 있음 | 제거 | components.css |

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `index.html` | Manrope 폰트 링크 제거 |
| Rewrite | `src/styles/theme.css` | daisyUI 테마 색상을 Prompt0 스펙으로 교체 |
| Rewrite | `src/styles/tokens.css` | Tailwind @theme 토큰 전면 교체 |
| Rewrite | `src/styles/typography.css` | Pretendard 단일 폰트, px 기반 스케일로 교체 |
| Rewrite | `src/styles/components.css` | 12종 컴포넌트 스타일 재정의 |
| Rewrite | `src/constants/design.ts` | TS 상수 Prompt0 스펙에 맞춰 교체 |
| Delete+Create | `src/components/BottomTabLayout.tsx` → `src/components/AppLayout.tsx` | 반응형 네비게이션 (사이드바+탭바) |
| Modify | `src/App.tsx` | AppLayout 적용 |
| Modify | `src/pages/Home.tsx` | 검증 페이지를 새 토큰으로 갱신 |

---

### Task 1: 폰트 정리 및 index.html 수정

**Files:**
- Modify: `index.html:7-9`

- [ ] **Step 1: Manrope 폰트 제거**

index.html의 Google Fonts 링크에서 Manrope를 제거한다. JetBrains Mono만 남긴다.

변경 전:
```html
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&family=Manrope:wght@600;700&display=swap"
  rel="stylesheet"
/>
```

변경 후:
```html
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: Manrope 폰트 제거, Pretendard 단일 UI 폰트로 통일 #9"
```

---

### Task 2: daisyUI 테마 색상 교체

**Files:**
- Rewrite: `src/styles/theme.css`

- [ ] **Step 1: theme.css 전체 교체**

```css
@plugin "daisyui/theme" {
  name: "passql";
  default: true;
  prefersdark: false;
  color-scheme: light;

  /* Surface */
  --color-base-100: oklch(98.2% 0 0);       /* #FAFAFA - page background */
  --color-base-200: oklch(96.2% 0.001 247);  /* #F3F4F6 - code bg */
  --color-base-300: oklch(92.1% 0.003 247);  /* #E5E7EB - borders */
  --color-base-content: oklch(17.1% 0.02 256); /* #111827 - primary text */

  /* Primary: Deep Indigo */
  --color-primary: oklch(50.6% 0.23 277);    /* #4F46E5 */
  --color-primary-content: oklch(100% 0 0);  /* #FFFFFF */

  /* Secondary */
  --color-secondary: oklch(65.1% 0.18 277);  /* #818CF8 - accent medium */
  --color-secondary-content: oklch(100% 0 0);

  /* Accent */
  --color-accent: oklch(95.4% 0.03 277);     /* #EEF2FF - accent light */
  --color-accent-content: oklch(50.6% 0.23 277); /* #4F46E5 */

  /* Neutral */
  --color-neutral: oklch(24.7% 0.02 256);    /* #1F2937 - toast bg */
  --color-neutral-content: oklch(100% 0 0);

  /* Semantic */
  --color-info: oklch(62.3% 0.18 249);
  --color-info-content: oklch(100% 0 0);
  --color-success: oklch(62.7% 0.19 145);    /* #22C55E */
  --color-success-content: oklch(100% 0 0);
  --color-warning: oklch(79.5% 0.18 86);     /* #F59E0B */
  --color-warning-content: oklch(17.1% 0.02 256);
  --color-error: oklch(57.7% 0.24 27);       /* #EF4444 */
  --color-error-content: oklch(100% 0 0);

  /* Geometry */
  --radius-selector: 999px;
  --radius-field: 0.5rem;   /* 8px - buttons */
  --radius-box: 0.75rem;    /* 12px - cards */

  --size-selector: 0.25rem;
  --size-field: 0.25rem;

  --border: 1px;
  --depth: 0;
  --noise: 0;
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css
git commit -m "refactor: daisyUI 테마를 Prompt0 스펙으로 교체 (#4F46E5 primary, #FAFAFA bg, #E5E7EB border) #9"
```

---

### Task 3: Tailwind 디자인 토큰 교체

**Files:**
- Rewrite: `src/styles/tokens.css`

- [ ] **Step 1: tokens.css 전체 교체**

```css
@theme {
  /* ── Fonts ── */
  --font-ui: "Pretendard Variable", "Pretendard", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* ── Page & Surface ── */
  --color-surface: #FAFAFA;
  --color-surface-card: #FFFFFF;
  --color-surface-code: #F3F4F6;
  --color-surface-zebra: #FAFAFA;

  /* ── Brand ── */
  --color-brand: #4F46E5;
  --color-brand-light: #EEF2FF;
  --color-brand-medium: #818CF8;

  /* ── Text ── */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-text-caption: #9CA3AF;

  /* ── Border ── */
  --color-border: #E5E7EB;
  --color-border-muted: #D1D5DB;

  /* ── Semantic ── */
  --color-sem-success: #22C55E;
  --color-sem-success-light: #F0FDF4;
  --color-sem-success-text: #16A34A;
  --color-sem-error: #EF4444;
  --color-sem-error-light: #FEF2F2;
  --color-sem-error-text: #DC2626;
  --color-sem-warning: #F59E0B;
  --color-sem-warning-light: #FEF3C7;
  --color-sem-warning-text: #D97706;

  /* ── Toast ── */
  --color-toast-bg: #1F2937;

  /* ── Heatmap (5 levels) ── */
  --color-heat-0: #F5F5F5;
  --color-heat-1: #EEF2FF;
  --color-heat-2: #C7D2FE;
  --color-heat-3: #818CF8;
  --color-heat-4: #4F46E5;

  /* ── Spacing ── */
  --spacing-section: 1.5rem;  /* 24px between sections */
  --spacing-module: 2rem;     /* 32px generous margins */

  /* ── Transitions ── */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "refactor: Tailwind 토큰을 Prompt0 스펙으로 교체 (hex 직접 사용, semantic-light, heatmap) #9"
```

---

### Task 4: 타이포그래피 교체

**Files:**
- Rewrite: `src/styles/typography.css`

- [ ] **Step 1: typography.css 전체 교체**

Pretendard 단일 폰트, px 기반 스케일, Prompt0 line-height 적용.

```css
/* Prompt0 Typography: Pretendard (UI) + JetBrains Mono (code only) */

.text-h1 {
  font-family: var(--font-ui);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.text-h2 {
  font-family: var(--font-ui);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.text-body {
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.text-secondary {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.text-caption {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-text-caption);
}

.text-code {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/styles/typography.css
git commit -m "refactor: 타이포그래피를 Prompt0 스펙으로 교체 (Pretendard 단일, px 스케일) #9"
```

---

### Task 5: 컴포넌트 스타일 교체 (12종)

**Files:**
- Rewrite: `src/styles/components.css`

- [ ] **Step 1: components.css 전체 교체**

Prompt0의 12종 컴포넌트를 모두 정의한다. glassmorphism 제거.

```css
/* ── 1. Card ── */
.card-base {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}

/* ── 2. Navigation (Mobile Bottom Tab) ── */
.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: color 200ms var(--ease-smooth);
}

.nav-tab--active {
  color: var(--color-brand);
}

.nav-tab--inactive {
  color: var(--color-text-caption);
}

/* ── 2b. Navigation (Desktop Sidebar) ── */
.nav-sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 200ms var(--ease-smooth);
  cursor: pointer;
}

.nav-sidebar-item:hover {
  background-color: var(--color-surface);
}

.nav-sidebar-item--active {
  background-color: var(--color-brand-light);
  color: var(--color-brand);
}

/* ── 3. Badge ── */
.badge-topic {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background-color: var(--color-brand-light);
  color: var(--color-brand);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  height: 24px;
}

/* ── 4. Button ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  background-color: var(--color-brand);
  color: white;
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 200ms var(--ease-smooth);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  background-color: var(--color-border);
  color: var(--color-text-caption);
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 24px;
  background-color: var(--color-surface-card);
  color: var(--color-brand);
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 600;
  border: 1px solid var(--color-brand);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 200ms var(--ease-smooth);
}

.btn-secondary:hover {
  background-color: var(--color-brand-light);
}

.btn-compact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  background-color: transparent;
  color: var(--color-brand);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--color-brand);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 200ms var(--ease-smooth);
}

.btn-compact:hover {
  background-color: var(--color-brand-light);
}

/* ── 5. Code Block ── */
.code-block {
  background-color: var(--color-surface-code);
  border-left: 4px solid var(--color-brand);
  border-radius: 8px;
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  color: var(--color-text-primary);
}

/* ── 6. Data Table ── */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 8px 12px;
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.data-table td {
  padding: 8px 12px;
  height: 36px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.data-table tr:nth-child(even) {
  background-color: var(--color-surface-zebra);
}

/* ── 7. Error Card ── */
.error-card {
  background-color: var(--color-sem-error-light);
  border-left: 4px solid var(--color-sem-error);
  border-radius: 8px;
  padding: 16px;
}

/* ── 8. Success Card ── */
.success-card {
  background-color: var(--color-sem-success-light);
  border-left: 4px solid var(--color-sem-success);
  border-radius: 8px;
  padding: 16px;
}

/* ── 9. Toast ── */
.toast-passql {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-toast-bg);
  color: white;
  border-radius: 8px;
  padding: 12px 20px;
  font-family: var(--font-ui);
  font-size: 14px;
  z-index: 50;
}

/* ── 10. Bottom Sheet / Dialog ── */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(17, 24, 39, 0.5);
  z-index: 40;
}

.dialog-sheet {
  background-color: var(--color-surface-card);
  border-radius: 16px 16px 0 0;
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px;
}

.dialog-sheet .drag-handle {
  width: 40px;
  height: 4px;
  background-color: var(--color-border-muted);
  border-radius: 2px;
  margin: 0 auto 12px;
}

@media (min-width: 768px) {
  .dialog-sheet {
    border-radius: 16px;
    max-width: 520px;
    margin: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

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
  transition: all 200ms var(--ease-smooth);
}

.filter-dropdown:hover {
  border-color: var(--color-text-caption);
}

.filter-dropdown--active {
  border-color: var(--color-brand);
  background-color: var(--color-brand-light);
}

/* ── 12. Radio Button ── */
.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-muted);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 200ms var(--ease-smooth);
}

.radio-custom--selected {
  border-color: var(--color-brand);
  background-color: var(--color-brand);
}

.radio-custom--selected::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
}

/* ── Global body ── */
body {
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/styles/components.css
git commit -m "refactor: 컴포넌트 스타일 12종 Prompt0 스펙으로 재정의 #9"
```

---

### Task 6: TypeScript 디자인 상수 교체

**Files:**
- Rewrite: `src/constants/design.ts`

- [ ] **Step 1: design.ts 전체 교체**

```typescript
/** Page & Surface */
export const SURFACE = {
  page: "#FAFAFA",
  card: "#FFFFFF",
  code: "#F3F4F6",
  zebra: "#FAFAFA",
} as const;

/** Brand Colors */
export const BRAND = {
  primary: "#4F46E5",
  light: "#EEF2FF",
  medium: "#818CF8",
} as const;

/** Text Colors */
export const TEXT = {
  primary: "#111827",
  secondary: "#6B7280",
  caption: "#9CA3AF",
} as const;

/** Border Colors */
export const BORDER = {
  default: "#E5E7EB",
  muted: "#D1D5DB",
} as const;

/** Semantic Colors */
export const SEMANTIC = {
  success: "#22C55E",
  successLight: "#F0FDF4",
  successText: "#16A34A",
  error: "#EF4444",
  errorLight: "#FEF2F2",
  errorText: "#DC2626",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningText: "#D97706",
} as const;

/** Toast / Dark UI */
export const DARK_UI = {
  toast: "#1F2937",
  overlay: "rgba(17, 24, 39, 0.5)",
} as const;

/** Heatmap 5 levels (0-30%, 31-50%, 51-70%, 71-85%, 86-100%) */
export const HEATMAP = {
  level0: "#F5F5F5",
  level1: "#EEF2FF",
  level2: "#C7D2FE",
  level3: "#818CF8",
  level4: "#4F46E5",
} as const;

/** Typography Font Families */
export const FONT_FAMILY = {
  ui: "'Pretendard Variable', 'Pretendard', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Border Radius (px) */
export const RADIUS = {
  card: 12,
  button: 8,
  code: 8,
  pill: 999,
} as const;
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/constants/design.ts
git commit -m "refactor: TS 디자인 상수 Prompt0 스펙으로 교체 #9"
```

---

### Task 7: 반응형 네비게이션 (AppLayout)

**Files:**
- Create: `src/components/AppLayout.tsx`
- Delete: `src/components/BottomTabLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/components/AppLayout.tsx` 작성**

Desktop(1024px+): 좌측 사이드바 (56px collapsed / 220px expanded) + 중앙 콘텐츠 max-width 720px
Mobile: 하단 탭바 56px, 4탭 (홈/문제/통계/설정)

```tsx
import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "홈", icon: "🏠" },
  { to: "/questions", label: "문제", icon: "📝" },
  { to: "/stats", label: "통계", icon: "📊" },
  { to: "/settings", label: "설정", icon: "⚙️" },
] as const;

function SidebarNav() {
  return (
    <aside className="hidden lg:flex flex-col w-[220px] border-r border-border bg-surface-card h-screen sticky top-0 py-6 px-3 gap-1">
      <div className="text-h2 px-4 mb-8 text-brand">passQL</div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `nav-sidebar-item ${isActive ? "nav-sidebar-item--active" : ""}`
          }
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}

function BottomTabNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-surface-card border-t border-border flex items-center justify-around z-30">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `nav-tab ${isActive ? "nav-tab--active" : "nav-tab--inactive"}`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <SidebarNav />
      <main className="flex-1 lg:py-8 pb-16 lg:pb-8">
        <div className="mx-auto max-w-[720px] px-4 lg:px-0">
          <Outlet />
        </div>
      </main>
      <BottomTabNav />
    </div>
  );
}
```

- [ ] **Step 2: `src/App.tsx` 수정**

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "questions", element: <Questions /> },
      { path: "questions/:id", element: <QuestionDetail /> },
      { path: "stats", element: <Stats /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: BottomTabLayout.tsx 삭제**

```bash
rm src/components/BottomTabLayout.tsx
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/AppLayout.tsx src/App.tsx
git rm src/components/BottomTabLayout.tsx
git commit -m "feat: 반응형 네비게이션 (Desktop 사이드바 + Mobile 하단탭) #9"
```

---

### Task 8: 검증 페이지 갱신

**Files:**
- Rewrite: `src/pages/Home.tsx`

- [ ] **Step 1: Home.tsx를 새 토큰/컴포넌트로 갱신**

```tsx
export default function Home() {
  return (
    <div className="py-6 space-y-6">
      {/* Typography */}
      <h1 className="text-h1">passQL</h1>
      <h2 className="text-h2 mt-4">SQL 자격증 학습</h2>
      <p className="text-body">논리적 사고로 SQL을 마스터하세요.</p>
      <span className="text-caption block">난이도: 중급</span>

      {/* Card */}
      <div className="card-base">
        <h3 className="text-h2">Card Component</h3>
        <p className="text-secondary mt-2">12px radius, 1px #E5E7EB border, white bg</p>
      </div>

      {/* Code Block */}
      <pre className="code-block">
        <code>{"SELECT c.name, COUNT(*) AS cnt\nFROM CUSTOMER c\nJOIN ORDERS o ON c.id = o.customer_id\nGROUP BY c.name;"}</code>
      </pre>

      {/* Badges */}
      <div className="flex gap-2">
        <span className="badge-topic">JOIN</span>
        <span className="badge-topic">GROUP BY</span>
        <span className="badge-topic">서브쿼리</span>
      </div>

      {/* Semantic Cards */}
      <div className="space-y-3">
        <div className="success-card">
          <span className="text-secondary" style={{ color: "var(--color-sem-success-text)" }}>✓ 3행 · 34ms</span>
        </div>
        <div className="error-card">
          <span className="text-code font-bold" style={{ color: "var(--color-sem-error)" }}>⚠ SQL_SYNTAX</span>
          <p className="text-secondary mt-1">Unknown column 'o.cust_id' in 'on clause'</p>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3">
        <button className="filter-dropdown filter-dropdown--active" type="button">토픽 ▼</button>
        <button className="filter-dropdown" type="button">난이도 ▼</button>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button className="btn-primary" type="button">제출하기</button>
        <button className="btn-secondary" type="button">다음 문제</button>
        <button className="btn-compact" type="button">실행</button>
        <button className="btn-primary" type="button" disabled>비활성</button>
      </div>

      {/* Radio */}
      <div className="flex gap-4 items-center">
        <div className="radio-custom radio-custom--selected" />
        <span className="text-body">선택됨</span>
        <div className="radio-custom" />
        <span className="text-body">미선택</span>
      </div>

      {/* Toast Preview */}
      <div className="relative">
        <div className="toast-passql static transform-none inline-block">답안이 저장되었습니다.</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "refactor: 검증 페이지를 Prompt0 디자인 시스템으로 갱신 #9"
```
