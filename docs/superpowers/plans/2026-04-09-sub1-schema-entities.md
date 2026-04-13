# Sub-plan 1: DB 스키마 + ErrorCode + Entity 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실시간 선택지 세트 생성 기능의 데이터 계층 기반을 만든다 — Flyway V0_0_28 마이그레이션, 신규 Entity 3종, 기존 Entity 2종 확장, Repository 3종, ErrorCode 17종 추가.

**Architecture:** Flyway ALTER 기반으로 기존 `question`/`submission` 테이블을 확장하고, 신규 3개 테이블(`question_choice_set`, `question_choice_set_item`, `quiz_session`)을 추가한다. 기존 `question_choice` 테이블은 이 플랜에서 건드리지 않고(이후 sub-plan에서 정리), 런타임 선택지는 `question_choice_set` 계열로만 기록한다. 모든 PK는 코드베이스 기존 관습인 **CHAR(36) UUID**(스펙의 BINARY(16)은 미채택)을 따르고, Entity는 `BaseEntity` 감사 필드 규약을 따른다.

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, Flyway, MariaDB, Lombok, JUnit 5, `@SpringBootTest` 통합 테스트 (코드베이스 기존 테스트 패턴)

---

## 스펙과의 차이 (의도적)

| 항목 | 스펙(2026-04-09 design.md) | 플랜 (이 문서) | 이유 |
|---|---|---|---|
| PK 타입 | `BINARY(16)` | **`CHAR(36)`** | 기존 V0_0_22 전 테이블이 CHAR(36) UUID. 혼재 금지(server/CLAUDE.md §Entity 규약). |
| `is_active` 컬럼 | `BOOLEAN` | **`TINYINT(1)` + Entity `Boolean`** | 기존 관습 일치 (question/topic/subtopic 등 전부 이 패턴) |
| `question` 테이블 | DROP 후 재생성 | **ALTER TABLE로 컬럼 추가** | 기존 시드/운영 데이터 보존. 신규 컬럼(`schema_sample_data`, `schema_intent`, `answer_sql`, `hint`, `choice_set_policy`)만 추가. |
| 기존 `question_choice` 테이블 | 암시적 제거 전제 | **그대로 유지** | 런타임은 `question_choice_set` 만 사용하므로 공존 가능. 정리는 별도 sub-plan. |
| `submission.choice_set_uuid` FK | NOT NULL 암시 | **NULLABLE** | 기존 submission 레코드 호환. 신규 레코드만 채움. |

---

## 파일 구조

**생성할 파일:**

| 경로 | 책임 |
|---|---|
| `server/PQL-Web/src/main/resources/db/migration/V0_0_28__realtime_choice_set.sql` | Flyway 마이그레이션 (ALTER + CREATE + INSERT) |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetPolicy.java` | enum: AI_ONLY / CURATED_ONLY / HYBRID |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetSource.java` | enum: AI_RUNTIME / AI_PREFETCH / AI_ADMIN_PREVIEW / ADMIN_SEED / ADMIN_CURATED |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetStatus.java` | enum: OK / DISABLED / REPORTED / DRAFT / FAILED |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/QuizSessionStatus.java` | enum: IN_PROGRESS / COMPLETED / ABANDONED |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSet.java` | JPA Entity |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSetItem.java` | JPA Entity |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuizSession.java` | JPA Entity |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetRepository.java` | Spring Data JPA |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetItemRepository.java` | Spring Data JPA |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuizSessionRepository.java` | Spring Data JPA |
| `server/PQL-Domain-Question/src/test/java/com/passql/question/entity/ChoiceSetEntityIntegrationTest.java` | 단일 `@SpringBootTest` 파일 안에서 모든 엔티티 CRUD + 제약 검증 |

**수정할 파일:**

