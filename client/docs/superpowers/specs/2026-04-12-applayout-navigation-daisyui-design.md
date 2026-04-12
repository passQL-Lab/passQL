# AppLayout 네비게이션 daisyUI 클래스 적용 설계 문서

- **이슈**: #179
- **브랜치**: `20260412_#179_AppLayout_네비게이션_daisyUI_클래스_적용`
- **작성일**: 2026-04-12

---

## 목표

`AppLayout.tsx`의 네비게이션 컴포넌트에서 커스텀 CSS 클래스(`nav-tab*`, `nav-sidebar-item*`)를 제거하고 daisyUI 5 표준 컴포넌트 클래스로 교체한다. 시각적 결과는 현재와 동일하게 유지한다.

---

## 변경 범위

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/AppLayout.tsx` | nav-tab* → dock/dock-label/active, nav-sidebar-item* → menu/active |
| `src/styles/components.css` | nav-tab*, nav-sidebar-item* 커스텀 클래스 제거 |

### 변경 없는 것

- lucide-react 아이콘 (`Home`, `Sparkles`, `BarChart3`, `Settings`) — 그대로 유지
- `NAV_ITEMS` 배열 — 변경 없음
- `AppLayout` 최상위 구조 — 변경 없음
- `MobileHeader`, `TeamModal` — 변경 없음
- 브랜드 인디고 색상(`#4F46E5`) — `primary` 토큰으로 유지

---

## 설계

### 1. BottomTabNav — daisyUI `dock`

**현재 구조:**
```tsx
<nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-surface-card border-t border-border flex items-center justify-around z-30">
  <NavLink className={({ isActive }) =>
    `nav-tab ${isActive ? "nav-tab--active" : "nav-tab--inactive"}`
  }>
    <item.icon size={20} />
    <span>{item.label}</span>
  </NavLink>
</nav>
```

**변경 후 구조:**
```tsx
<nav className="dock lg:hidden h-14 bg-base-100 border-t border-base-300 z-30">
  <NavLink className={({ isActive }) =>
    isActive ? "active text-primary" : "text-base-content/40"
  }>
    <item.icon size={20} />
    <span className="dock-label">{item.label}</span>
  </NavLink>
</nav>
```

**daisyUI dock 적용 규칙:**
- `<nav>` → `dock` 클래스 추가 (fixed bottom, flex, items-center 처리)
- `lg:hidden`, `h-14`, `border-t`, `z-30`은 Tailwind 유틸리티로 유지
- 활성 아이템 → `active` + `text-primary` (인디고 색상)
- 비활성 아이템 → `text-base-content/40` (회색)
- 텍스트 라벨 → `dock-label` 클래스

### 2. SidebarNav — daisyUI `menu`

**현재 구조:**
```tsx
<aside className="hidden lg:flex flex-col w-55 border-r border-border bg-surface-card h-screen sticky top-0 py-6 px-3 gap-1">
  <NavLink className={({ isActive }) =>
    `nav-sidebar-item ${isActive ? "nav-sidebar-item--active" : ""}`
  }>
    <item.icon size={20} />
    <span>{item.label}</span>
  </NavLink>
</aside>
```

**변경 후 구조:**
```tsx
<aside className="hidden lg:flex flex-col w-55 border-r border-base-300 bg-base-100 h-screen sticky top-0 py-6 px-3">
  <ul className="menu gap-1 p-0">
    <li>
      <NavLink className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${isActive ? "bg-accent text-accent-content" : "text-base-content/60 hover:bg-base-200"}`
      }>
        <item.icon size={20} />
        <span>{item.label}</span>
      </NavLink>
    </li>
  </ul>
</aside>
```

**daisyUI menu 적용 규칙:**
- `<ul className="menu">` 래퍼 추가, `p-0 gap-1`로 기존 간격 유지
- 각 `NavLink`는 `<li>` 안에 배치
- 활성 아이템 → `bg-accent text-accent-content` (EEF2FF 배경, 인디고 텍스트)
- 비활성 아이템 → `text-base-content/60 hover:bg-base-200` (회색 텍스트, hover 배경)
- `aside`의 `gap-1`은 `menu`의 `gap-1`로 이동

### 3. components.css 정리

제거 대상 블록:

```css
/* 제거: ── 2. Navigation (Mobile Bottom Tab) ── */
.nav-tab { ... }
.nav-tab--active { ... }
.nav-tab--inactive { ... }

/* 제거: ── 2b. Navigation (Desktop Sidebar) ── */
.nav-sidebar-item { ... }
.nav-sidebar-item:hover { ... }
.nav-sidebar-item--active { ... }
```

---

## daisyUI 토큰 매핑

| 현재 커스텀 변수 | daisyUI 토큰 | 색상값 |
|-----------------|-------------|--------|
| `--color-brand` | `primary` | `#4F46E5` |
| `--color-brand-light` | `accent` | `#EEF2FF` |
| `--color-text-secondary` | `base-content/60` | `#6B7280` |
| `--color-text-caption` | `base-content/40` | `#9CA3AF` |
| `--color-surface` | `base-200` | `#FAFAFA` |
| `--color-surface-card` | `base-100` | `#FFFFFF` |
| `--color-border` | `base-300` | `#E5E7EB` |

---

## 제약 조건

- 아이콘 변경 금지 — lucide-react 아이콘 그대로 유지
- 시각적 회귀 없어야 함 — 높이(56px), 색상, 패딩 동일 유지
- `style={{ }}` 인라인 스타일 사용 금지
- daisyUI dock의 기본 `fixed bottom-0` 포지셔닝 활용 (중복 제거)
