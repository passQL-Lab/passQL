# #22 Entity 스키마 보강 — UUID 전면 통일 재작성 및 홈 화면 API 와이어링

## 개요

이슈 #22는 원래 `submission` 테이블과 `question.is_active` 컬럼만 추가하는 범위였으나, 작업 착수 과정에서 기존 엔티티들이 `Long IDENTITY` PK와 비즈니스 키 PK를 혼용하고 있어 `server/CLAUDE.md`의 "모든 Entity PK는 UUID" 규칙을 위반하고 있음을 확인했다. 운영 데이터가 없는 D3 시점을 활용해 부분 보강 대신 **전체 스키마 DROP → UUID PK 기반 재작성**으로 범위를 확장했고, 동시에 D3 후속 이슈(#4 Progress, #5 Daily Challenge, #6 Recommendations)의 선행 작업까지 한 번에 끌어들여 선반영했다. Flyway `V0_0_22` 단일 파일이 스키마의 단일 진실(single source of truth)이며, 모든 Entity와 Repository는 이 파일에 맞춰 재작성되었다.

## 변경 사항

### Flyway 마이그레이션
- `server/PQL-Web/src/main/resources/db/migration/V0_0_22__rebuild_schema_uuid_unification.sql`: 신규. Phase 1 (DROP, FK 역순 13개 테이블) → Phase 2 (CREATE, FK 순 재생성) → Phase 3 (시드: `app_setting` 12개, `prompt_template` 3종, `topic` 9개, `exam_schedule` 4개)의 3단 구조. `member` 테이블은 이미 UUID 준수이므로 DROP 대상에서 제외. 신규 테이블 `exam_schedule`, `daily_challenge`, `question_concept_tag` 포함.

### Meta 도메인 — Entity/Repository 재작성
- `PQL-Domain-Meta/entity/Topic.java`, `Subtopic.java`, `ConceptTag.java`, `ConceptDoc.java`, `AppSetting.java`, `PromptTemplate.java`: PK를 `UUID {domain}Uuid`로 전환, `BaseEntity` 상속, `@Column(name=...)` 제거, `Boolean` 래퍼 타입 적용. 비즈니스 키(`code`, `tagKey`, `settingKey`, `keyName+version`)는 unique 컬럼으로 보존.
- `PQL-Domain-Meta/entity/ExamSchedule.java`: 신규. `certType`(CertType enum), `round`, `examDate`, `isSelected` 필드. `UNIQUE(cert_type, round)` 보유.
- `PQL-Domain-Meta/constant/CertType.java`: 신규 enum (`SQLD`, `SQLP`).
- `PQL-Domain-Meta/repository/*.java`: 전부 `JpaRepository<Entity, UUID>`로 시그니처 변경. 비즈니스 키 조회 메서드 추가(`findByCode`, `findByTagKey`, `findBySettingKey`, `findByKeyNameAndVersion`, `findFirstByKeyNameAndIsActiveTrueOrderByVersionDesc`).
- `PQL-Domain-Meta/repository/ExamScheduleRepository.java`: 신규. `findAllByOrderByCertTypeAscRoundAsc`, `findByCertTypeOrderByRoundAsc`, `findFirstByIsSelectedTrue`, `findByCertTypeAndRound`.

### Question 도메인 — Entity/Repository 재작성
- `PQL-Domain-Question/entity/Question.java`: PK `UUID questionUuid`, FK를 `UUID topicUuid` / `UUID subtopicUuid`로 전환, `isActive Boolean` 신설. `ExecutionMode`, `Dialect` enum 값 보존.
- `PQL-Domain-Question/entity/QuestionChoice.java`: PK `UUID questionChoiceUuid`, FK `UUID questionUuid`. `BaseEntity` 상속으로 전환. `UNIQUE(question_uuid, choice_key)` 보유.
- `PQL-Domain-Question/entity/QuestionConceptTag.java`: 신규. 기존 OneToMany 매핑 관계를 독립 엔티티로 승격.
- `PQL-Domain-Question/entity/DailyChallenge.java`: 신규. `challengeDate`(UNIQUE), `questionUuid`.
- `PQL-Domain-Question/repository/QuestionRepository.java`: `findByIsActiveTrue(Pageable)`, `findByTopicUuid`, `findActiveUuidsOrderedByCreatedAt`, `findRandomActive(size)` / `findRandomActiveExcluding(size, excludeUuid)` 2분기 네이티브 쿼리.
- `PQL-Domain-Question/repository/QuestionChoiceRepository.java`, `QuestionConceptTagRepository.java`, `DailyChallengeRepository.java`: 신규 또는 UUID 기반으로 재작성.

