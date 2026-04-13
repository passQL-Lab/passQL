# AppLayout 네비게이션 daisyUI 클래스 적용 #179

### 📌 작업 개요
`AppLayout.tsx`의 모바일 하단 탭과 데스크톱 사이드바 메뉴에 적용된 커스텀 CSS 클래스(`nav-tab*`, `nav-sidebar-item*`)를 daisyUI 5 표준 컴포넌트 클래스로 전환. 전체 앱 레이아웃에 공통 적용되는 컴포넌트라 daisyUI 전환 효과가 가장 크며, passQL 브랜드 인디고 색상과 기존 시각적 결과는 유지.

### ✅ 구현 내용

#### 모바일 하단 탭 — dock 컴포넌트로 전환
- **파일**: `src/components/AppLayout.tsx`
- **변경 내용**: `BottomTabNav`의 `nav-tab`, `nav-tab--active`, `nav-tab--inactive` → daisyUI `dock`, `dock-active`, `dock-label` 클래스로 교체
- **이유**: daisyUI 5 `dock`이 `fixed bottom-0`, `flex`, `items-center`를 내장하여 별도 CSS 없이 동일 레이아웃 구현 가능. `dock-active`가 활성 상태 인디케이터와 색상을 처리.

#### 데스크톱 사이드바 — menu 스타일 충돌 제거 및 직접 Tailwind 적용
- **파일**: `src/components/AppLayout.tsx`
- **변경 내용**: `SidebarNav`의 `nav-sidebar-item`, `nav-sidebar-item--active` → `flex flex-col gap-1` 컨테이너 + NavLink에 Tailwind 클래스 직접 적용
- **이유**: daisyUI `menu` 클래스 사용 시 내부 `li a` 스타일이 NavLink의 className 함수와 충돌하여 활성/비활성 스타일이 올바로 적용되지 않는 문제 발생. `flex flex-col gap-1`로 직접 레이아웃을 구성하고 NavLink className에 Tailwind 클래스를 인라인으로 지정하는 방식으로 해결.

#### 커스텀 CSS 클래스 제거
- **파일**: `src/styles/components.css`
- **변경 내용**: `nav-tab`, `nav-tab--active`, `nav-tab--inactive`, `nav-sidebar-item`, `nav-sidebar-item--active` 6개 블록(44줄) 완전 제거
- **이유**: daisyUI 클래스 전환 완료 후 미사용 커스텀 클래스 정리

#### daisyUI passql 테마 강제 적용
- **파일**: `index.html`
- **변경 내용**: `<html>` 태그에 `data-theme="passql"` 속성 추가
- **이유**: 브라우저 OS 다크모드 설정에 따라 daisyUI가 자동으로 다크 테마를 적용하는 문제 수정. passQL은 라이트 모드 전용 디자인이므로 테마 강제 고정 필요.

### 🔧 주요 변경사항 상세

#### BottomTabNav (모바일 하단 탭)
```tsx
<nav className="dock lg:hidden h-14 bg-base-100 border-t border-base-300 z-30">
  {NAV_ITEMS.map((item) => (
    <NavLink
      className={({ isActive }) =>
        isActive ? "dock-active text-primary" : "text-base-content/40"
      }
    >
      <item.icon size={20} />
      <span className="dock-label">{item.label}</span>
    </NavLink>
  ))}
</nav>
```
- `h-14`: daisyUI dock 기본 높이(64px)를 56px로 재정의하여 기존 디자인 유지
- `dock-active text-primary`: daisyUI 5에서 활성 상태는 `active`가 아닌 `dock-active`

#### SidebarNav (데스크톱 사이드바)
```tsx
<ul className="flex flex-col gap-1">
  {NAV_ITEMS.map((item) => (
    <li key={item.to}>
      <NavLink
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-accent text-primary"
              : "text-base-content/60 hover:bg-base-200"
          }`
        }
      >
        <item.icon size={20} /><span>{item.label}</span>
      </NavLink>
    </li>
  ))}
</ul>
```
- 활성: `bg-accent`(#EEF2FF) + `text-primary`(#4F46E5) — passQL 인디고 브랜드 색상 유지
- 비활성: `text-base-content/60` + `hover:bg-base-200`

**특이사항**:
- `style={{ ... }}` 인라인 CSS 없음 — 전체 Tailwind/daisyUI 클래스만 사용
- 이모지/유니코드 심볼 없음 — 모든 아이콘은 lucide-react

### 🧪 테스트 및 검증
- 모바일(< 1024px): 하단 dock 탭 표시, 활성 탭 `dock-active` 인디케이터 확인
- 데스크톱(>= 1024px): 좌측 사이드바 표시, 활성 항목 accent 배경 확인
- 라이트 모드 고정 확인 (`data-theme="passql"`)
- OS 다크모드 설정과 무관하게 passQL 라이트 테마 유지 확인

### 📌 참고사항
- daisyUI 5에서 dock 활성 클래스는 `active`가 아닌 `dock-active` — daisyUI 4와 다름
- `menu` 컴포넌트 사용 시 `li a` 자동 스타일이 NavLink className 함수와 충돌하는 경우, `flex flex-col gap-1` 직접 구성 방식으로 우회