| 경로 | 변경 |
|---|---|
| `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` | ErrorCode 17종 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java` | 컬럼 5개 추가 (`schemaSampleData`, `schemaIntent`, `answerSql`, `hint`, `choiceSetPolicy`) |
| `server/PQL-Domain-Submission/src/main/java/com/passql/submission/entity/Submission.java` | 컬럼 3개 추가 (`choiceSetUuid`, `sessionUuid`, `questionIndex`) |
| `version.yml` | 이번 플랜은 Flyway 버전만 올리고 `version.yml` 은 건드리지 않음 (별도 CI 자동화) |

---

## Task 순서와 의존 관계

1. Task 1: ErrorCode 17종 추가 (가장 먼저, 나머지 태스크에서 참조)
2. Task 2: enum 4종 작성 (ChoiceSetPolicy/Source/Status, QuizSessionStatus)
3. Task 3: Flyway 마이그레이션 V0_0_28 작성
4. Task 4: `Question` Entity 컬럼 5개 추가
5. Task 5: `Submission` Entity 컬럼 3개 추가
6. Task 6: `QuestionChoiceSet` Entity
7. Task 7: `QuestionChoiceSetItem` Entity
8. Task 8: `QuizSession` Entity
9. Task 9: Repository 3종
10. Task 10: 통합 테스트 (`ChoiceSetEntityIntegrationTest`) — 전체 스키마·Entity·Repository 검증
11. Task 11: 플랜 완료 체크 — 전체 빌드 + 기존 테스트 회귀 확인

각 태스크 끝에 커밋이 있지만 **절대 자동 commit 하지 않음** (사용자 CLAUDE.md 규약). 커밋 메시지는 제안만 하고 `git commit` 실행은 사용자가 수동 수행. 에이전트가 실행할 때는 `git commit` 스텝을 **반드시 건너뛴다**.

---

## Task 1: ErrorCode 17종 추가

**Files:**
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: 기존 파일 구조 확인**

파일을 열어 마지막 `NICKNAME_GENERATION_FAILED` 엔트리 위치와 세미콜론 종결(line 55), 필드 선언(line 57-58)을 확인한다. 신규 enum 값은 `NICKNAME_GENERATION_FAILED` 끝의 세미콜론(`);`)을 콤마(`),`)로 바꾸고 그 아래에 추가한다.

- [ ] **Step 2: ErrorCode.java 수정 — NICKNAME_GENERATION_FAILED 뒤에 17개 추가**

`NICKNAME_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "닉네임 생성에 실패했습니다.");` 라인의 끝을 `,` 로 바꾸고 아래 내용을 그 뒤, `private final HttpStatus status;` 라인 위에 삽입한다:

```java
    // === AI Gateway / Choice Set Generation (신규: Sub-plan 1) ===
    AI_SERVER_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버에 연결할 수 없습니다."),
    AI_FALLBACK_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버와 대체 경로 모두 실패했습니다."),
    AI_RESPONSE_PARSE_FAILED(HttpStatus.BAD_GATEWAY, "AI 응답을 해석할 수 없습니다."),
    AI_STRUCTURED_SCHEMA_VIOLATION(HttpStatus.BAD_GATEWAY, "AI가 스키마에 맞지 않는 응답을 반환했습니다."),

    CHOICE_SET_GENERATION_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "선택지 세트 생성에 실패했습니다. 다시 시도해주세요."),
    CHOICE_SET_VALIDATION_NO_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 없습니다."),
    CHOICE_SET_VALIDATION_MULTIPLE_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 여러 개입니다."),
    CHOICE_SET_NOT_FOUND(HttpStatus.NOT_FOUND, "선택지 세트를 찾을 수 없습니다."),
    CHOICE_SET_POLICY_NOT_IMPLEMENTED(HttpStatus.NOT_IMPLEMENTED, "해당 선택지 정책은 아직 지원되지 않습니다."),

    // === Sandbox Validation (신규: Sub-plan 1) ===
    SANDBOX_SETUP_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "샌드박스 환경 구성에 실패했습니다."),
    SANDBOX_ANSWER_SQL_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "기준 정답 SQL 실행에 실패했습니다."),

    // === Quiz Session (신규: Sub-plan 1) ===
    QUIZ_SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈 세션을 찾을 수 없습니다."),
    QUIZ_SESSION_ALREADY_COMPLETED(HttpStatus.CONFLICT, "이미 완료된 세션입니다."),
    QUIZ_SESSION_INDEX_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "잘못된 문제 인덱스입니다."),
    QUIZ_SESSION_CHOICE_SET_MISMATCH(HttpStatus.BAD_REQUEST, "제출한 선택지 세트가 현재 세션과 일치하지 않습니다."),
    QUIZ_SESSION_INSUFFICIENT_QUESTIONS(HttpStatus.UNPROCESSABLE_ENTITY, "세션을 생성할 문제가 부족합니다."),

    // === Admin Question Generation (신규: Sub-plan 1) ===
    QUESTION_GENERATE_INPUT_INVALID(HttpStatus.BAD_REQUEST, "문제 생성 입력값이 올바르지 않습니다.");
```

마지막 `QUESTION_GENERATE_INPUT_INVALID` 는 세미콜론(`;`)으로 종결. 기존 `NICKNAME_GENERATION_FAILED` 의 원래 세미콜론은 콤마로 바뀌어야 한다.

- [ ] **Step 3: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Common:compileJava`
Expected: `BUILD SUCCESSFUL`. 컴파일 에러 시 콤마/세미콜론 위치, import 오타 확인.

- [ ] **Step 4: 커밋 제안 (자동 실행 금지)**

사용자에게 제안만 표시:
```
feat(common): add ErrorCode for realtime choice set generation (sub-plan 1)
```

---

## Task 2: Enum 4종 작성

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetPolicy.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetSource.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceSetStatus.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/QuizSessionStatus.java`

- [ ] **Step 1: ChoiceSetPolicy.java 작성**

```java
package com.passql.question.constant;

/**
 * 문제가 선택지를 어떻게 공급받는지 결정하는 정책.
 * MVP는 AI_ONLY 만 동작. CURATED_ONLY/HYBRID 는 스키마 예약.
 */
public enum ChoiceSetPolicy {
    AI_ONLY,
    CURATED_ONLY,
    HYBRID
}
```

- [ ] **Step 2: ChoiceSetSource.java 작성**

```java
package com.passql.question.constant;

/**
 * 선택지 세트가 어떻게 생성되었는지 출처 구분.
 * - AI_RUNTIME        : 사용자 진입 시 실시간 생성
 * - AI_PREFETCH       : 백그라운드 프리페치로 생성 (특정 멤버 예약)
 * - AI_ADMIN_PREVIEW  : 관리자 프롬프트 테스트용
 * - ADMIN_SEED        : 관리자 문제 등록 시 AI 보조로 생성된 초기 세트
 * - ADMIN_CURATED     : 관리자가 직접 검수·승격한 재사용 세트
 */
public enum ChoiceSetSource {
    AI_RUNTIME,
    AI_PREFETCH,
    AI_ADMIN_PREVIEW,
    ADMIN_SEED,
    ADMIN_CURATED
}
```

- [ ] **Step 3: ChoiceSetStatus.java 작성**

```java
package com.passql.question.constant;

/**
 * 선택지 세트의 라이프사이클 상태.
 */
public enum ChoiceSetStatus {
    OK,
    DISABLED,
    REPORTED,
    DRAFT,
    FAILED
}
```

- [ ] **Step 4: QuizSessionStatus.java 작성**

```java
package com.passql.question.constant;

