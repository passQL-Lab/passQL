# Exam Schedule 도메인 및 API 설계

> GitHub Issue: #23 — sqld, sqlp 시험에 대한 Exam Schedule 도메인 및 시험 일정 관리 API 구현
> 날짜: 2026-04-08
> 버전: v0.0.23

## 1. 개요

홈 화면 인사말에 "시험 D-day"를 표시하기 위해 시험 일정을 DB에서 관리하고, 전체 시스템에서 단 하나의 목표 시험을 선택할 수 있도록 한다. 어드민 화면을 통해 회차 등록/선택/삭제를 관리한다.

## 2. 기존 코드 현황

| 항목 | 상태 | 위치 |
|------|------|------|
| `ExamSchedule` 엔티티 | 존재 | `PQL-Domain-Meta/entity/ExamSchedule.java` |
| `CertType` enum | 존재 | `PQL-Domain-Meta/constant/CertType.java` |
| `ExamScheduleRepository` | 존재 | `PQL-Domain-Meta/repository/ExamScheduleRepository.java` |
| DB 테이블 (`exam_schedule`) | V0_0_22에서 생성 | `V0_0_22__rebuild_schema_uuid_unification.sql` |
| 시드 데이터 (SQLD 60~63회) | V0_0_22에 포함 | 동일 파일 Phase 3 |
| Service | **미구현** | - |
| DTO | **미구현** | - |
| Controller (사용자 API) | **미구현** | - |
| Controller (어드민 API) | **미구현** | - |
| Thymeleaf 어드민 화면 | **미구현** | - |

## 3. 신규 구현 목록

### 3.1 ExamScheduleService

위치: `PQL-Domain-Meta/src/main/java/com/passql/meta/service/ExamScheduleService.java`

```
@Service + @RequiredArgsConstructor
@Transactional(readOnly = true) 클래스 레벨

메서드:
- getSchedulesByCertType(CertType) : List<ExamScheduleResponse>
- getSelectedSchedule() : ExamScheduleResponse (없으면 null)
- getAllSchedules(CertType) : List<ExamScheduleResponse>  // 어드민용, null이면 전체
- createSchedule(certType, round, examDate) : ExamScheduleResponse
  - (certType, round) 중복 시 409 CONFLICT 예외
- selectSchedule(UUID) : void
  - @Transactional: 기존 isSelected=true인 행을 false로 변경 후 대상 행을 true로
- deleteSchedule(UUID) : void
  - @Transactional: 선택된 행 삭제 시 다른 행 자동선택 안 함
```

### 3.2 DTO

위치: `PQL-Domain-Meta/src/main/java/com/passql/meta/dto/`

**ExamScheduleResponse**
```java
@Getter @AllArgsConstructor
- UUID examScheduleUuid
- String certType     // CertType.name()
- Integer round
- LocalDate examDate
- Boolean isSelected
+ static from(ExamSchedule) 팩토리 메서드
```

**ExamScheduleCreateRequest**
```java
@Getter @NoArgsConstructor
- String certType    // "SQLD" | "SQLP"
- Integer round
- LocalDate examDate
```

### 3.3 사용자 API Controller

위치: `PQL-Web/src/main/java/com/passql/web/controller/ExamScheduleController.java`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/exam-schedules?certType=SQLD` | 회차 리스트 조회 |
| GET | `/api/exam-schedules/selected` | 현재 선택된 회차 1개 (없으면 200 + null) |

### 3.4 어드민 API + Thymeleaf Controller

위치: `PQL-Web/src/main/java/com/passql/web/controller/admin/AdminExamScheduleController.java`

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/exam-schedules` | Thymeleaf 페이지 렌더링 |
| POST | `/admin/exam-schedules` | 회차 추가 (폼 제출) |
| PUT | `/admin/exam-schedules/{uuid}/select` | 선택 토글 (AJAX) |
| DELETE | `/admin/exam-schedules/{uuid}` | 회차 삭제 (AJAX) |

### 3.5 Thymeleaf 어드민 화면

위치: `PQL-Web/src/main/resources/templates/admin/exam-schedules.html`

- layout.html 상속 (Thymeleaf Layout Dialect)
- DaisyUI + Tailwind CSS 4 + Lucide Icons (기존 어드민 패턴 따름)
- 구성요소:
  - 자격증 필터 드롭다운 (SQLD/SQLP/전체)
  - 회차 테이블 (round, examDate, isSelected, actions)
  - "선택" 버튼 (라디오), "삭제" 버튼
  - 상단 "회차 추가" 폼 (certType, round, examDate)
  - fetch API로 PUT/DELETE 호출 후 페이지 리로드

### 3.6 사이드바 메뉴 추가

`layout.html`에 "시험 일정" 메뉴 항목 추가 (lucide icon: `calendar-days`)

### 3.7 Repository 보완

기존 `ExamScheduleRepository`에 추가 쿼리:
- `boolean existsByCertTypeAndRound(CertType certType, Integer round)` — 중복 검사용

### 3.8 Flyway 마이그레이션

**V0_0_23 마이그레이션은 불필요** — 테이블 DDL과 시드 데이터 모두 V0_0_22에 이미 포함됨.
단, version.yml을 0.0.23으로 업데이트하여 이번 기능이 v0.0.23에 포함됨을 표시.

## 4. 에러 처리

| 상황 | HTTP 코드 | 처리 |
|------|-----------|------|
| (certType, round) 중복 등록 | 409 Conflict | `CustomException` + `ErrorCode` |
| UUID로 조회 실패 | 404 Not Found | `CustomException` + `ErrorCode` |
| 선택된 일정 없음 | 200 OK + null body | 정상 처리 (greeting 쪽 fallback) |

## 5. 파일 목록 (신규/수정)

| 파일 | 작업 |
|------|------|
| `PQL-Domain-Meta/.../service/ExamScheduleService.java` | **신규** |
| `PQL-Domain-Meta/.../dto/ExamScheduleResponse.java` | **신규** |
| `PQL-Domain-Meta/.../dto/ExamScheduleCreateRequest.java` | **신규** |
| `PQL-Domain-Meta/.../repository/ExamScheduleRepository.java` | **수정** (existsBy 추가) |
| `PQL-Web/.../controller/ExamScheduleController.java` | **신규** |
| `PQL-Web/.../controller/admin/AdminExamScheduleController.java` | **신규** |
| `PQL-Web/.../templates/admin/exam-schedules.html` | **신규** |
| `PQL-Web/.../templates/admin/layout.html` | **수정** (사이드바 메뉴 추가) |
| `PQL-Common/.../ErrorCode.java` | **수정** (EXAM_SCHEDULE 관련 에러코드 추가) |
| `version.yml` | **수정** (0.0.22 → 0.0.23) |
