### 📌 작업 개요

빈 상태(`client/.gitkeep`)였던 프론트엔드 디렉토리를 Vite + React 19 + TypeScript 기반 SPA로 부트스트랩.
PRD의 4탭 구조(홈/문제/통계/설정)에 맞는 라우팅, API 클라이언트, 상태관리, 디자인 시스템을 한 번에 구축하여 이후 화면 구현이 바로 이어질 수 있는 기반 마련.

### 🎯 구현 목표

- Vite + React + TypeScript 프로젝트 초기화
- 핵심 의존성(react-router-dom, TanStack Query, Zustand, Tailwind v4 + daisyUI 5) 설치
- 4탭 SPA 라우팅 구조 및 레이아웃 컴포넌트 작성
- API 클라이언트(fetch 래퍼), Zustand 스토어, 타입 정의
- 디자인 시스템(테마, 토큰, 타이포그래피, 컴포넌트 스타일) 설정
- Vercel 배포 설정(API 프록시 + SPA fallback)

### ✅ 구현 내용

#### 1. 프로젝트 부트스트랩 및 의존성 설정
- **파일**: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- **변경 내용**: Vite 8 + React 19 + TypeScript 6 기반 프로젝트 생성. `@vitejs/plugin-react-swc`로 빌드 속도 최적화. 개발 서버에서 `/api` 프록시를 `api.passql.suhsaechan.kr`로 설정
- **의존성**: react-router-dom 7, @tanstack/react-query 5, zustand 5, tailwindcss 4, daisyui 5

#### 2. 라우팅 구조 및 반응형 레이아웃
- **파일**: `src/App.tsx`, `src/components/AppLayout.tsx`
- **변경 내용**: `createBrowserRouter`로 5개 라우트 구성 (`/`, `/questions`, `/questions/:id`, `/stats`, `/settings`). `AppLayout`에서 Desktop은 사이드바(220px), Mobile은 하단 탭 네비게이션으로 반응형 전환. `NavLink`의 `isActive`로 활성 탭 하이라이트
- **이유**: PRD의 4탭 SPA 구조를 그대로 반영하면서 Desktop에서도 사용 가능하도록 확장

#### 3. API 클라이언트 (`apiFetch` 래퍼)
- **파일**: `src/api/client.ts`
- **변경 내용**: `apiFetch<T>()` 제네릭 함수 구현. 25초 타임아웃(`AbortController`), `ApiError` 클래스로 HTTP 에러를 구조화 (status, body 포함). Content-Type 자동 설정
- **이유**: 모든 API 호출이 일관된 에러 처리와 타임아웃을 갖도록 단일 진입점 제공

#### 4. 도메인별 API 함수
- **파일**: `src/api/questions.ts`, `src/api/ai.ts`, `src/api/progress.ts`, `src/api/meta.ts`
- **변경 내용**: 백엔드 API 스펙에 맞춰 각 도메인별 호출 함수 작성. `fetchQuestions`, `fetchQuestion`, `submitAnswer`, `executeChoice`, `explainError`, `diffExplain`, `fetchSimilar`, `fetchProgress`, `fetchHeatmap`, `fetchTopics`, `fetchTags` 등
- **이유**: API 가이드의 엔드포인트 전체 목록에 대응하는 프론트엔드 호출부 준비

#### 5. TypeScript 타입 정의
- **파일**: `src/types/api.ts`
- **변경 내용**: 모든 API 응답 타입을 `readonly` interface로 정의. `QuestionSummary`, `QuestionDetail`, `ChoiceItem`, `SubmitResult`, `ExecuteResult`, `Page<T>`, `ProgressSummary`, `HeatmapEntry`, `TopicTree`, `ConceptTag`, `AiResult`, `SimilarQuestion` 등 15개 타입
- **이유**: 불변성 보장 및 타입 안전성 확보

#### 6. Zustand 상태관리 (Member Store)
- **파일**: `src/stores/memberStore.ts`
- **변경 내용**: `crypto.randomUUID()`로 사용자 UUID를 생성하여 `localStorage`에 저장. `getMemberUuid()` 헬퍼로 인증 헤더(`X-User-UUID`) 주입 시 사용
- **이유**: 회원 등록 API가 백엔드 미구현 상태이므로, 클라이언트 사이드에서 UUID를 생성하여 사용자 식별 기반 마련

#### 7. TanStack Query Provider 설정
- **파일**: `src/main.tsx`
- **변경 내용**: `QueryClientProvider`로 앱 전체 감싸기. `staleTime: 5분`, `retry: 1`로 기본값 설정
- **이유**: 서버 상태 캐싱 및 자동 리페치 인프라 구축