public enum QuizSessionStatus {
    IN_PROGRESS,
    COMPLETED,
    ABANDONED
}
```

- [ ] **Step 5: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋 제안 (자동 실행 금지)**

```
feat(question): add choice-set/quiz-session enums (sub-plan 1)
```

---

## Task 3: Flyway 마이그레이션 V0_0_28 작성

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_28__realtime_choice_set.sql`

이 태스크는 마이그레이션 SQL만 작성한다. 실제 Flyway 적용/검증은 Task 10 통합 테스트에서 `@SpringBootTest` 부팅 시 자동 수행된다.

- [ ] **Step 1: 마이그레이션 파일 생성**

Create `server/PQL-Web/src/main/resources/db/migration/V0_0_28__realtime_choice_set.sql` with:

```sql
-- ===================================================================
-- V0_0_28: 실시간 선택지 세트 생성 기능 데이터 계층
--
-- 목적:
--   - question 테이블에 schema_sample_data/schema_intent/answer_sql/hint/choice_set_policy 컬럼 추가
--   - 신규 테이블: question_choice_set, question_choice_set_item, quiz_session
--   - submission 에 choice_set_uuid/session_uuid/question_index 컬럼 추가
--   - prompt_template 시드 2개 추가 (generate_question_full, generate_choice_set)
--
-- 주의:
--   - 기존 question_choice 테이블은 유지 (별도 sub-plan에서 정리)
--   - 모든 UUID PK는 CHAR(36) (기존 V0_0_22 관습 준수)
--   - submission 의 신규 FK 컬럼은 NULLABLE (기존 레코드 호환)
-- ===================================================================

-- -------------------------------------------------------------------
-- Phase 1: question 테이블 컬럼 추가
-- -------------------------------------------------------------------
ALTER TABLE question
    ADD COLUMN schema_sample_data TEXT         NULL AFTER schema_ddl,
    ADD COLUMN schema_intent      TEXT         NULL AFTER schema_sample_data,
    ADD COLUMN answer_sql         TEXT         NULL AFTER schema_intent,
    ADD COLUMN hint               TEXT         NULL AFTER answer_sql,
    ADD COLUMN choice_set_policy  VARCHAR(20)  NOT NULL DEFAULT 'AI_ONLY' AFTER hint;

-- -------------------------------------------------------------------
-- Phase 2: question_choice_set (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice_set (
    choice_set_uuid             CHAR(36)     NOT NULL,
    question_uuid               CHAR(36)     NOT NULL,

    source                      VARCHAR(30)  NOT NULL,
    status                      VARCHAR(20)  NOT NULL DEFAULT 'OK',

    generated_for_member_uuid   CHAR(36)     NULL,
    is_reusable                 TINYINT(1)   NOT NULL DEFAULT 0,

    prompt_template_uuid        CHAR(36)     NULL,
    model_name                  VARCHAR(100) NULL,
    temperature                 FLOAT        NULL,
    max_tokens                  INT          NULL,
    generation_attempts         INT          NOT NULL DEFAULT 1,
    sandbox_validation_passed   TINYINT(1)   NOT NULL DEFAULT 0,
    raw_response_json           JSON         NULL,
    total_elapsed_ms            INT          NULL,

    created_by_member_uuid      CHAR(36)     NULL,
    consumed_at                 DATETIME(6)  NULL,
    last_error_code             VARCHAR(64)  NULL,

    created_at                  DATETIME(6),
    updated_at                  DATETIME(6),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),

    PRIMARY KEY (choice_set_uuid),
    CONSTRAINT fk_choice_set_question
        FOREIGN KEY (question_uuid) REFERENCES question(question_uuid),
    INDEX idx_choice_set_question         (question_uuid),
    INDEX idx_choice_set_source           (source),
    INDEX idx_choice_set_status           (status),
    INDEX idx_choice_set_prefetch
        (question_uuid, generated_for_member_uuid, consumed_at)
);

-- -------------------------------------------------------------------
-- Phase 3: question_choice_set_item (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice_set_item (
    choice_set_item_uuid    CHAR(36)     NOT NULL,
    choice_set_uuid         CHAR(36)     NOT NULL,

    choice_key              VARCHAR(8)   NOT NULL,
    sort_order              INT          NOT NULL,
    kind                    VARCHAR(10)  NOT NULL DEFAULT 'SQL',
    body                    TEXT         NOT NULL,
    is_correct              TINYINT(1)   NOT NULL DEFAULT 0,
    rationale               TEXT         NULL,
    sandbox_execution_json  JSON         NULL,

    created_at              DATETIME(6),
    updated_at              DATETIME(6),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),

    PRIMARY KEY (choice_set_item_uuid),
    CONSTRAINT fk_choice_set_item_set
        FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid)
        ON DELETE CASCADE,
    CONSTRAINT uk_choice_set_item_key UNIQUE (choice_set_uuid, choice_key),
    INDEX idx_choice_set_item_set (choice_set_uuid)
);

-- -------------------------------------------------------------------
-- Phase 4: quiz_session (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_session (
    session_uuid            CHAR(36)     NOT NULL,
    member_uuid             CHAR(36)     NOT NULL,

    question_order_json     JSON         NOT NULL,
    current_index           INT          NOT NULL DEFAULT 0,
    total_questions         INT          NOT NULL DEFAULT 10,

    topic_uuid              CHAR(36)     NULL,
    difficulty_min          INT          NULL,
    difficulty_max          INT          NULL,

    status                  VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    started_at              DATETIME(6)  NOT NULL,
    completed_at            DATETIME(6)  NULL,

    created_at              DATETIME(6),
    updated_at              DATETIME(6),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),

    PRIMARY KEY (session_uuid),
    CONSTRAINT fk_quiz_session_member
        FOREIGN KEY (member_uuid) REFERENCES member(member_uuid),
    INDEX idx_quiz_session_member (member_uuid),
    INDEX idx_quiz_session_status (status)
);

-- -------------------------------------------------------------------
-- Phase 5: submission 컬럼 추가 (NULLABLE)
-- -------------------------------------------------------------------
ALTER TABLE submission
    ADD COLUMN choice_set_uuid  CHAR(36)  NULL AFTER question_uuid,
    ADD COLUMN session_uuid     CHAR(36)  NULL AFTER choice_set_uuid,
    ADD COLUMN question_index   INT       NULL AFTER session_uuid,

    ADD CONSTRAINT fk_submission_choice_set
        FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid),
    ADD CONSTRAINT fk_submission_session
        FOREIGN KEY (session_uuid) REFERENCES quiz_session(session_uuid),

    ADD INDEX idx_submission_session     (session_uuid),
    ADD INDEX idx_submission_choice_set  (choice_set_uuid);

-- -------------------------------------------------------------------
-- Phase 6: prompt_template 시드 2개 (v1)
--   실제 프롬프트 본문은 Sub-plan 2 에서 확정. 이번엔 플레이스홀더 수준으로 넣고
--   note 에 "sub-plan 2 에서 개정 예정" 을 남긴다. Sub-plan 2 가 V0_0_29 로 UPDATE.
-- -------------------------------------------------------------------
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT UUID(), 'generate_question_full', 1, 1, 'gemini-2.5-flash-lite',
       '너는 SQL 교육용 4지선다 문제를 만드는 한국어 출제자야. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[난이도] {difficulty}/5\n[토픽] {topic}\n[서브토픽] {subtopic}\n[힌트] {hint}\n\n[DB 스키마 - DDL]\n{schema_ddl}\n\n[샘플 데이터 - INSERT]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n위 스키마를 기반으로 SQL 문제 1개와 정답 SQL, 선택지 4개(A,B,C,D)를 JSON으로 반환해.',
       0.8, 2048,
       '관리자 문제 등록용. 실제 프롬프트 본문은 sub-plan 2 에서 확정.',
       NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_question_full' AND version = 1
);

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT UUID(), 'generate_choice_set', 1, 1, 'gemini-2.5-flash-lite',
       '너는 이미 주어진 SQL 문제와 정답에 대해 4지선다 선택지 세트를 매번 다르게 생성하는 출제자야. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[문제]\n{stem}\n\n[기준 정답 SQL]\n{answer_sql}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n[난이도] {difficulty}/5\n\n위 문제에 대한 4지선다 선택지(A,B,C,D)를 새로 생성해줘. 정답 1개, 오답 3개.',
       0.9, 1536,
       '사용자 풀이 진입 시 선택지 생성용. 실제 프롬프트 본문은 sub-plan 2 에서 확정.',
       NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set' AND version = 1
);
```

