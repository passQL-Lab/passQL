## 제목
🚀 [기능개선][네비게이션] AppLayout 네비게이션 daisyUI 클래스 적용

## 본문

📝 현재 문제점
---

- `AppLayout`의 모바일 하단 탭(`nav-tab`, `nav-tab--active`, `nav-tab--inactive`)과 데스크톱 사이드바(`nav-sidebar-item`, `nav-sidebar-item--active`)가 커스텀 CSS 클래스로 구현되어 있음
- 전체 페이지에 공통으로 렌더링되는 컴포넌트라 daisyUI 전환 효과가 가장 큼

🛠️ 해결 방안 / 제안 기능
---

- 모바일 하단 탭 → daisyUI `dock` 컴포넌트 클래스로 전환
- 데스크톱 사이드바 메뉴 항목 → daisyUI `menu` 컴포넌트 클래스로 전환
- passQL 브랜드 색상(인디고) 유지

⚙️ 작업 내용
---

- `AppLayout.tsx`: nav-tab 계열 → dock/dock-label 교체 (3곳)
- `AppLayout.tsx`: nav-sidebar-item 계열 → menu/menu-item 교체 (2곳)

🙋‍♂️ 담당자
---

- 백엔드: 이름
- 프론트엔드: 이름
- 디자인: 이름
