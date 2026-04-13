# Entity UUID 통일 재작성 (PR #22)

작성일: 2026-04-08
관련 이슈: passQL-Lab/passQL#22 (Entity 스키마 보강)
선행 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md`

---

## 1. 목적

기존 Entity가 `Long id IDENTITY` PK와 비즈니스 키 PK가 혼재되어 있어, `server/CLAUDE.md` §Entity 작성 규칙(모든 Entity PK는 무조건 `UUID`)을 위반하고 있다.
이 상태에서 새 도메인(ExamSchedule, DailyChallenge)을 UUID로 추가하면 FK 타입 충돌과 도메인 간 일관성 붕괴가 발생한다.
운영 데이터가 없는 D3 시점이 유일한 정리 기회이므로, **모든 Entity를 UUID PK로 통일하고 Flyway 단일 파일로 전면 재작성**한다.

## 2. 핵심 원칙 (예외 없음)

1. **모든 Entity PK는 `UUID`** + `@GeneratedValue(strategy = GenerationType.UUID)` + `@Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)`
2. **PK 컬럼명은 `{도메인}Uuid`** (예: `topicUuid`, `questionUuid`, `submissionUuid`)
3. **모든 Entity는 `BaseEntity` 상속** (Member는 `SoftDeletableBaseEntity` 유지)
4. **`@Column(name=...)` 금지** — Hibernate naming strategy 신뢰
5. **Boolean 필드는 `Boolean` 래퍼 타입** (primitive `boolean` 금지)
6. **Enum은 `@Enumerated(EnumType.STRING)`**, `constant/` 패키지에 분리
7. **`@OneToMany`/`@ManyToOne`/`@ManyToMany`/`@OneToOne` 사용 금지** — 모든 관계는 `*Uuid` 컬럼 값으로만 표현, join은 Service 레벨에서 명시적 호출
8. **비즈니스 키(`code`, `tagKey`, `settingKey`, `keyName`)는 unique 컬럼으로 보존** — 외부 API/어드민 URL은 비즈니스 키 그대로 유지하여 호환성 확보
9. **매핑 테이블도 자체 UUID PK** + `(부모1Uuid, 부모2Uuid)` unique constraint
10. **MySQL 환경**: 부분 unique index 미지원이므로 "단일 행만 true" 같은 제약은 **서비스 트랜잭션으로 보장**

## 3. 작업 범위

### 포함
- Flyway 단일 마이그레이션 `V0_0_22__rebuild_schema_uuid_unification.sql`
- Entity 12개 재작성 + 신규 4개 (ExamSchedule, DailyChallenge, QuestionConceptTag, CertType enum)
- Repository 시그니처 일괄 `JpaRepository<Entity, UUID>` 전환 + 비즈니스 키 조회 메서드 추가
- Service/Controller 호출부 일괄 수정 (컴파일 에러 따라가며)
- 어드민 템플릿 2개 수정 (`dashboard.html`, `monitor.html`)

### 제외 (별도 이슈)
- ExamSchedule/DailyChallenge **사용자 API/Service 구현** (#003, #005)
- Greeting/Progress/Recommendations 신규 API (#003, #004, #006)
- 어드민 화면 신규 추가 (D5)

## 4. 데이터 모델

> 모든 Entity는 BaseEntity 상속(`createdAt`, `updatedAt`, `createdBy`, `updatedBy` 자동 포함). 표에서는 생략.
> Member는 이미 규칙 100% 준수, **변경 없음** (SoftDeletableBaseEntity 유지).

### 4.1 Meta 도메인 (`PQL-Domain-Meta`)

#### `Topic`
| 필드 | 타입 | 제약 |
|---|---|---|
| `topicUuid` | UUID PK | CHAR(36) |
| `code` | String(100) | NOT NULL, UNIQUE (`uk_topic_code`) |
| `displayName` | String(255) | |
| `sortOrder` | Integer | |
| `isActive` | Boolean | NOT NULL |

#### `Subtopic`
| 필드 | 타입 | 제약 |
|---|---|---|
| `subtopicUuid` | UUID PK | |
| `code` | String(100) | NOT NULL, UNIQUE (`uk_subtopic_code`) |
| `topicUuid` | UUID | NOT NULL, FK→topic.topic_uuid |
| `displayName` | String(255) | |
| `sortOrder` | Integer | |
| `isActive` | Boolean | NOT NULL |
| index | `idx_subtopic_topic_uuid (topic_uuid)` |

#### `ConceptTag`
| 필드 | 타입 | 제약 |
|---|---|---|
| `conceptTagUuid` | UUID PK | |
| `tagKey` | String(100) | NOT NULL, UNIQUE (`uk_concept_tag_key`) |
| `labelKo` | String(255) | |
| `category` | String(100) | |
| `description` | TEXT | |
| `isActive` | Boolean | NOT NULL |
| `sortOrder` | Integer | |

#### `ConceptDoc`
| 필드 | 타입 | 제약 |
|---|---|---|
| `conceptDocUuid` | UUID PK | |
| `conceptTagUuid` | UUID | NOT NULL, FK→concept_tag |
| `title` | String(255) | |
| `bodyMd` | TEXT | |
| `embeddingVersion` | String(100) | |
| `isActive` | Boolean | NOT NULL |
| index | `idx_concept_doc_tag_uuid (concept_tag_uuid)` |

#### `PromptTemplate`
| 필드 | 타입 | 제약 |
|---|---|---|
| `promptTemplateUuid` | UUID PK | |
| `keyName` | String(255) | NOT NULL |
| `version` | Integer | NOT NULL |
| `isActive` | Boolean | NOT NULL |
| `model` | String(100) | |
| `systemPrompt` | TEXT | |
| `userTemplate` | TEXT | |
| `temperature` | Float | |
| `maxTokens` | Integer | |
| `note` | String(500) | |
| `extraParamsJson` | JSON | |
| unique | `uk_prompt_template_key_version (key_name, version)` |

#### `AppSetting`
| 필드 | 타입 | 제약 |
|---|---|---|
| `appSettingUuid` | UUID PK | |
| `settingKey` | String(100) | NOT NULL, UNIQUE (`uk_app_setting_key`) |
| `valueType` | String(50) | |
| `valueText` | TEXT | |
| `category` | String(100) | |
| `description` | TEXT | |

#### `ExamSchedule` (신규)
| 필드 | 타입 | 제약 |
|---|---|---|
| `examScheduleUuid` | UUID PK | |
| `certType` | enum CertType | EnumType.STRING, NOT NULL |
| `round` | Integer | NOT NULL |
| `examDate` | LocalDate | NOT NULL |
| `isSelected` | Boolean | NOT NULL DEFAULT FALSE |
| unique | `uk_exam_schedule_cert_round (cert_type, round)` |
| index | `idx_exam_schedule_cert (cert_type)`, `idx_exam_schedule_selected (is_selected)` |

> "전체에서 isSelected=true 1행만"은 MySQL 부분 index 미지원으로 **서비스 트랜잭션으로 보장**한다 (`select` 토글 시 다른 모든 행 false 처리).

#### `CertType` enum (`com.passql.meta.constant`)
```java
public enum CertType { SQLD, SQLP }
```

### 4.2 Question 도메인 (`PQL-Domain-Question`)

#### `Question`
| 필드 | 타입 | 제약 |
|---|---|---|
| `questionUuid` | UUID PK | |
| `topicUuid` | UUID | NOT NULL, FK→topic |
| `subtopicUuid` | UUID | nullable, FK→subtopic |
| `difficulty` | Integer | NOT NULL |
| `executionMode` | enum ExecutionMode | EnumType.STRING |
| `dialect` | enum Dialect | EnumType.STRING |
| `sandboxDbName` | String(255) | |
| `stem` | TEXT | |
| `schemaDisplay` | TEXT | |
| `schemaDdl` | TEXT | |
| `explanationSummary` | TEXT | |
| `extraMetaJson` | JSON | |
| `isActive` | Boolean | NOT NULL DEFAULT TRUE |
| index | `idx_question_topic_uuid (topic_uuid)`, `idx_question_subtopic_uuid (subtopic_uuid)`, `idx_question_active (is_active)` |

#### `QuestionChoice`
| 필드 | 타입 | 제약 |
|---|---|---|
| `questionChoiceUuid` | UUID PK | |
| `questionUuid` | UUID | NOT NULL, FK→question |
| `choiceKey` | String(8) | NOT NULL |
| `kind` | enum ChoiceKind | EnumType.STRING |
| `body` | TEXT | |
| `isCorrect` | Boolean | NOT NULL |
| `rationale` | TEXT | |
| `sortOrder` | Integer | |
| unique | `uk_question_choice (question_uuid, choice_key)` |
| index | `idx_question_choice_question (question_uuid)` |

#### `QuestionConceptTag` (Entity 승격, 신규)
| 필드 | 타입 | 제약 |
|---|---|---|
| `questionConceptTagUuid` | UUID PK | |
| `questionUuid` | UUID | NOT NULL, FK→question |
| `conceptTagUuid` | UUID | NOT NULL, FK→concept_tag |
| unique | `uk_question_concept_tag (question_uuid, concept_tag_uuid)` |
| index | `idx_qct_question (question_uuid)`, `idx_qct_tag (concept_tag_uuid)` |

#### `DailyChallenge` (신규)
| 필드 | 타입 | 제약 |
|---|---|---|
| `dailyChallengeUuid` | UUID PK | |
| `challengeDate` | LocalDate | NOT NULL, UNIQUE (`uk_daily_challenge_date`) |
| `questionUuid` | UUID | NOT NULL, FK→question |
| index | `idx_daily_challenge_question (question_uuid)` |

### 4.3 Member 도메인 (`PQL-Domain-Member`)

**변경 없음.** 이미 UUID PK + SoftDeletableBaseEntity 적용. ✅

### 4.4 Submission 도메인 (`PQL-Domain-Submission`)

#### `Submission` (전면 재작성)
| 필드 | 타입 | 제약 |
|---|---|---|
| `submissionUuid` | UUID PK | |
| `memberUuid` | UUID | NOT NULL, FK→member (필드명 통일: 기존 `userUuid` → `memberUuid`) |
| `questionUuid` | UUID | NOT NULL, FK→question |
| `selectedChoiceKey` | String(8) | NOT NULL |
| `isCorrect` | Boolean | NOT NULL |
| `submittedAt` | LocalDateTime | NOT NULL |
| index | `idx_submission_member (member_uuid)`, `idx_submission_member_submitted (member_uuid, submitted_at)`, `idx_submission_member_question (member_uuid, question_uuid)`, `idx_submission_question (question_uuid)` |

#### `ExecutionLog` (전면 재작성)
| 필드 | 타입 | 제약 |
|---|---|---|
| `executionLogUuid` | UUID PK | |
| `memberUuid` | UUID | nullable (비로그인 실행 허용), FK→member |
| `questionUuid` | UUID | NOT NULL, FK→question |
| `choiceKey` | String(8) | |
| `sqlText` | TEXT | |
| `status` | String(50) | |
| `errorCode` | String(100) | |
| `errorMessage` | TEXT | |
| `rowCount` | Integer | |
| `elapsedMs` | Long | |
| `executedAt` | LocalDateTime | NOT NULL |
| index | `idx_execution_log_member (member_uuid)`, `idx_execution_log_question (question_uuid)`, `idx_execution_log_executed_at (executed_at)` |

---

## 5. Flyway 마이그레이션

### 5.1 파일

`server/PQL-Web/src/main/resources/db/migration/V0_0_22__rebuild_schema_uuid_unification.sql`

`version.yml`은 `0.0.22` 그대로 유지 (V0_0_22 마이그레이션이 이력에 없음 → 새 파일 1개 추가). 한 버전당 마이그레이션 1개 원칙 준수.

### 5.2 구조

#### Phase 1: DROP (FK 의존 역순)
```sql
DROP TABLE IF EXISTS question_concept_tag;
DROP TABLE IF EXISTS question_choice;
DROP TABLE IF EXISTS daily_challenge;
DROP TABLE IF EXISTS submission;
DROP TABLE IF EXISTS execution_log;
DROP TABLE IF EXISTS concept_doc;
DROP TABLE IF EXISTS prompt_template;
DROP TABLE IF EXISTS app_setting;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS subtopic;
DROP TABLE IF EXISTS topic;
DROP TABLE IF EXISTS concept_tag;
DROP TABLE IF EXISTS exam_schedule;
-- member는 DROP하지 않음
```

#### Phase 2: CREATE (FK 의존 순)
1. `topic`
2. `subtopic` (→ topic)
3. `concept_tag`
4. `concept_doc` (→ concept_tag)
5. `app_setting`
6. `prompt_template`
7. `exam_schedule` (신규)
8. `question` (→ topic, subtopic)
9. `question_choice` (→ question)
10. `question_concept_tag` (→ question, concept_tag)
11. `daily_challenge` (→ question, 신규)
12. `submission` (→ member, question)
13. `execution_log` (→ member, question)

각 테이블 DDL:
- 모든 PK는 `CHAR(36) NOT NULL`
- BaseEntity 컬럼 4개 포함: `created_at DATETIME(6), updated_at DATETIME(6), created_by VARCHAR(255), updated_by VARCHAR(255)`
- FK는 명시적 `FOREIGN KEY (col) REFERENCES parent(col)` 선언
- 인덱스/유니크는 `INDEX idx_..., CONSTRAINT uk_... UNIQUE (...)` 형식

#### Phase 3: SEED
- **app_setting 12개** (`exam.target_date` 제거 — exam_schedule이 책임)
- **prompt_template 3종 v1** (기존 동일)
- **topic 9개** (기존 동일)
- **exam_schedule SQLD 60~63회** (61회 selected)

시드는 PK가 UUID라 `ON DUPLICATE KEY UPDATE` 사용 불가 → **`INSERT ... SELECT WHERE NOT EXISTS`** 패턴으로 변경. UUID 생성은 MySQL `UUID()` 함수 사용.

```sql
-- 예시
INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.pass_score', 'INT', '60', 'exam', '합격 기준 점수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.pass_score');
```

**exam_schedule 시드:**
```
SQLD | 60 | 2026-03-07 | false
SQLD | 61 | 2026-05-31 | true   ← 기본 선택
SQLD | 62 | 2026-08-22 | false
SQLD | 63 | 2026-11-14 | false
```

---

## 6. Java 코드 영향

### 6.1 Entity 재작성 목록

| 모듈 | Entity | 작업 |
|---|---|---|
| PQL-Common | BaseEntity | 변경 없음 |
| PQL-Domain-Meta | Topic, Subtopic, ConceptTag, ConceptDoc, PromptTemplate, AppSetting | 재작성 |
| PQL-Domain-Meta | **ExamSchedule, CertType** | 신규 |
| PQL-Domain-Question | Question, QuestionChoice | 재작성 |
| PQL-Domain-Question | **QuestionConceptTag, DailyChallenge** | 신규 |
| PQL-Domain-Submission | Submission, ExecutionLog | 재작성 |
| PQL-Domain-Member | Member | 변경 없음 ✅ |

### 6.2 Repository 변경

모든 Repository 시그니처 → `JpaRepository<Entity, UUID>`.

추가 메서드:
- `TopicRepository`: `Optional<Topic> findByCode(String code)`
- `SubtopicRepository`: `Optional<Subtopic> findByCode(String code)`, `List<Subtopic> findByTopicUuid(UUID)`
- `ConceptTagRepository`: `Optional<ConceptTag> findByTagKey(String)`
- `AppSettingRepository`: `Optional<AppSetting> findBySettingKey(String)`
- `PromptTemplateRepository`: `Optional<PromptTemplate> findByKeyNameAndVersion(String, int)`, `Optional<PromptTemplate> findFirstByKeyNameAndIsActiveTrueOrderByVersionDesc(String)`
- `QuestionRepository`: `List<Question> findByIsActiveTrue()`, native query for ordered active uuids
- `QuestionChoiceRepository`: `List<QuestionChoice> findByQuestionUuidOrderBySortOrder(UUID)`
- `SubmissionRepository`: 모두 `memberUuid`/`questionUuid` 기반으로 재작성
- `ExecutionLogRepository`: 동일

신규 Repository:
- `ExamScheduleRepository` (`findByIsSelectedTrue`, `findByCertTypeOrderByExamDateAsc`)
- `DailyChallengeRepository` (`findByChallengeDate`, `findByChallengeDateBetween`)
- `QuestionConceptTagRepository` (`findByQuestionUuid`, `findByConceptTagUuid`, `existsByQuestionUuidAndConceptTagUuid`)

### 6.3 Service/Controller 호출부

기본 패턴: **외부 노출 식별자는 비즈니스 키 그대로**, 내부에서 UUID로 변환.
- `MetaService.getTopics()` — Topic Entity → DTO 변환 시 `code`/`displayName` 그대로 노출
- `QuestionService.list(topicCode, ...)` — `topicRepo.findByCode(topicCode).map(t -> questionRepo.findByTopicUuid(t.uuid))`
- `AppSettingService.get(key)` — `appSettingRepo.findBySettingKey(key)`
- `PromptService.getActive(keyName)` — 동일
- `SubmissionService` / `ProgressService` — `userUuid String` 시그니처를 `memberUuid UUID`로 일괄 전환
- `QuestionExecutionService` — `questionId Long` → `questionUuid UUID`

Controller:
- `Long id`를 PathVariable로 받던 곳을 `UUID uuid`로 전환 (기존 코드에는 거의 없음 — 대부분 비즈니스 키 또는 Long 사용 안 함)
- DTO 필드 타입 변경 (questionId Long → questionUuid UUID, userUuid String → memberUuid UUID)

### 6.4 ⚠️ 주의: `hibernate.ddl-auto = update`

CLAUDE.md 명시: Hibernate가 실제 스키마를 관리. 따라서 Flyway 적용 후 부팅 시 Hibernate 검증이 함께 동작.
**Entity ↔ Flyway DDL ↔ 실제 DB 컬럼명/타입 100% 일치**해야 부팅 성공. 작업 완료 후 반드시 로컬 부팅으로 검증.

---

## 7. 어드민 영향

### 7.1 변경 필요한 템플릿

| 파일 | 라인 | 변경 |
|---|---|---|
| `dashboard.html` | 106 | `log.userUuid` → `log.memberUuid` |
| `dashboard.html` | 107 | `log.questionId` → `${#strings.substring(log.questionUuid, 0, 8) + '...'}` |
| `monitor.html` | 79 | `log.userUuid` → `log.memberUuid` |
| `monitor.html` | 80 | `log.questionId` → `${#strings.substring(log.questionUuid, 0, 8) + '...'}` |
| `questions.html` | 87 | `q.topicCode` 표시 — 목록 DTO에 `topicCode` 필드 유지하여 그대로 동작 |

### 7.2 변경 없는 템플릿 (비즈니스 키 보존 덕분)

- `concepts.html` — `tagKey` URL 패턴 유지
- `question-form.html` — `topicCode`/`subtopicCode` 폼 필드 + `/admin/api/subtopics?topicCode=...` JS fetch 그대로
- `topics.html` — `topicCode` URL 유지
- `prompts.html` — `keyName` 기반
- `settings.html` — `settingKey` 기반

### 7.3 컨트롤러

- `AdminQuestionController`는 현재 거의 비어있음(`list()` TODO 수준), 영향 없음
- 다른 어드민 컨트롤러는 PathVariable로 Long을 사용하지 않음 → 컨트롤러 시그니처 변경 거의 없음
- 단, **DTO 변환 매핑 로직은 영향**: ExecutionLog/Submission DTO를 만드는 곳에서 `userUuid`→`memberUuid`, `questionId`→`questionUuid` 필드명 일괄 변경

---

## 8. 작업 순서

1. `version.yml` 확인 — 0.0.22 그대로 유지
2. `V0_0_22__rebuild_schema_uuid_unification.sql` 작성
   - DROP → CREATE → SEED 전체 단일 파일
3. Entity 재작성 (의존 순)
   - Meta: Topic → Subtopic → ConceptTag → ConceptDoc → AppSetting → PromptTemplate → ExamSchedule + CertType
   - Question: Question → QuestionChoice → QuestionConceptTag → DailyChallenge
   - Submission: Submission → ExecutionLog
4. Repository 시그니처 일괄 수정 + 비즈니스 키 조회 메서드 추가 + 신규 3개
5. Service 호출부 수정 (컴파일 에러 따라가며)
   - MetaService, QuestionService, AppSettingService, PromptService
   - SubmissionService, ProgressService, QuestionExecutionService
6. Controller DTO 매핑 수정
7. 어드민 템플릿 5개 수정 (dashboard, monitor, questions)
8. 로컬 부팅 검증 (Flyway 적용 + Hibernate validate 통과)
9. 핵심 API 1~2개 curl 검증 (헬스체크, members/me, questions list)

## 9. 리스크

- **컴파일 에러 도미노**: Service/Controller 모두 영향. 한 번에 일관되게 잡아야 한다. 모듈 의존 순으로 작업해 빌드 에러를 점진적으로 해소.
- **`ddl-auto=update`와의 정합성**: Entity ↔ SQL 컬럼 매칭 검증 실패 시 부팅 실패. Hibernate naming strategy 자동 변환을 신뢰하되, JSON/TEXT/CHAR(36) 같은 columnDefinition은 명시적으로 일치시켜야 함.
- **시드 멱등성**: 기존 `ON DUPLICATE KEY UPDATE`를 `INSERT ... SELECT WHERE NOT EXISTS`로 바꾸는 과정에서 `created_at`/`updated_at` 컬럼 누락 시 NOT NULL 제약 위반 가능 → `NOW(6)`를 명시.
- **MySQL FK 제약 충돌**: DROP 순서를 잘못 잡으면 FK 위반. Phase 1 의존 역순 준수.
- **테스트 코드 영향**: 기존 테스트가 Long ID를 가정하면 모두 깨짐. 컴파일 후 테스트도 수정 또는 일시 비활성화.

## 10. 비범위 (재확인)

- ExamSchedule/DailyChallenge 사용자 API/Service 구현 — 별도 이슈
- Greeting/Progress/Recommendations 신규 API — 별도 이슈
- 신규 어드민 화면 (exam-schedules, daily-challenges) — D5
- ai_call_log, member_activity 등 PRD Open Questions 항목 — Phase 2