- [ ] **Step 2: 파일 존재 확인**

Run: `ls server/PQL-Web/src/main/resources/db/migration/V0_0_28__realtime_choice_set.sql`
Expected: 파일이 존재하며 정상 크기 (빈 파일 아님).

- [ ] **Step 3: 커밋 제안 (자동 실행 금지)**

```
feat(db): V0_0_28 migration for realtime choice set (sub-plan 1)
```

---

## Task 4: Question Entity 컬럼 5개 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java`

- [ ] **Step 1: import 추가**

`import com.passql.question.constant.ExecutionMode;` 아래에 다음 라인 추가:

```java
import com.passql.question.constant.ChoiceSetPolicy;
```

- [ ] **Step 2: 필드 5개 추가**

기존 `private String extraMetaJson;` 선언 **위**, `private String explanationSummary;` 아래에 다음을 삽입한다:

```java
    @Column(columnDefinition = "TEXT")
    private String schemaSampleData;

    @Column(columnDefinition = "TEXT")
    private String schemaIntent;

    @Column(columnDefinition = "TEXT")
    private String answerSql;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ChoiceSetPolicy choiceSetPolicy = ChoiceSetPolicy.AI_ONLY;
```

`@Builder.Default` 가 중요 — 빌더로 생성 시에도 기본값이 적용되게 한다.

- [ ] **Step 3: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋 제안 (자동 실행 금지)**

```
feat(question): add schema_sample_data/intent/answer_sql/hint/choice_set_policy to Question (sub-plan 1)
```

---

## Task 5: Submission Entity 컬럼 3개 추가

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/entity/Submission.java`

- [ ] **Step 1: @Table indexes 확장**

기존 `@Table(...)` 블록의 `indexes = { ... }` 배열 끝에 다음 2개 인덱스를 추가한다:

```java
        @Index(name = "idx_submission_session", columnList = "session_uuid"),
        @Index(name = "idx_submission_choice_set", columnList = "choice_set_uuid")
```

기존 마지막 `@Index(name = "idx_submission_question", columnList = "question_uuid")` 뒤에 콤마를 붙이는 것 잊지 말 것.

- [ ] **Step 2: 필드 3개 추가**

기존 `private UUID questionUuid;` 아래, `private String selectedChoiceKey;` 위에 다음을 삽입:

```java
    @Column(columnDefinition = "CHAR(36)")
    private UUID choiceSetUuid;

    @Column(columnDefinition = "CHAR(36)")
    private UUID sessionUuid;

    @Column
    private Integer questionIndex;
```

- [ ] **Step 3: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Submission:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋 제안 (자동 실행 금지)**

```
feat(submission): add choice_set_uuid/session_uuid/question_index to Submission (sub-plan 1)
```

---

## Task 6: QuestionChoiceSet Entity

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSet.java`

