# passQL Client

## Tech Stack
- Vite + React 19 + TypeScript
- Tailwind CSS 4 + daisyUI 5
- Zustand (상태관리), fetch 래퍼 (API 클라이언트)
- React Router DOM (라우팅)

## Project Structure
- `src/api/` — API 클라이언트 및 엔드포인트 모듈
- `src/stores/` — Zustand 스토어
- `src/pages/` — 페이지 컴포넌트
- `src/components/` — 공용 컴포넌트
- `src/types/` — TypeScript 타입 정의
- `docs/` — API 문서 및 기획 문서

## Local Skills (`.agents/skills/`)

아래 스킬들을 작업 시 적극 참조할 것.

### vercel-react-best-practices
React 성능 최적화 69개 룰. 컴포넌트 작성, 리팩토링, 코드리뷰 시 반드시 참조.
- 우선순위: async(워터폴 제거) > bundle(번들 최적화) > server > client > rerender > rendering > js > advanced
- 개별 룰: `.agents/skills/vercel-react-best-practices/rules/` 하위 파일 참조

### frontend-design
프론트엔드 UI 구현 시 디자인 품질 가이드. 새 페이지/컴포넌트 작성 시 참조.
- 제네릭한 AI 스타일(Inter, 보라색 그라데이션 등) 금지
- Typography, Color, Motion, Spatial Composition 등 의도적 디자인 선택

### web-design-guidelines
UI 코드 리뷰 및 접근성/UX 감사 시 사용.
- 가이드라인 소스: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
- WebFetch로 최신 룰 가져온 후 파일 대조

### find-skills
새로운 스킬이 필요할 때 `npx skills find [query]`로 검색.

## Rules (`.claude/rules/`)

### api-guide
API 연동 시 반드시 참조. 엔드포인트 스펙, 코드 패턴, 에러 처리 규칙 포함.
- 프론트는 백엔드(Spring)하고만 통신. AI 서버 직접 호출 금지.
- 새 API 추가 시 `apiFetch<T>()` 래퍼 필수, `fetch()` 직접 호출 금지.

## Commands
```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (tsc + vite build)
npm run preview  # 빌드 결과 미리보기
```
