# AppLayout 네비게이션 daisyUI 클래스 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AppLayout.tsx의 커스텀 네비게이션 CSS 클래스를 daisyUI 5 표준 클래스로 교체하고, components.css의 관련 블록을 제거한다.

**Architecture:** BottomTabNav는 daisyUI `dock` 클래스를 적용하고, SidebarNav는 `menu` + `<li>` 구조로 전환한다. 시각적 결과는 현재와 동일하게 유지하며, 아이콘은 변경하지 않는다.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, daisyUI 5, lucide-react

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/components/AppLayout.tsx` | 수정 | BottomTabNav dock 전환, SidebarNav menu 전환 |
| `src/styles/components.css` | 수정 | nav-tab*, nav-sidebar-item* 블록 제거 |

---

### Task 1: BottomTabNav → daisyUI dock 전환

**Files:**
- Modify: `src/components/AppLayout.tsx` (BottomTabNav 함수, 47~65행)

- [ ] **Step 1: BottomTabNav 함수 교체**

`src/components/AppLayout.tsx`의 `BottomTabNav` 함수를 아래로 교체한다:

```tsx
function BottomTabNav() {
  return (
    // dock: daisyUI 하단 탭 컴포넌트 (fixed bottom-0, flex, items-center 내장)
    <nav className="dock lg:hidden h-14 bg-base-100 border-t border-base-300 z-30">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            // active 클래스: daisyUI dock 활성 상태 (primary 색상 적용)
            isActive ? "active text-primary" : "text-base-content/40"
          }
        >
          <item.icon size={20} />
          {/* dock-label: 아이콘 아래 텍스트 레이블 */}
          <span className="dock-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: 개발 서버에서 모바일 하단 탭 확인**

```bash
npm run dev
```

브라우저에서 모바일 뷰(≤1024px)로 확인:
- 하단 탭 4개 정상 표시 (홈, AI문제, 통계, 설정)
- 아이콘 변경 없음 (Home, Sparkles, ChartColumn, Settings)
- 활성 탭 인디고(`#4F46E5`) 색상 표시
- 비활성 탭 회색 표시
- 높이 56px 유지

- [ ] **Step 3: 커밋**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: BottomTabNav nav-tab → daisyUI dock 클래스 적용 #179"
```

---

### Task 2: SidebarNav → daisyUI menu 전환

**Files:**
- Modify: `src/components/AppLayout.tsx` (SidebarNav 함수, 20~45행)

- [ ] **Step 1: SidebarNav 함수 교체**

`src/components/AppLayout.tsx`의 `SidebarNav` 함수를 아래로 교체한다:

```tsx
function SidebarNav() {
  return (
    <aside className="hidden lg:flex flex-col w-55 border-r border-base-300 bg-base-100 h-screen sticky top-0 py-6 px-3">
      <div className="px-4 mb-8">
        <img src={logo} alt="passQL" className="h-6 w-auto" />
      </div>
      {/* menu: daisyUI 메뉴 컴포넌트 래퍼 */}
      <ul className="menu p-0 gap-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                // 활성: accent 배경(#EEF2FF) + primary 텍스트(#4F46E5)
                // 비활성: 회색 텍스트 + hover 시 base-200 배경
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-primary"
                    : "text-base-content/60 hover:bg-base-200"
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto px-4 pt-4 border-t border-base-300">
        <img src={logo} alt="passQL" className="h-4 w-auto opacity-40 mb-1" />
        <p className="text-[10px] text-text-caption">© 2026 passQL</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 데스크톱 사이드바 확인**

브라우저에서 데스크톱 뷰(≥1024px)로 확인:
- 사이드바 4개 항목 정상 표시
- 아이콘 변경 없음
- 활성 항목: `#EEF2FF` 배경 + 인디고 텍스트
- 비활성 항목: 회색 텍스트 + hover 배경
- 패딩/간격 현재와 동일

- [ ] **Step 3: 커밋**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: SidebarNav nav-sidebar-item → daisyUI menu 클래스 적용 #179"
```

---

### Task 3: components.css 커스텀 클래스 제거

**Files:**
- Modify: `src/styles/components.css` (55~97행)

- [ ] **Step 1: nav-tab*, nav-sidebar-item* 블록 제거**

`src/styles/components.css`에서 아래 블록 전체를 삭제한다 (55~97행):

```css
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
```

- [ ] **Step 2: 빌드 에러 없음 확인**

```bash
npm run build
```

Expected: 빌드 성공, 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/styles/components.css
git commit -m "chore: nav-tab, nav-sidebar-item 커스텀 CSS 클래스 제거 #179"
```