- [ ] **Step 1: 파일 작성**

```java
package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 한 Question 에 대해 생성된 4지선다 선택지 세트.
 * AI_RUNTIME / AI_PREFETCH / AI_ADMIN_PREVIEW / ADMIN_SEED / ADMIN_CURATED 모두 이 테이블에 저장된다.
 * 실패 케이스(status=FAILED)도 관측·디버깅용으로 기록한다.
 */
@Entity
@Table(
    name = "question_choice_set",
    indexes = {
        @Index(name = "idx_choice_set_question", columnList = "question_uuid"),
        @Index(name = "idx_choice_set_source", columnList = "source"),
        @Index(name = "idx_choice_set_status", columnList = "status"),
        @Index(
            name = "idx_choice_set_prefetch",
            columnList = "question_uuid, generated_for_member_uuid, consumed_at"
        )
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionChoiceSet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID choiceSetUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID questionUuid;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private ChoiceSetSource source;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ChoiceSetStatus status = ChoiceSetStatus.OK;

    @Column(columnDefinition = "CHAR(36)")
    private UUID generatedForMemberUuid;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isReusable = false;

    @Column(columnDefinition = "CHAR(36)")
    private UUID promptTemplateUuid;

    @Column(length = 100)
    private String modelName;

    private Float temperature;

    private Integer maxTokens;

    @Column(nullable = false)
    @Builder.Default
    private Integer generationAttempts = 1;

    @Column(nullable = false)
    @Builder.Default
    private Boolean sandboxValidationPassed = false;

    @Column(columnDefinition = "JSON")
    private String rawResponseJson;

    private Integer totalElapsedMs;

    @Column(columnDefinition = "CHAR(36)")
    private UUID createdByMemberUuid;

    private LocalDateTime consumedAt;

    @Column(length = 64)
    private String lastErrorCode;
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋 제안 (자동 실행 금지)**

```
feat(question): add QuestionChoiceSet entity (sub-plan 1)
```

---

## Task 7: QuestionChoiceSetItem Entity

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuestionChoiceSetItem.java`

- [ ] **Step 1: 파일 작성**

```java
package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.ChoiceKind;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * QuestionChoiceSet 내 개별 선택지 (A~D).
 * 샌드박스 실행 결과는 sandboxExecutionJson 에 JSON 으로 기록 (생성 시점 검증 이력).
 */
@Entity
@Table(
    name = "question_choice_set_item",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_choice_set_item_key",
            columnNames = {"choice_set_uuid", "choice_key"}
        )
    },
    indexes = {
        @Index(name = "idx_choice_set_item_set", columnList = "choice_set_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuestionChoiceSetItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID choiceSetItemUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID choiceSetUuid;

    @Column(length = 8, nullable = false)
    private String choiceKey;

    @Column(nullable = false)
    private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    @Builder.Default
    private ChoiceKind kind = ChoiceKind.SQL;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(columnDefinition = "JSON")
    private String sandboxExecutionJson;
}
```

- [ ] **Step 2: ChoiceKind 확인**

Run (Grep): 기존 `ChoiceKind.SQL` 값이 존재하는지 확인.

ToolSearch 없이 직접 확인 — 기존 `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/ChoiceKind.java` 파일을 열어 `SQL` 값이 있는지 본다. 없으면 이 태스크에서 추가하지 않고 **멈추고 보고** — 기존 enum 정의 상태에 맞춰 위 Entity 의 `kind = ChoiceKind.SQL` 을 조정해야 한다.

- [ ] **Step 3: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋 제안 (자동 실행 금지)**

```
feat(question): add QuestionChoiceSetItem entity (sub-plan 1)
```

---

## Task 8: QuizSession Entity

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/QuizSession.java`

- [ ] **Step 1: 파일 작성**

```java
package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.question.constant.QuizSessionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 퀴즈 세션. 세션 시작 시 10문제 순서를 고정 (question_order_json) 하고
 * 사용자가 진행하는 동안 current_index 를 갱신한다.
 */
