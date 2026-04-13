# 🚀 [기능개선][리팩토링] card-base 커스텀 CSS → Tailwind 유틸리티 교체 #187

## 개요

서비스 전반에서 에러 상태가 발생했을 때 UI가 일관성 없고 미완성처럼 보이던 문제를 개선했다. `ErrorFallback` 컴포넌트를 전면 재설계하고, 홈화면 인라인 에러 버튼을 프로젝트 커스텀 클래스로 통일했으며, 에러 발생 시에도 페이지 헤딩이 유지되도록 구조를 수정했다.

## 변경 사항

### ErrorFallback 컴포넌트

- `client/src/components/ErrorFallback.tsx`: 텍스트+버튼 단순 구조 → `card-base` 카드 안에 아이콘·제목·설명·재시도 버튼 조합으로 전면 재설계
  - `errorType` prop 추가 (`network` / `server` / `auth` / `generic`) — 기본값 `generic`
  - 타입별 lucide-react 아이콘 매핑 (`WifiOff` / `ServerCrash` / `ShieldAlert` / `AlertCircle`)
  - 재시도 버튼: `btn-secondary`(44px) → `btn-compact`(32px)로 교체
  - 호출부에서 원인을 정확히 알 수 없는 경우 `generic` 유지 — 추측 기반 하드코딩 금지

### 홈화면 에러 UI

- `client/src/pages/Home.tsx`: 에러 상태 인라인 UI 개선
  - 히트맵/통계 에러 재시도 버튼: daisyUI `btn btn-xs btn-outline btn-primary` → `btn-compact`로 통일
  - 히트맵 에러 레이아웃: 가로 배치(텍스트|버튼) → 세로 중앙 정렬
  - 통계/준비도 에러: 가로 한 줄 카드 → 로딩 skeleton과 동일한 2칸 그리드 자리에 `col-span-2` 카드로 배치 (레이아웃 안정성 확보)
  - daisyUI `card bg-white p-4 sm:p-6 shadow-sm` 혼용 → `card-base` 전면 통일
  - 오늘의 문제 없음 fallback 문구: "AI문제 풀기 / SQL AI문제를 풀어보세요" → "오늘의 문제 / 오늘은 등록된 문제가 없어요"

### 에러 시 페이지 헤딩 유지

- `client/src/pages/Stats.tsx`: 에러 시 `return <ErrorFallback />` 단독 반환 → 헤딩("내 실력, 한눈에") 먼저 렌더링 후 에러 카드 배치
- `client/src/pages/CategoryCards.tsx`: 에러 시 `return <ErrorFallback />` 단독 반환 → 헤딩("AI문제 풀기") 먼저 렌더링 후 에러 카드 배치

## 주요 구현 내용

**에러 타입 설계 원칙**: `errorType`은 `ApiError.status`를 직접 확인해 분류할 수 있는 경우에만 사용. 현재 모든 호출부는 에러 원인을 정확히 알 수 없으므로 기본값 `generic`을 유지한다. 추후 catch 블록에서 `ApiError.status`를 체크해 401 → `auth`, 5xx → `server`, network error → `network`로 분류하는 로직 추가를 고려한다.

**홈화면 섹션별 독립 에러 처리 원칙**: 홈은 여러 API를 병렬 호출하는 구조이므로 전체 페이지 `ErrorFallback` 대신 섹션별 독립 에러 처리를 유지한다. 특정 섹션 API가 실패해도 나머지 섹션은 정상 렌더링된다.

## 주의사항

- `ErrorFallback` 내부에서 `card-base` 커스텀 클래스를 여전히 사용 중 — 이슈 #187의 전체 교체 작업이 완료되면 함께 Tailwind 유틸리티로 교체 필요
- `Questions.tsx` 문제 목록 에러, `AnswerFeedback.tsx` SQL 실행 에러 인라인 UI도 동일 세션에서 개선됐으나 별도 커밋에 포함됨
