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
--   note 에 "sub-plan 2 에서 개정 예정" 을 남긴다.
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
