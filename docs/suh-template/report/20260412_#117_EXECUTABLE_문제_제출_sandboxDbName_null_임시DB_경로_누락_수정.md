# EXECUTABLE 문제 제출 시 sandboxDbName null일 때 임시 DB 경로 누락으로 INTERNAL_SERVER_ERROR

## 개요

`sandbox_db_name`이 설정되지 않은 EXECUTABLE 문제를 제출할 때 `INTERNAL_SERVER_ERROR`가 발생하는 버그를 수정했다. `SubmissionService.submit()`에 `SandboxPool` 주입 및 임시 DB 생성·DDL 적용·반납 경로를 추가하여 `executeChoice()`와 동일한 실행 패턴으로 통일했다.

## 변경 사항

### 백엔드
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/SubmissionService.java`
  - `SandboxPool` 필드 주입 추가
  - EXECUTABLE 실행 분기 재구성: `sandboxDbName` 유무에 따라 영구 DB 경로 / 임시 DB 경로 분리

## 주요 구현 내용

기존 코드는 `sandboxDbName`이 null이면 `questionUuid` 문자열을 DB명으로 폴백하여 존재하지 않는 DB에 SQL 실행을 시도했다. 반면 `executeChoice()`(SQL 실행 미리보기)는 동일 상황에서 `SandboxPool`에서 임시 DB를 빌려 DDL·샘플데이터 적용 후 실행하고 반납하는 완전한 경로가 구현되어 있었다.

수정 후 `submit()`도 동일한 두 갈래 경로를 따른다:
- `sandboxDbName` 있음 → 영구 sandbox DB에 직접 실행
- `sandboxDbName` 없음 → `SandboxPool.acquire()` → DDL 적용 → selected/correct SQL 실행 → `SandboxPool.release()` (`finally` 보장)

`PQL-Domain-Submission/build.gradle`에 `PQL-Domain-Question`이 이미 의존성으로 포함되어 있어 별도 의존성 변경은 불필요했다.

## 주의사항

- `sandbox_db_name`이 null인 EXECUTABLE 문제는 `schemaDdl`과 `schemaSampleData`가 정확히 설정되어 있어야 임시 DB 경로에서 올바른 결과를 반환한다. 해당 필드가 비어 있으면 빈 DB에서 SQL을 실행하게 되므로 문제 등록 시 스키마 필드 입력이 필수다.
- 기존에 `sandboxDbName`이 설정된 문제(영구 DB 경로)는 동작 변경 없음.
