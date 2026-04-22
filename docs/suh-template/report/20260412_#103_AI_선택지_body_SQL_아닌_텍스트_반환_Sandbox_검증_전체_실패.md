# ❗[버그][AI][Sandbox] AI 선택지 body에 SQL 대신 실행 결과 텍스트 반환으로 Sandbox 검증 전체 실패 #103

## 개요

Python AI 서버 장애 시 Gemini fallback이 선택지 `body` 필드에 실행 가능한 SQL 쿼리 대신 쿼리 실행 결과 텍스트(예: `NAME | DEPT_NAME\n홍길동 | 개발팀`)를 반환하여, `SandboxValidator`가 모든 선택지를 에러/오답 처리 → 3회 재시도 모두 실패 → SSE error 이벤트 전송 → 프론트엔드 스트림 파싱 버그로 에러가 클라이언트에 미도달 → 화면이 "선택지 생성 중..." 스피너로 영구 멈추는 버그를 수정했다.

## 변경 사항

### 백엔드 — SandboxValidator SQL 방어 레이어
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java`
  - `validateStandard()`: 각 선택지 실행 전 `body`가 `SELECT` 또는 `WITH`로 시작하는지 검사 추가
  - SQL이 아닌 텍스트가 `body`에 있을 경우 DB 커넥션 소비 없이 즉시 `ERROR` 처리 후 스킵 (HikariPool 낭비 방지)
  - `WARN` 로그로 비정상 `body` 내용(50자 preview)을 추적 가능하게 기록

### 백엔드 — AI 프롬프트 강화
- `server/PQL-Web/src/main/resources/db/migration/V0_0_63__fix_ai_only_prompt_to_sql_equivalence.sql`
  - `generate_choice_set` 프롬프트 재작성: `system_prompt`에 "body는 반드시 MariaDB에서 실행 가능한 SELECT SQL 쿼리" 규칙 명시
  - 올바른 예시와 금지 예시(실행 결과 텍스트, 데이터 나열)를 포함하여 AI가 SQL 이외를 반환하지 않도록 강화

### 프론트엔드 — SSE 마지막 청크 누락 버그
- `client/src/api/questions.ts`
  - `generateChoices()` SSE 파싱 로직에서 `done=true` 시 버퍼에 남은 마지막 청크(error 이벤트 포함)를 처리하지 않고 버리던 버그 수정
  - 스트림 종료 시 `buffer.trim()` 잔여 내용이 있으면 강제 파싱 처리하도록 변경

## 주요 구현 내용

**SandboxValidator 방어 레이어**: 기존에는 4개 선택지 × 3회 재시도 = 최대 12번의 불필요한 HikariPool 획득/해제가 발생했다. `SELECT`/`WITH`로 시작하지 않으면 커넥션 없이 즉시 반환하도록 단락 처리했다.

**SSE flush 버그 근본 원인**: 서버가 `emitter.send(errorEvent)` → `emitter.complete()`를 순서대로 호출하면 error 이벤트가 마지막 TCP 청크에 담겨 전송된다. 클라이언트의 `done=true` 분기에서 버퍼를 파싱하지 않고 버려 error 이벤트가 사라지던 구조적 결함을 수정했다.

## 주의사항

- `startsWith("SELECT"/"WITH")` 체크는 `(SELECT ...)` 괄호 서브쿼리나 `EXPLAIN SELECT` 구문을 막을 수 있다. 현재 문제 유형에서는 영향 없으나, 향후 복잡한 오답 SQL 허용이 필요하면 정규식 패턴으로 교체 필요
- 프롬프트 변경은 마이그레이션 실행(서버 재시작) 이후 유효하며, 기존 `status=FAILED` 기록에는 소급 적용되지 않음
