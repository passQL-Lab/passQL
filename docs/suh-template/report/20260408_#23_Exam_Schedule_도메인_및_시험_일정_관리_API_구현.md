# Exam Schedule 도메인 및 시험 일정 관리 API 구현

## 개요

홈 화면 인사말의 "시험 D-day" 계산을 위해 시험 일정 관리 전용 서비스를 구축했다. 기존 `MetaController`/`MetaService`에 임시로 들어있던 exam-schedule 로직을 전용 `ExamScheduleService`로 분리하고, 사용자 조회 API와 어드민 CRUD API, Thymeleaf 어드민 화면을 구현했다. Entity 직접 노출을 DTO 변환으로 개선했다.

## 변경 사항

### 신규 파일 - Domain 계층 (PQL-Domain-Meta)

- `meta/dto/ExamScheduleResponse.java`: 시험 일정 응답 DTO. `ExamSchedule` Entity에서 `from()` 팩토리 메서드로 변환. UUID, certType(String), round, examDate, isSelected 포함
- `meta/dto/ExamScheduleCreateRequest.java`: 시험 일정 생성 요청 DTO. certType, round, examDate 필드
- `meta/service/ExamScheduleService.java`: 시험 일정 전용 비즈니스 로직 서비스
  - `getAllSchedules(CertType)`: certType 필터링 조회 (null이면 전체)
  - `getSelectedSchedule()`: 현재 선택된 일정 1개 (없으면 null)
  - `createSchedule()`: 회차 추가 (certType+round 중복 시 409 CONFLICT)
  - `selectSchedule(UUID)`: 선택 토글 (트랜잭션으로 기존 선택 해제 후 대상 선택)
  - `deleteSchedule(UUID)`: 회차 삭제 (자동 재선택 없음)

### 신규 파일 - Web 계층 (PQL-Web)

- `controller/ExamScheduleController.java`: 사용자 API (`/api/exam-schedules`)
  - `GET /api/exam-schedules?certType=SQLD` — 회차 리스트 조회
  - `GET /api/exam-schedules/selected` — 현재 선택된 회차
- `controller/ExamScheduleControllerDocs.java`: Swagger + ApiLog 문서 인터페이스
- `controller/admin/AdminExamScheduleController.java`: 어드민 API + Thymeleaf 렌더링
  - `GET /admin/exam-schedules` — 어드민 화면
  - `POST /admin/exam-schedules` — 회차 추가 (폼 제출 → redirect)
  - `PUT /admin/exam-schedules/{uuid}/select` — 선택 토글 (AJAX)
  - `DELETE /admin/exam-schedules/{uuid}` — 회차 삭제 (AJAX)
- `templates/admin/exam-schedules.html`: 어드민 시험 일정 관리 화면
  - 회차 추가 폼 (자격증, 회차, 시험일)
  - 자격증 필터 드롭다운 (SQLD/SQLP/전체)
  - 회차 테이블 (선택 라디오, 삭제 버튼)
  - fetch API로 PUT/DELETE AJAX 호출

### 수정 파일 - 기존 코드 정리

- `common/exception/constant/ErrorCode.java`: `EXAM_SCHEDULE_DUPLICATE(HttpStatus.CONFLICT)` 추가
- `meta/repository/ExamScheduleRepository.java`: `existsByCertTypeAndRound()` 중복 검사 쿼리 추가
- `meta/service/MetaService.java`: exam-schedule 관련 메서드 3개 + `examScheduleRepository` 필드 제거
- `controller/MetaController.java`: exam-schedule 엔드포인트 3개 제거 (ExamScheduleController로 이관)
- `controller/MetaControllerDocs.java`: exam-schedule 관련 Swagger/ApiLog 문서 3개 제거, Tag 설명 수정
- `templates/admin/layout.html`: 사이드바에 "시험 일정" 메뉴 항목 추가 (calendar-days 아이콘)

## 주요 구현 내용

### 아키텍처 분리

기존 `MetaController`/`MetaService`에 혼재되어 있던 exam-schedule 로직을 전용 서비스로 분리했다. 이를 통해 단일 책임 원칙을 지키고, exam-schedule 관련 CRUD 로직이 독립적으로 관리된다.

### 선택 토글 트랜잭션 보장

`selectSchedule()` 메서드는 `@Transactional`로 기존 선택된 행을 false로 변경한 뒤 대상 행을 true로 설정한다. MySQL에 부분 unique index가 없으므로 서비스 레이어에서 단일 선택 불변식을 보장한다.

### Entity 직접 노출 제거

기존에는 `ExamSchedule` Entity를 API 응답으로 직접 반환했으나, `ExamScheduleResponse` DTO를 도입하여 Entity-API 간 결합도를 낮췄다.

### Flyway 시드 데이터

`exam_schedule` 테이블 DDL과 SQLD 60~63회 시드 데이터는 V0_0_22 마이그레이션에 이미 포함되어 있으므로 별도 마이그레이션 파일 추가 없이 진행했다.

## 주의사항

- 선택된 행을 삭제해도 다른 행이 자동 선택되지 않는다. 홈 화면 greeting 로직에서 fallback 처리가 필요하다.
- `GET /api/exam-schedules/selected`는 선택된 일정이 없을 때 200 OK + null body를 반환한다 (404가 아님).
- version.yml 0.0.23 업데이트는 별도로 수행해야 한다.
