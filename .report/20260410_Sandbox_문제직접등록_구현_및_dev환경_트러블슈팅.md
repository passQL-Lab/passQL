# Sandbox 문제 직접 등록 기능 구현 및 dev 환경 트러블슈팅

## 개요

관리자가 선택지 없이 Question 메타데이터(DDL, sampleData, answerSql 등)만 직접 입력해서 등록하는 폼을 구현했다. 선택지는 사용자가 퀴즈를 풀 때 AI가 자동 생성하는 구조로, 문제 등록과 선택지 생성을 완전히 분리했다. 구현 과정에서 dev 환경 설정 오류와 MariaDB 권한 문제, DDL 중복 실행 버그를 순차적으로 해결했다.

---

## 변경 사항

### 백엔드 - 새 기능

- `QuestionGenerateService.java`: `createQuestionOnly()` 메서드 추가 — 선택지 없이 Question 엔티티만 저장. EXECUTABLE 모드일 때 `schemaDdl`, `answerSql` null/blank 검증 포함
- `AdminQuestionController.java`: `GET/POST /admin/questions/register` 엔드포인트 추가. `parseExecutionMode()`, `parseChoiceSetPolicy()` 헬퍼 메서드로 `valueOf()` IllegalArgumentException 안전 처리

### 백엔드 - 버그 수정

- `SandboxExecutor.java`: `normalizeDdl()` 메서드 추가 — `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS` 자동 변환. 관리자가 DDL 입력 시 `IF NOT EXISTS`를 빠뜨려도 sandbox에서 안전하게 실행

### 프론트엔드

- `question-register.html`: 문제 직접 등록 폼 신규 생성. 실행형/개념형 전환 시 스키마 섹션 show/hide, 정답 SQL 실행 테스트 버튼(Sandbox 즉시 검증) 포함. innerHTML 대신 `textContent` + `createElement`로 XSS 방어
- `questions.html`: 목록 상단 버튼을 "직접 등록" / "AI 생성" 두 개로 분리

### 설정

- `application.yml`: 기본 프로파일 `prod` → `dev` 변경 (로컬 개발용)
- `application-dev.yml`: sandbox `url-template`을 `localhost` → `127.0.0.1`로 변경, DB명을 `passql_sandbox`로 수정
- `CLAUDE.md`: Security 의도적 전체 개방 정책 명시

---

## 주요 구현 내용

### 문제 vs 선택지 분리

기존 `createQuestionWithSeedSet()`은 문제 저장과 ADMIN_SEED 선택지 저장을 한 트랜잭션으로 묶었다. 새로 추가한 `createQuestionOnly()`는 Question만 저장하고 끝낸다. 선택지는 사용자가 퀴즈 진입 시 `ChoiceSetGenerationService`가 AI로 자동 생성한다.

### Sandbox DDL 자동 보정

```java
// Before: 관리자가 IF NOT EXISTS 빠뜨리면 두 번째 실행부터 에러
stmt.execute(sql);

// After: CREATE TABLE → CREATE TABLE IF NOT EXISTS 자동 변환
stmt.execute(normalizeDdl(sql.trim()));
```

정규식 `(?i)CREATE\s+TABLE\s+` 로 대소문자 무관하게 처리한다.

---

## 트러블슈팅 기록

### 1. `prod` 프로파일로 실행 (본인 실수)

- **증상**: `Access denied for user 'sqld_runner'@'183.98.211.13'` — 외부 IP로 시놀로지 NAS MariaDB에 접속 시도
- **원인**: `application.yml`의 기본 프로파일이 `prod`로 설정되어 있어 `application-prod.yml`(NAS 주소)을 읽음
- **해결**: `application.yml`에서 `active: prod` → `active: dev` 변경

### 2. `localhost` vs `127.0.0.1` 차이

- **증상**: `dev`로 바꿔도 여전히 외부 IP로 연결 시도
- **원인**: `sandbox.datasource.url-template`이 `localhost`로 설정되어 있었고, macOS에서 `localhost`가 `::1`(IPv6) 또는 외부 NIC로 해석될 수 있음
- **해결**: `url-template`을 `127.0.0.1`로 명시적 변경

### 3. `sandbox_{id}` 플레이스홀더 그대로 URL 사용

- **증상**: `Unknown database 'sandbox_{id}'`
- **원인**: `SandboxPool.createAdminDataSource()`는 `urlTemplate`의 마지막 `/` 뒤를 `mysql`로 교체하는데, `{id}`가 포함된 경로명이 그대로 남음
- **해결**: `url-template`을 `passql_sandbox`로 단순화 (`{id}` 제거)

### 4. `sqld_runner` 권한 부족

- **증상**: `Access denied for user 'sqld_runner'@'localhost' to database 'passql_sandbox'`
- **원인**: `sqld_runner@localhost`에 `sandbox_%` 패턴 DB에 대한 권한 없음
- **해결**:
  ```sql
  GRANT ALL PRIVILEGES ON `sandbox_%`.* TO 'sqld_runner'@'localhost';
  GRANT SELECT ON mysql.* TO 'sqld_runner'@'localhost';
  CREATE DATABASE IF NOT EXISTS passql_sandbox;
  GRANT ALL PRIVILEGES ON `passql_sandbox`.* TO 'sqld_runner'@'localhost';
  FLUSH PRIVILEGES;
  ```

### 5. `CREATE TABLE already exists` 에러

- **증상**: 정답 SQL 실행 테스트를 두 번 이상 눌렀을 때 `Table 'sqld_14' already exists`
- **원인**: `SandboxPool.acquire()`가 매번 새 DB(`sandbox_xxxxxxxx`)를 만들지만, DDL에 `IF NOT EXISTS`가 없으면 두 번째 applyDdl 호출 시 에러 발생
- **해결**: `SandboxExecutor.normalizeDdl()`에서 `CREATE TABLE`을 자동으로 `CREATE TABLE IF NOT EXISTS`로 변환

---

## 주의사항

- `application.yml`의 `active: dev`는 로컬 전용. **배포 전 반드시 `prod`로 복원**하거나 IDE 실행 옵션 `-Dspring.profiles.active=dev`로 대체할 것
- `sqld_runner@%` 권한이 MariaDB에 추가되어 있음 — 운영 환경에서는 접근 가능한 IP를 명시적으로 제한할 것
- `normalizeDdl()`은 `CREATE TABLE`만 처리함. `CREATE INDEX`, `CREATE VIEW` 등은 현재 미처리
