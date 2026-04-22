# ❗[버그][AI][Sandbox] AI 선택지 body에 SQL 대신 실행 결과 텍스트 반환으로 Sandbox 검증 전체 실패 #103

## 개요

Python AI 서버 장애 시 Gemini fallback이 선택지 `body` 필드에 실행 가능한 SQL 쿼리가 아닌 쿼리 실행 결과 텍스트(예: `NAME | DEPT_NAME\n홍길동 | 개발팀`)를 반환하여 SandboxValidator가 모든 선택지를 오답으로 처리하고, 3회 재시도 후 SSE error 이벤트를 전송했지만 프론트엔드 스트림 파싱 버그로 에러가 클라이언트에 도달하지 못해 화면이 "선택지 생성 중..." 스피너 상태로 영구적으로 멈추는 버그를 수정했다.

## 변경 사항

### 백엔드 — Sandbox 방어 로직
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java`
  - `validateStandard()` 내 각 선택지 실행 전 `body`가 `SELECT` 또는 `WITH`로 시작하는지 검사 추가
  - SQL이 아닌 텍스트가 body에 들어온 경우 DB 커넥션 소비 없이 즉시 `ERROR` 처리 후 스킵
  - WARN 로그로 비정상 body를 추적 가능하게 기록

### 백엔드 — AI 프롬프트 강화
- `server/PQL-Web/src/main/resources/db/migration/V0_0_59__fix_choice_set_prompt.sql`
  - 기존 `generate_choice_set v1` 비활성화
  - `generate_choice_set v2` 신규 추가: system_prompt에 "body는 반드시 MariaDB에서 실행 가능한 SELECT SQL 쿼리" 규칙 명시
  - 올바른 예시와 금지 예시(실행 결과 텍스트, 데이터 나열)를 system_prompt 안에 포함

### 프론트엔드 — SSE 마지막 청크 누락 버그
- `client/src/api/questions.ts`
  - `generateChoices()` 내 SSE 파싱 로직을 `processBuffer()` 헬퍼로 추출
  - `done=true` 시 버퍼에 남은 마지막 청크(error 이벤트 포함)를 처리하지 않고 버리던 버그 수정
  - 스트림 종료 시 `buffer.trim()` 잔여 내용이 있으면 `"\n\n"` 추가 후 강제 파싱 처리

## 주요 구현 내용

**SandboxValidator 방어 레이어**: AI가 잘못된 포맷을 반환하더라도 DB 커넥션을 낭비하지 않고 즉시 ERROR로 처리한다. 기존에는 4개 선택지 × 3회 재시도 = 최대 12번의 불필요한 HikariPool 생성/해제가 발생했다.

**프롬프트 버전 관리**: 마이그레이션으로 v1을 비활성화하고 v2를 활성화하는 방식으로 롤백이 가능하다.

**SSE flush 버그**: 서버가 `emitter.send(errorEvent)` → `emitter.complete()`를 호출하면 error 이벤트가 마지막 TCP 청크에 담겨 오는데, `done=true` 분기에서 버퍼를 처리하지 않아 error 이벤트가 사라지던 문제를 수정했다.

## 주의사항

- `startsWith("SELECT"/"WITH")` 체크는 `(SELECT ...)` 형태의 괄호 서브쿼리나 `EXPLAIN SELECT` 구문을 막을 수 있다. 현재 문제 유형상 영향은 없으나, 향후 복잡한 오답 SQL 허용이 필요하면 정규식 패턴으로 교체 필요
- `generate_choice_set v2` 적용은 마이그레이션 실행 후(서버 재시작) 유효하며, 기존 생성 실패 기록(status=FAILED)에는 소급 적용되지 않음