### Submission 도메인 — Entity/Repository 재작성
- `PQL-Domain-Submission/entity/Submission.java`: PK `UUID submissionUuid`, `userUuid(String)` → `memberUuid(UUID)`, `questionId(Long)` → `questionUuid(UUID)`, `selectedKey` → `selectedChoiceKey`. `BaseEntity` 상속으로 전환.
- `PQL-Domain-Submission/entity/ExecutionLog.java`: PK `UUID executionLogUuid`, `memberUuid`(nullable), `questionUuid`. `BaseEntity` 상속으로 전환.
- `PQL-Domain-Submission/repository/SubmissionRepository.java`: `countDistinctQuestionUuidByMemberUuid`, `existsByMemberUuidAndQuestionUuidAndSubmittedAtBetween`, `calculateCorrectRateByMemberUuid` (CTE + Window Function 네이티브 쿼리), `findSubmissionDatesByMemberUuid`.
- `PQL-Domain-Submission/repository/ExecutionLogRepository.java`: UUID 기반 조회 메서드.

### Service 계층
- `PQL-Domain-Meta/service/MetaService.java`: `ExamScheduleRepository` 주입, `getAllExamSchedules`, `getSelectedExamSchedule`, `@Transactional selectExamSchedule(UUID)` 추가. `selectExamSchedule`은 MySQL의 partial unique index 부재를 서비스 레벨 트랜잭션(기존 선택 전부 해제 → 대상 true 설정)으로 보완.
- `PQL-Domain-Meta/service/AppSettingService.java`, `PromptService.java`: UUID 전환에 따른 조회 메서드 이름 교체.
- `PQL-Domain-Question/service/QuestionService.java`: 전면 재작성. `getQuestion(UUID)`, `getQuestionEntity(UUID)`, `resolveTodayQuestion()`(큐레이션 hit → 폴백), `getRecommendations(size, excludeUuid)`(1~5 clamp, exclude 미지정 시 오늘 daily_challenge 자동 제외), `toSummary(Question)`(`stem` 100자 preview). `TopicRepository` / `SubtopicRepository`를 주입해 `topicName` / `subtopicName` 해석.
- `PQL-Domain-Submission/service/ProgressService.java`: `getProgress(UUID memberUuid) → ProgressResponse` 구현. 정답률은 마지막 시도 기준, 소수 둘째자리 반올림. 스트릭은 "하루 그레이스" 정책(오늘 미제출이어도 어제까지 연속이면 유지) 인라인 구현.
- `PQL-Domain-Submission/service/SubmissionService.java`: 스텁에서 실구현으로 전환. 선택지 조회 → 정답 판정 → `Submission` 영속화 → `SubmitResult` 반환.
- `PQL-Application/service/HomeService.java`: 신규. `QuestionService`(오늘의 문제 결정) + `SubmissionRepository`(오늘 풀었는지) 조합 전담. Controller가 Submission Repository에 직접 의존하던 경계 위반을 제거하기 위해 Application 모듈에 배치.

