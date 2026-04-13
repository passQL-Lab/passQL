# ❗[버그][Sandbox] /execute 엔드포인트가 sandboxDbName null 시 questionUuid를 DB명으로 폴백하여 Access Denied 발생 #104

## 개요

`/api/questions/{questionUuid}/execute` 엔드포인트가 `question.sandboxDbName`이 null인 경우 `questionUuid` 문자열을 MariaDB DB명으로 사용하는 잘못된 폴백 로직으로 인해 `sqld_runner` 계정의 Access Denied 에러가 발생하던 버그를 수정했다. 현재 등록된 모든 문제가 `sandbox_db_name` 미설정 상태이므로 실질적으로 모든 문제의 "실행" 버튼이 동작하지 않는 상태였다.

## 변경 사항

### 백엔드 — executeChoice 임시 DB 방식 전환
- `server/PQL-Application/src/main/java/com/passql/application/service/QuestionExecutionService.java`
  - `SandboxPool` 의존성 추가
  - `executeChoice()`: `sandboxDbName`이 null인 경우 `SandboxPool.acquire()` → DDL + 샘플데이터 적용 → SQL 실행 → `release()` 방식으로 변경
  - `questionUuid`를 DB명으로 폴백하던 레거시 코드 제거
  - `sandboxDbName`이 있는 경우는 기존 영구 DB 직접 실행 경로 유지

## 주요 구현 내용

`SandboxValidator`(선택지 생성 시 검증)와 동일한 임시 DB 생성 방식을 `/execute`에도 적용했다. 사용자가 선택지 "실행" 버튼을 클릭할 때마다 `SandboxPool`에서 임시 DB를 슬롯 기반으로 획득하고, 문제의 `schemaDdl` + `schemaSampleData`를 적용한 뒤 사용자 SQL을 실행하고, finally 블록에서 반드시 `release()`하여 임시 DB를 삭제한다.

기존 설계는 `/execute`가 "미리 만들어진 영구 sandbox DB"를 전제로 동작했는데, 실제로는 SandboxPool이 일회용 임시 DB 방식이므로 전제 자체가 잘못되어 있었다.

## 주의사항

- `/execute` 호출마다 `SandboxPool` semaphore 슬롯을 1개 소비한다. 사용자가 선택지를 빠르게 여러 개 동시에 클릭하면 `sandbox.pool.concurrency` 설정 한도까지 동시 슬롯을 점유할 수 있다. 현재 concurrency 기본값 내에서는 문제없으나, 트래픽 증가 시 `sandbox.pool.wait_seconds` 초과로 실패할 수 있음
- `sandboxDbName`이 있는 영구 DB 경로는 현재 사용되지 않으나, 향후 성능 최적화 목적으로 특정 문제에 영구 DB를 지정하는 기능을 추가할 때 활용 가능
