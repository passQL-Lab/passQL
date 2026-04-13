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

## 금지 규칙

- **`git push` 절대 금지** — 어떤 상황에서도 원격에 push하지 않는다
- **커밋 시 Co-Authored-By 태그 금지** — 커밋 메시지에 절대 추가하지 않는다
- **파일 삭제 시 반드시 사용자 허락** — 확인 없이 파일을 삭제하지 않는다
- **모르면 모른다고 말하기** — 확실하지 않은 내용을 추측하지 않는다
- **답변은 항상 한국어로** — 코드/커맨드 제외 모든 응답은 한국어
- **코드 주석 필수** — 실무 수준의 간결한 한국어 주석 작성 (WHY 중심, 과하지 않게)
- **인라인 style 속성 절대 금지** — JSX에서 `style={{ ... }}` 사용 금지. 반드시 Tailwind CSS 유틸리티 클래스 또는 `src/styles/components.css`의 프로젝트 커스텀 클래스를 사용한다
  - **예외**: `MarkdownText.tsx`의 단어 fade-in span에서 CSS custom property(`--i`) 주입 목적으로만 허용. 런타임 동적 값을 CSS에 전달하는 유일한 수단이므로 이 케이스에 한해 인정한다

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

## Icon Policy

- 코드에서 이모지(emoji) 사용 절대 금지. UI 아이콘은 반드시 `lucide-react` 패키지 사용.
- `import { IconName } from "lucide-react"` 형태로 import.

## Git Conventions

- 커밋 메시지에 반드시 이슈 태그를 붙인다. 형식: `<type>: <description> #<issue-number>`
- 예: `feat: 카테고리 연습 모드 추가 #41`

## Commands

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (tsc + vite build)
npm run preview  # 빌드 결과 미리보기
```