#### 8. 디자인 시스템 구축
- **파일**: `src/styles/theme.css`, `src/styles/tokens.css`, `src/styles/typography.css`, `src/styles/components.css`, `src/constants/design.ts`
- **변경 내용**: daisyUI 5의 커스텀 테마(`passql`)를 Deep Indigo 컬러 팔레트로 정의. CSS Custom Properties로 디자인 토큰(색상, 간격, 반경, 그림자) 설정. Pretendard 단일 UI 폰트. 카드, 버튼, 네비게이션 등 12종 컴포넌트 스타일 클래스 정의
- **이유**: 일관된 시각적 언어를 CSS 레벨에서 확립하여 각 화면 구현 시 스타일 고민 최소화

#### 9. 홈 화면 UI (Mock 데이터)
- **파일**: `src/pages/Home.tsx`
- **변경 내용**: 인사말, 오늘의 문제 카드, 스트릭 뱃지, 통계 카드(푼 문제/정답률) 4개 섹션으로 홈 화면 구현. Mock 데이터로 레이아웃 검증
- **이유**: 디자인 시스템 적용 검증 및 홈 화면 레이아웃 선행 구현

#### 10. 페이지 스켈레톤 컴포넌트
- **파일**: `src/pages/Questions.tsx`, `src/pages/QuestionDetail.tsx`, `src/pages/Stats.tsx`, `src/pages/Settings.tsx`
- **변경 내용**: 각 탭에 대응하는 빈 페이지 컴포넌트 생성
- **이유**: 라우팅 동작 확인 및 이후 화면 구현의 진입점 마련

#### 11. Vercel 배포 설정
- **파일**: `vercel.json`
- **변경 내용**: `/api/*` 요청을 `api.passql.suhsaechan.kr`로 리라이트. 나머지 요청은 `/index.html`로 SPA fallback
- **이유**: Vercel 배포 환경에서 백엔드 API 프록시 및 클라이언트 라우팅 동작 보장

#### 12. 개발 도구 및 문서
- **파일**: `.agents/skills/` (3개 스킬), `.claude/rules/api-guide.md`, `CLAUDE.md`, `docs/` (디자인 프롬프트 8개)
- **변경 내용**: React 성능 최적화 스킬(vercel-react-best-practices), 프론트엔드 디자인 스킬, 웹 디자인 가이드라인 스킬 도입. API 연동 가이드 및 화면별 디자인 프롬프트 문서 작성
- **이유**: 이후 화면 구현 시 품질 기준 및 참조 문서 확보

### 📦 의존성 변경

| 패키지 | 버전 | 용도 |
|--------|------|------|
| react / react-dom | 19.2.4 | UI 프레임워크 |
| react-router-dom | 7.14.0 | SPA 라우팅 |
| @tanstack/react-query | 5.96.2 | 서버 상태/캐시 |
| zustand | 5.0.12 | 클라이언트 상태관리 |
| tailwindcss | 4.2.2 | 유틸리티 CSS |
| daisyui | 5.5.19 | UI 컴포넌트 라이브러리 |
| @vitejs/plugin-react-swc | 4.3.0 | SWC 기반 빌드 |
| vite | 8.0.4 | 번들러/개발서버 |
| typescript | 6.0.2 | 타입 체크 |

### 🧪 테스트 및 검증

- `npm run dev`로 로컬 개발 서버 실행 확인
- 4탭 라우팅 전환 동작 확인
- 반응형 레이아웃 (Desktop 사이드바 ↔ Mobile 하단탭) 전환 확인
- 디자인 시스템 토큰 및 컴포넌트 스타일 적용 확인
- 홈 화면 Mock 데이터 렌더링 확인

### 📌 참고사항

- **백엔드 미구현 API**: Members(register, me, regenerate-nickname), Questions(today), Progress(recent-wrong) — 해당 호출부는 에러 시 섹션 숨김 처리 예정
- **Members Store**: 백엔드 회원 API 미구현으로 클라이언트 사이드 UUID 생성 방식 사용 중. 백엔드 구현 후 서버 발급 UUID로 전환 필요
- **Mock 데이터**: 홈 화면은 하드코딩된 Mock 데이터 사용 중. API 연동 시 교체 예정
- **추가 라이브러리**: CodeMirror(SQL 에디터), Recharts(차트), react-markdown(마크다운) 등은 해당 화면 구현 시 설치 예정
- **커밋 메시지 형식**: `React Client 초기 프로젝트 구성 : <type> : <설명> #5` (총 8개 커밋)
