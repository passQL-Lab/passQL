# ❗[버그][Sandbox] /execute 엔드포인트가 sandboxDbName null 시 questionUuid를 DB명으로 폴백하여 Access Denied 발생 #104

## 개요

`/api/questions/{questionUuid}/execute` 엔드포인트가 `question.sandboxDbName`이 null인 경우 `questionUuid` 문자열(예: `35a0ec50-5726-40e5-8c43-80d6a85173c9`)을 MariaDB DB명으로 사용하는 잘못된 폴백 로직으로 인해 `sqld_runner` 계정의 Access Denied 에러가 발생하던 버그를 수정했다. 현재 등록된 모든 문제가 `sandbox_db_name` 미설정 상태이므로 실질적으로 모든 문제의 "실행" 버튼이 동작하지 않는 상황이었다.

## 변경 사항

### 백엔드 — QuestionExecutionService 임시 DB 방식 전환
- `server/PQL-Application/src/main/java/com/passql/application/service/QuestionExecutionService.java`
  - `SandboxPool` 의존성 추가
  - `executeChoice()`: `sandboxDbName`이 null인 경우 `SandboxPool.acquire()` → DDL+샘플데이터 적용 → SQL 실행 → `release()` 흐름으로 변경
  - `questionUuid`를 DB명으로 폴백하던 레거시 코드 제거 (`executeChoice()` 내)
  - `sandboxDbName`이 있는 경우의 영구 DB 직접 실행 경로는 유지

## 주요 구현 내용

`SandboxValidator`(선택지 생성 검증) 및 `ChoiceSetGenerationService.executeSandboxOnce()`와 동일한 임시 DB 생성 방식을 `/execute`에도 적용했다.

사용자가 "실행" 버튼을 클릭할 때마다:
1. `SandboxPool.acquire()` — 슬롯 기반 임시 DB 획득
2. 문제의 `schemaDdl` + `schemaSampleData` 적용
3. 사용자 SQL 실행
4. `finally: SandboxPool.release()` — 임시 DB drop

기존 설계는 `/execute`가 "미리 만들어진 영구 sandbox DB"를 전제로 동작했는데, 실제로는 SandboxPool이 일회용 임시 DB 방식이므로 전제 자체가 잘못되어 있었다.

## 주의사항

- `/execute` 호출마다 `SandboxPool` semaphore 슬롯 1개를 소비한다. 사용자가 선택지를 빠르게 여러 개 동시에 클릭하면 `sandbox.pool.concurrency` 한도까지 슬롯을 점유할 수 있으며, `sandbox.pool.wait_seconds` 초과 시 실패 가능
- `submitWithResult()` 내부의 레거시 폴백 코드(`questionUuid`를 DB명으로 사용하는 경로)는 해당 메서드가 현재 컨트롤러에서 미사용 상태이므로 즉각적인 영향은 없으나, 향후 정리가 필요
- `sandboxDbName`이 있는 영구 DB 경로는 현재 사용되지 않으나 향후 성능 최적화 목적으로 보존
