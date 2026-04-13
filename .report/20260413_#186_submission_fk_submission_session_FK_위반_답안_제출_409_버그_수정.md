# ❗[버그][제출] submission fk_submission_session FK 위반으로 답안 제출 409 버그 #186

## 개요

`submission` 테이블의 `session_uuid` 컬럼에 `quiz_session` 테이블을 참조하는 FK 제약(`fk_submission_session`)이 걸려 있었으나, 단독 풀이 모드에서 클라이언트가 `crypto.randomUUID()`로 생성한 임의 UUID를 전달하는 구조였다. `quiz_session` 테이블을 채우는 세션 생성 로직이 존재하지 않아 항상 FK 위반이 발생했다. Flyway 마이그레이션으로 해당 FK 제약을 제거하여 정상 제출이 가능하도록 수정했다.

## 변경 사항

### DB 마이그레이션
- `server/PQL-Web/src/main/resources/db/migration/V0_0_103__drop_fk_submission_session.sql`: `submission.session_uuid → quiz_session(session_uuid)` FK 제약 제거. `information_schema.table_constraints` 조회로 제약 존재 여부를 확인한 뒤 DROP하는 안전한 DO 블록 작성

## 주요 구현 내용

`session_uuid`는 AI 코멘트를 세션 단위로 집계하기 위한 느슨한 식별자다. 실제 `quiz_session` 레코드와 강한 참조 무결성이 필요한 설계가 아니며, 단독 풀이 모드(`useSubmitAnswer`)에서 `crypto.randomUUID()`로 클라이언트가 자체 생성하는 것이 의도된 동작이다. FK를 살리려면 제출 전 `quiz_session`에 INSERT하는 별도 로직이 필요하나 현재 설계 의도와 맞지 않아 FK 제거를 선택했다.

SQL은 `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` 대신 `DO $$ ... IF EXISTS ... $$` 패턴을 사용해, 이미 제약이 없는 환경(재실행, 테스트 DB 등)에서도 안전하게 동작하도록 했다.

## 주의사항

- `quiz_session` 테이블 자체는 그대로 유지됨 — 향후 세션 기반 기능 구현 시 재활용 가능
- `submission.session_uuid` 컬럼은 NULL 허용 상태로 유지되어 있어 세션 미전달 케이스도 문제 없음