### Controller / DTO / Docs
- `PQL-Web/controller/QuestionController.java`: `GET /api/questions/today` (HomeService로 위임), `GET /api/questions/recommendations` (size 기본 3 · 최대 5 · exclude 자동 추출), `GET /api/questions/{questionUuid}`, `POST /submit`(헤더 `X-Member-UUID`, body `selectedChoiceKey`, 구 필드명 `selectedKey` 한시 fallback).
- `PQL-Web/controller/MetaController.java`: `GET /api/exam-schedules`, `GET /api/exam-schedules/selected`, `PUT /api/exam-schedules/{uuid}/select` 3개 엔드포인트 신규.
- `PQL-Web/controller/ProgressController.java`: `GET /api/progress?memberUuid=` 단일 엔드포인트로 통합, `ProgressResponse` 반환.
- `PQL-Web/controller/AiController.java`: 헤더 `X-User-UUID(String)` → `X-Member-UUID(UUID)`, body/path `questionId(Long)` → `questionUuid(UUID)`.
- `PQL-Web/controller/*Docs.java`: `QuestionControllerDocs`, `MetaControllerDocs`(ExamSchedule 3개 선언 신규 추가), `ProgressControllerDocs`, `AiControllerDocs`에 `@ApiLog(issueNumber=22)` 변경 이력과 `@Operation(description=...)` 상세 설명 보강. `MetaControllerDocs`는 기존에 Controller 구현은 있는데 Docs 인터페이스 선언이 누락되어 있던 ExamSchedule 엔드포인트 3건을 일괄 정합화.
- `PQL-Domain-Question/dto/QuestionSummary.java`, `QuestionDetail.java`: UUID 필드와 `topicName` / `subtopicName` 기반으로 전환.
- `PQL-Domain-Question/dto/TodayQuestionResponse.java`, `RecommendationsResponse.java`: 신규.
- `PQL-Domain-Submission/dto/ProgressResponse.java`: 신규. `{solvedCount, correctRate, streakDays}`.
- `PQL-Domain-AI/dto/SimilarQuestion.java`: `Long id` → `UUID questionUuid`, `topicName` 추가.
- `PQL-Common/exception/constant/ErrorCode.java`: `EXAM_SCHEDULE_NOT_FOUND` 추가.

### 어드민 템플릿
- `PQL-Web/resources/templates/admin/dashboard.html`, `monitor.html`: 로그 테이블에서 `log.userUuid` → `log.memberUuid`, `log.questionId` → `log.questionUuid` 치환. UUID 8자 prefix 표기와 null 방어 추가.

## 주요 구현 내용

### 단일 진실 원칙(Single Source of Truth)
Flyway `V0_0_22`가 스키마의 단일 진실이다. Entity 필드명은 `SpringPhysicalNamingStrategy`의 camelCase → snake_case 자동 변환에 의존하므로 `@Column(name=...)`을 일절 사용하지 않는다. Entity와 SQL의 컬럼명 정합성은 네이밍 규칙으로 강제된다.

### UUID PK 통일 — 예외 없음
`Topic`, `ConceptTag`, `AppSetting`처럼 자연스럽게 비즈니스 키를 PK로 쓸 수 있는 엔티티들도 전부 UUID PK로 전환했다. 비즈니스 키(`code`, `tagKey`, `settingKey`)는 별도 unique 컬럼으로 보존했기 때문에 외부 API/어드민 URL 호환성은 유지된다.

### OneToMany 금지 — 중간 테이블 엔티티 승격
`@OneToMany` / `@ManyToOne` 등 JPA 관계 어노테이션을 사용하지 않는다. FK는 전부 `private UUID xxxUuid` 필드로 보관하고, 기존의 매핑 관계는 독립 엔티티(`QuestionConceptTag`)로 승격시켰다. 장기적인 로딩 제어권과 성능 예측 가능성을 확보하기 위한 결정이다.

### 데일리 챌린지 큐레이션 + 날짜 시드 폴백
`QuestionService.resolveTodayQuestion()`은 `daily_challenge` 테이블에 오늘 날짜 행이 있으면 그것을 사용하고, 없으면 `findActiveUuidsOrderedByCreatedAt()` 리스트에서 `today.toEpochDay() mod size` 인덱스의 문제를 선택한다. 같은 날짜는 항상 같은 폴백 결과를 반환한다(결정성).

