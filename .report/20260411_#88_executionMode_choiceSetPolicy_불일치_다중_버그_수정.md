# ❗[버그][문제풀기] executionMode·choiceSetPolicy 불일치로 인한 다중 버그

## 개요

문제 유형(executionMode / choiceSetPolicy)에 따른 처리 분기가 서버·클라이언트 양측에서 누락되어 4가지 버그가 동시에 발생했다. CONCEPT_ONLY 문제의 SSE 오호출, 레거시 문제의 Sandbox 실패, API 응답 필드 누락, ODD_ONE_OUT 정책 불일치가 이번 패치에서 일괄 수정되었다.

## 변경 사항

### 서버 — PQL-Domain-Question

- `QuestionDetail.java`: `choiceSetPolicy` 필드 추가. API 응답에 문제 유형 정책이 포함되지 않던 문제 해결
- `QuestionService.java`: `getQuestion()` 응답 빌드 시 `q.getChoiceSetPolicy()` 포함. `updateChoiceSetPolicy()` 메서드 신규 추가 (정책 단독 변경 지원)
- `ChoiceSetResolver.java`: `ExecutionMode.CONCEPT_ONLY` 진입 시 조기 거부 가드 추가. 기존에는 CONCEPT_ONLY 문제도 AI 선택지 생성 로직으로 진입해 에러 발생
- `SandboxValidator.java`: `schemaDdl` null·blank 체크 추가. DDL 없이 Sandbox 실행 시 `SANDBOX_SETUP_FAILED` 발생하던 방어 로직

### 서버 — PQL-Domain-Submission

- `SubmissionService.java`: `submit()` 내 `sandboxDbName` null 폴백 추가. 기존에는 `sandboxDbName`이 null인 레거시 문제에서 DB를 찾지 못해 실패. `questionUuid.toString()`을 폴백 DB명으로 사용 (`QuestionExecutionService`와 동일 정책으로 통일)

### 클라이언트

- `types/api.ts`: `ChoiceSetPolicy` 타입 추가 (`"AI_ONLY" | "ODD_ONE_OUT" | "CURATED_ONLY" | "HYBRID"`). `QuestionDetail`에 `choiceSetPolicy` 필드 추가
- `pages/QuestionDetail.tsx`: `needsSseGeneration` 조건에 `executionMode === "EXECUTABLE"` 체크 추가. CONCEPT_ONLY 문제는 SSE 요청 없이 "선택지가 아직 준비되지 않았습니다" 메시지 표시로 분기
- `api/mock-data.ts`, `api/api-contract.test.ts`: `QuestionDetail` mock 객체에 `choiceSetPolicy: "AI_ONLY"` 추가 (TypeScript 빌드 오류 수정)

## 주요 구현 내용

레거시 문제의 `sandboxDbName` null 폴백은 `QuestionExecutionService`(execute 엔드포인트)와 `SubmissionService`(submit 엔드포인트) 양쪽 모두 동일하게 `questionUuid.toString()` 폴백을 적용하여 정책을 통일했다. CONCEPT_ONLY 문제의 SSE 호출 차단은 프론트(렌더링 조건 분기)와 서버(ChoiceSetResolver 조기 거부) 양 레이어에서 이중으로 방어한다.

## 주의사항

- 기존 레거시 문제 중 `sandboxDbName`이 null인 문제는 UUID를 DB명으로 사용하는 폴백에 의존함. 신규 등록 문제는 반드시 `sandboxDbName`이 채워진 상태로 생성되어야 한다
- `updateChoiceSetPolicy()` API는 현재 내부 서비스 메서드로만 존재하며, 외부 HTTP 엔드포인트는 별도 작업이 필요하다