@Entity
@Table(
    name = "quiz_session",
    indexes = {
        @Index(name = "idx_quiz_session_member", columnList = "member_uuid"),
        @Index(name = "idx_quiz_session_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class QuizSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID sessionUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID memberUuid;

    /** JSON 배열: ["questionUuid1", ..., "questionUuid10"] */
    @Column(columnDefinition = "JSON", nullable = false)
    private String questionOrderJson;

    @Column(nullable = false)
    @Builder.Default
    private Integer currentIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalQuestions = 10;

    @Column(columnDefinition = "CHAR(36)")
    private UUID topicUuid;

    private Integer difficultyMin;

    private Integer difficultyMax;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private QuizSessionStatus status = QuizSessionStatus.IN_PROGRESS;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋 제안 (자동 실행 금지)**

```
feat(question): add QuizSession entity (sub-plan 1)
```

---

## Task 9: Repository 3종

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetRepository.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionChoiceSetItemRepository.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuizSessionRepository.java`

Sub-plan 1 에서는 **서비스 레이어가 호출할 기본 조회/존재 확인 메서드만** 선언. 복잡한 필터링·페이징은 Sub-plan 5/8 에서 각각 추가. 미리 모든 메서드를 넣지 않는다 (YAGNI).

- [ ] **Step 1: QuestionChoiceSetRepository.java 작성**

```java
package com.passql.question.repository;

import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.entity.QuestionChoiceSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface QuestionChoiceSetRepository extends JpaRepository<QuestionChoiceSet, UUID> {

    /**
     * 프리페치 캐시 조회: 특정 멤버·특정 문제에 대해 아직 소비되지 않은
     * AI_PREFETCH + status=OK 세트 중 가장 최근 것.
     */
    Optional<QuestionChoiceSet>
        findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
            UUID questionUuid, UUID generatedForMemberUuid,
            ChoiceSetSource source, ChoiceSetStatus status);

    boolean existsByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNull(
            UUID questionUuid, UUID generatedForMemberUuid,
            ChoiceSetSource source, ChoiceSetStatus status);
}
```

- [ ] **Step 2: QuestionChoiceSetItemRepository.java 작성**

```java
package com.passql.question.repository;

import com.passql.question.entity.QuestionChoiceSetItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionChoiceSetItemRepository extends JpaRepository<QuestionChoiceSetItem, UUID> {

    List<QuestionChoiceSetItem> findByChoiceSetUuidOrderBySortOrderAsc(UUID choiceSetUuid);

    Optional<QuestionChoiceSetItem> findByChoiceSetUuidAndChoiceKey(UUID choiceSetUuid, String choiceKey);
}
```

- [ ] **Step 3: QuizSessionRepository.java 작성**

```java
package com.passql.question.repository;

import com.passql.question.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QuizSessionRepository extends JpaRepository<QuizSession, UUID> {
}
```

- [ ] **Step 4: 컴파일 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:compileJava`
Expected: `BUILD SUCCESSFUL`. Spring Data 파생 쿼리 파서가 메서드명을 받아들이는지는 통합 테스트(Task 10)에서 확인.

- [ ] **Step 5: 커밋 제안 (자동 실행 금지)**

```
feat(question): add repositories for choice set / quiz session (sub-plan 1)
```

---

## Task 10: 통합 테스트 — 스키마·Entity·Repository 검증

**Files:**
- Create: `server/PQL-Domain-Question/src/test/java/com/passql/question/entity/ChoiceSetEntityIntegrationTest.java`

이 테스트 한 파일이 **전체 sub-plan 1 의 동작 확인 역할** 을 겸한다. `@SpringBootTest` 부팅 시 Flyway V0_0_28 이 적용되고, 그 상태에서 아래 시나리오를 통해 스키마·Entity 매핑·Repository 파생 쿼리·FK·UNIQUE 제약이 모두 검증된다.

- [ ] **Step 1: 실패하는 테스트 작성**

```java
package com.passql.question.entity;

import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.Dialect;
import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.web.PassqlApplication;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sub-plan 1 데이터 계층 통합 테스트.
 * Flyway V0_0_28 적용 후 스키마·Entity·Repository 파생 쿼리·FK·UNIQUE 제약을 검증한다.
 */
@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Transactional
@Slf4j
class ChoiceSetEntityIntegrationTest {

    @Autowired QuestionRepository questionRepository;
    @Autowired QuestionChoiceSetRepository choiceSetRepository;
    @Autowired QuestionChoiceSetItemRepository choiceSetItemRepository;
    @Autowired QuizSessionRepository quizSessionRepository;
    @Autowired EntityManager em;

    @Test
    void question_새_컬럼이_기본값으로_저장되고_조회된다() {
        Question q = buildMinimalQuestion();
        q.setAnswerSql("SELECT 1");
        q.setSchemaSampleData("INSERT INTO t VALUES (1);");
        q.setSchemaIntent("단일 행 조회");
        q.setHint("WHERE 절 없음");

        Question saved = questionRepository.saveAndFlush(q);
        em.clear();

        Question reloaded = questionRepository.findById(saved.getQuestionUuid()).orElseThrow();
        assertThat(reloaded.getAnswerSql()).isEqualTo("SELECT 1");
        assertThat(reloaded.getSchemaSampleData()).isEqualTo("INSERT INTO t VALUES (1);");
        assertThat(reloaded.getSchemaIntent()).isEqualTo("단일 행 조회");
        assertThat(reloaded.getHint()).isEqualTo("WHERE 절 없음");
        // buildMinimalQuestion() 에서 choiceSetPolicy(AI_ONLY) 로 명시한 값이
        // DB round-trip 후에도 enum 으로 올바르게 매핑되는지 확인
        assertThat(reloaded.getChoiceSetPolicy()).isEqualTo(ChoiceSetPolicy.AI_ONLY);
    }

    @Test
    void choiceSet_과_items_를_저장하고_조회한다() {
        // given: Question 먼저 저장
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());

        // when: ChoiceSet 저장
        QuestionChoiceSet set = QuestionChoiceSet.builder()
            .questionUuid(q.getQuestionUuid())
            .source(ChoiceSetSource.AI_RUNTIME)
            .status(ChoiceSetStatus.OK)
            .generationAttempts(1)
            .sandboxValidationPassed(true)
            .isReusable(false)
            .modelName("gemini-2.5-flash-lite")
            .temperature(0.9f)
            .maxTokens(1536)
            .totalElapsedMs(1234)
            .build();
        QuestionChoiceSet savedSet = choiceSetRepository.saveAndFlush(set);

        // 4개 아이템 저장
        for (int i = 0; i < 4; i++) {
            String key = String.valueOf((char)('A' + i));
            QuestionChoiceSetItem item = QuestionChoiceSetItem.builder()
                .choiceSetUuid(savedSet.getChoiceSetUuid())
                .choiceKey(key)
                .sortOrder(i)
                .kind(ChoiceKind.SQL)
                .body("SELECT " + (i + 1))
                .isCorrect(i == 0)
                .rationale("설명 " + key)
                .build();
            choiceSetItemRepository.saveAndFlush(item);
        }
        em.clear();

        // then: 파생 쿼리로 정렬 조회
        List<QuestionChoiceSetItem> items =
            choiceSetItemRepository.findByChoiceSetUuidOrderBySortOrderAsc(savedSet.getChoiceSetUuid());
        assertThat(items).hasSize(4);
        assertThat(items).extracting(QuestionChoiceSetItem::getChoiceKey)
            .containsExactly("A", "B", "C", "D");
        assertThat(items.get(0).getIsCorrect()).isTrue();
        assertThat(items.get(1).getIsCorrect()).isFalse();

        // key 단건 조회
        Optional<QuestionChoiceSetItem> itemA =
            choiceSetItemRepository.findByChoiceSetUuidAndChoiceKey(savedSet.getChoiceSetUuid(), "A");
        assertThat(itemA).isPresent();
        assertThat(itemA.get().getBody()).isEqualTo("SELECT 1");
    }

    @Test
    void prefetch_캐시_파생쿼리가_동작한다() {
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());
        UUID memberUuid = UUID.randomUUID();

        // 프리페치 세트 저장 — consumedAt=null, status=OK, source=AI_PREFETCH
        QuestionChoiceSet prefetch = QuestionChoiceSet.builder()
            .questionUuid(q.getQuestionUuid())
            .source(ChoiceSetSource.AI_PREFETCH)
            .status(ChoiceSetStatus.OK)
            .generatedForMemberUuid(memberUuid)
            .generationAttempts(1)
            .sandboxValidationPassed(true)
            .isReusable(false)
            .build();
        choiceSetRepository.saveAndFlush(prefetch);
        em.clear();

        // exists 파생 쿼리
        boolean exists = choiceSetRepository
            .existsByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNull(
                q.getQuestionUuid(), memberUuid,
                ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        assertThat(exists).isTrue();

        // find 파생 쿼리
        Optional<QuestionChoiceSet> found = choiceSetRepository
            .findFirstByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNullOrderByCreatedAtDesc(
                q.getQuestionUuid(), memberUuid,
                ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
        assertThat(found).isPresent();
        assertThat(found.get().getSource()).isEqualTo(ChoiceSetSource.AI_PREFETCH);
    }

    @Test
    void quizSession_저장과_조회() {
        UUID memberUuid = UUID.randomUUID();
        QuizSession session = QuizSession.builder()
            .memberUuid(memberUuid)
            .questionOrderJson("[\"" + UUID.randomUUID() + "\"]")
            .totalQuestions(1)
            .currentIndex(0)
            .status(QuizSessionStatus.IN_PROGRESS)
            .startedAt(LocalDateTime.now())
            .build();

        QuizSession saved = quizSessionRepository.saveAndFlush(session);
        em.clear();

        QuizSession reloaded = quizSessionRepository.findById(saved.getSessionUuid()).orElseThrow();
        assertThat(reloaded.getMemberUuid()).isEqualTo(memberUuid);
        assertThat(reloaded.getStatus()).isEqualTo(QuizSessionStatus.IN_PROGRESS);
        assertThat(reloaded.getCurrentIndex()).isZero();
        assertThat(reloaded.getQuestionOrderJson()).startsWith("[");
    }

    @Test
    void choiceSetItem_중복키_제약_위반은_예외를_던진다() {
        Question q = questionRepository.saveAndFlush(buildMinimalQuestion());
        QuestionChoiceSet set = choiceSetRepository.saveAndFlush(
            QuestionChoiceSet.builder()
                .questionUuid(q.getQuestionUuid())
                .source(ChoiceSetSource.AI_RUNTIME)
                .status(ChoiceSetStatus.OK)
                .generationAttempts(1)
                .sandboxValidationPassed(false)
                .isReusable(false)
                .build()
        );

        choiceSetItemRepository.saveAndFlush(
            QuestionChoiceSetItem.builder()
                .choiceSetUuid(set.getChoiceSetUuid())
                .choiceKey("A").sortOrder(0).kind(ChoiceKind.SQL)
                .body("SELECT 1").isCorrect(true).build()
        );

        // 같은 (choice_set_uuid, choice_key) 중복 — UNIQUE 제약 위반
        Throwable thrown = null;
        try {
            choiceSetItemRepository.saveAndFlush(
                QuestionChoiceSetItem.builder()
                    .choiceSetUuid(set.getChoiceSetUuid())
                    .choiceKey("A").sortOrder(1).kind(ChoiceKind.SQL)
                    .body("SELECT 2").isCorrect(false).build()
            );
        } catch (Exception e) {
            thrown = e;
        }
        assertThat(thrown).isNotNull();
        log.info("기대한 UNIQUE 제약 예외 발생: {}", thrown.getClass().getSimpleName());
    }

    // --- helper ---

    private Question buildMinimalQuestion() {
        return Question.builder()
            .topicUuid(findAnyTopicUuid())
            .difficulty(3)
            .dialect(Dialect.MARIADB)
            .stem("테스트 문제")
            .schemaDdl("CREATE TABLE t (id INT);")
            .schemaSampleData("INSERT INTO t VALUES (1);")
            .answerSql("SELECT id FROM t;")
            .choiceSetPolicy(ChoiceSetPolicy.AI_ONLY)
            .isActive(true)
            .build();
    }

    /** V0_0_22 시드로 topic 이 9개 들어있음. 아무 하나 집어오기. */
    private UUID findAnyTopicUuid() {
        Object raw = em.createNativeQuery("SELECT topic_uuid FROM topic LIMIT 1")
            .getSingleResult();
        return UUID.fromString(raw.toString());
    }
}
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:test --tests "com.passql.question.entity.ChoiceSetEntityIntegrationTest"`

**이전 태스크를 모두 완료했다면 이 테스트는 PASS 해야 한다.** (TDD 의미상 "실패 먼저"지만, 이번 sub-plan 은 데이터 계층 일괄 구성이므로 통합 테스트는 검증 단계.)

만약 실패한다면 아래 점검:
- FAIL with `Could not resolve placeholder` → `Dialect` enum 에 `MARIADB` 가 없는 경우. 기존 `server/PQL-Domain-Question/src/main/java/com/passql/question/constant/Dialect.java` 확인 후 존재하는 값으로 교체.
- FAIL with `Unknown column` → Flyway 마이그레이션이 적용되지 않았거나 오타. `target/` 클린 후 재실행.
- FAIL with `Could not create query for ... findFirstByQuestionUuidAnd...` → 파생 쿼리 메서드명 파서 에러. Repository 메서드명 철자 확인.
- FAIL with `ChoiceKind.SQL` 없음 → Task 7 Step 2 의 가드가 발동. 기존 enum 값으로 교체.
- `topic` 테이블이 비어있어 `findAnyTopicUuid` 가 NoResultException → V0_0_22 시드가 적용 안 된 상태. `ddl-auto=none` 확인하고 Flyway 활성 확인.

- [ ] **Step 3: 테스트 PASS 확인**

Run: `cd server && ./gradlew :PQL-Domain-Question:test --tests "com.passql.question.entity.ChoiceSetEntityIntegrationTest"`
Expected: `5 tests, 5 passed`

- [ ] **Step 4: 커밋 제안 (자동 실행 금지)**

```
test(question): integration test for choice set data layer (sub-plan 1)
```

---

## Task 11: 전체 회귀 확인

- [ ] **Step 1: 전체 서버 빌드**

Run: `cd server && ./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`. 컴파일 에러 없음.

- [ ] **Step 2: 전체 서버 테스트 실행 (기존 테스트 회귀 확인)**

Run: `cd server && ./gradlew test`
Expected: 기존 테스트 전부 PASS + Task 10 신규 테스트 5건 PASS. 기존 `QuestionServiceTest` 가 `resolveTodayQuestion` 등을 호출하는데, `Question` 엔티티에 컬럼만 추가했으므로 회귀 영향은 없어야 함.

만약 기존 테스트가 깨진다면:
- `Question.builder()` 호출부가 있다면 `choiceSetPolicy` 기본값이 `@Builder.Default` 로 자동 설정돼 있어 영향 없음.
- 네이티브 쿼리에서 `question.*` 을 쓰는 코드가 있으면 신규 컬럼이 추가로 selection 될 뿐 로직 영향 없음.
- 실패 시 실패 스택트레이스를 읽고 원인 파악 후 수정. 단, **수정 범위는 sub-plan 1 과 무관한 파일로 번지지 않도록** 주의.

- [ ] **Step 3: 플랜 완료 확인**

`docs/superpowers/plans/2026-04-09-sub1-schema-entities.md` 파일 내 모든 `- [ ]` 체크박스가 체크되었는지 검토. 누락된 스텝이 있으면 해당 태스크로 돌아감.

- [ ] **Step 4: 최종 커밋 제안 (자동 실행 금지)**

누적 변경사항을 하나의 커밋으로 합치고 싶으면 사용자가 squash. 에이전트는 `git add` / `git commit` 을 실행하지 않는다.

사용자에게 다음을 보고한다:
- 생성된 파일 목록
- 수정된 파일 목록
- 테스트 결과 요약
- 다음 sub-plan (Sub-plan 2: Python AI 서버 Gemini 연동) 진입 가능 상태

---

## 자기 검토 (스펙 커버리지)

| 스펙 요구 | 커버 태스크 |
|---|---|
| §2.1 question 재정의 → 컬럼 추가 5종 | Task 3 (SQL) + Task 4 (Entity) |
| §2.2 question_choice_set | Task 3 + Task 6 + Task 9 |
| §2.3 question_choice_set_item | Task 3 + Task 7 + Task 9 |
| §2.4 quiz_session | Task 3 + Task 8 + Task 9 |
| §2.5 submission 컬럼 추가 | Task 3 + Task 5 |
| §2.6 prompt_template 시드 2개 | Task 3 (placeholder 본문, sub-plan 2 에서 개정) |
| §6.2 ErrorCode 17종 신규 | Task 1 |
| §6.3 에러 매핑 | Sub-plan 1 범위 외 (실제 throw 지점은 후속 sub-plan) |
| §3 컴포넌트 (AiGatewayClient 등) | Sub-plan 3+ |
| §4 프롬프트 본문 | Sub-plan 2 |
| §5 UI | Sub-plan 6/7/8 |

모든 데이터 계층 요구는 이 플랜 안에 커버됨. 서비스/컨트롤러/UI 는 다음 sub-plan 에서 다룬다.

---

## 실행 핸드오프

Plan complete and saved to `docs/superpowers/plans/2026-04-09-sub1-schema-entities.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — 태스크마다 fresh subagent 를 디스패치하고 중간 리뷰 후 다음 태스크로. 태스크 독립성이 높아 이 방식에 적합.

2. **Inline Execution** — 현재 세션에서 순차 실행. 체크포인트에서 리뷰.

**중요 주의사항 (CLAUDE.md 전역 규약):**
- **자동 git commit 금지.** 각 태스크의 "커밋 제안" 스텝은 실행하지 않고 메시지만 보여준다. 사용자가 수동 커밋.
- **내부망 환경.** `./gradlew build` 가 의존성 다운로드 실패하면 사용자에게 보고. 에이전트는 `pub get` / `npm install` 등 네트워크가 필요한 명령을 시도하지 않는다.