### 추천 쿼리 UUID 타입 안전성
초기 구현은 `(:excludeUuid IS NULL OR question_uuid <> :excludeUuid)` 단일 쿼리로 시작했으나, MySQL JDBC가 null `String`을 VARBINARY로 바인딩할 수 있는 리스크와 CHAR(36) 비교 시 타입 힌트 불명확성을 피하기 위해 `findRandomActive(size)`와 `findRandomActiveExcluding(size, excludeUuid)` 두 쿼리로 분리했다.

### 모듈 경계 복원 — HomeService Facade
`QuestionController`가 `SubmissionRepository`를 직접 주입해 `alreadySolvedToday`를 계산하던 리팩토링 직전 상태는 레이어드 아키텍처 위반이었다. `PQL-Application/service/HomeService`로 조합 로직을 옮겨 Controller는 Facade만 호출하도록 정리했다. Application 모듈은 Question과 Submission 모듈을 모두 참조할 수 있는 위치에 있어 순환 의존 걱정 없이 조합 로직을 수용한다.

### ExamSchedule 단일 선택 불변식
MySQL에는 partial unique index가 없어 "`is_selected = true`인 행은 최대 1개"를 DB 제약으로 강제할 수 없다. `MetaService.selectExamSchedule`은 `@Transactional` 블록 안에서 기존 선택 전부 해제 → 대상 true 설정 순서로 불변식을 보장한다.

## 주의사항

### Flyway V0_0_22는 파괴적 마이그레이션
이 파일은 `member`를 제외한 모든 기존 테이블을 DROP한다. 운영 데이터가 없는 D3 pre-launch 시점이기 때문에 허용된 선택이며, **이력에 한 번 박히면 되돌릴 수 없다**. 차기 버전(V0_0_23+)부터는 DROP 금지 원칙을 다시 준수해야 한다.

### 남아있는 스텁
`SandboxExecutor.execute`, `AiService.explainError/diffExplain/getSimilar`, `QuestionExecutionService.executeChoice`는 시그니처만 UUID로 맞춰 두고 본문은 `UnsupportedOperationException("TODO")`을 던진다. 컴파일은 되지만 호출 시 런타임 500이 발생하므로 해당 엔드포인트 호출 전에 실구현 필수.

### QuestionService.getQuestions 필터 파라미터 무시
`topic`, `subtopic`, `difficulty`, `mode` 파라미터를 수용하지만 현재는 조용히 무시한다. 활성 문제 전체를 페이지 단위로 반환하므로 클라이언트에서 필터링을 기대하면 디버깅 시간이 낭비될 수 있다. Specification 기반 필터링은 별도 이슈에서 구현 예정.

### 정답률/스트릭 네이티브 쿼리는 MySQL 8.0+ 전제
`calculateCorrectRateByMemberUuid`는 CTE + Window Function을 사용한다. MySQL 8.0 미만 환경에서는 동작하지 않는다.

### `selectedChoiceKey` 마이그레이션 한시 지원
제출 API는 body 필드명이 `selectedChoiceKey`로 변경됐지만, 구 클라이언트 호환을 위해 `selectedKey`로 들어와도 한시적으로 수용한다. 클라이언트 전환 완료 후 fallback 코드는 제거 필요.

### 홈 화면 클라이언트 Breaking Change 요약
- 문제 식별자: `Long id` → `UUID questionUuid`
- 토픽 식별자: `String topicCode` → `UUID topicUuid` + `topicName`
- 회원 식별 헤더: `X-User-UUID(String)` → `X-Member-UUID(UUID)`
- 제출 body: `selectedKey` → `selectedChoiceKey`
- AI body/path: `questionId` → `questionUuid`
- `SimilarQuestion` DTO: `{id, ...}` → `{questionUuid, stem, topicName, score}`
- `GET /api/progress` 파라미터: `userUuid` → `memberUuid`

### 신규 엔드포인트
- `GET /api/questions/today?memberUuid=`
- `GET /api/questions/recommendations?size=&excludeQuestionUuid=`
- `GET /api/progress?memberUuid=`
- `GET /api/exam-schedules`, `GET /api/exam-schedules/selected`, `PUT /api/exam-schedules/{uuid}/select`
