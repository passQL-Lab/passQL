-- ===================================================================
-- V0_0_28: 실시간 선택지 세트 생성 기능 데이터 계층
-- ===================================================================

-- -------------------------------------------------------------------
-- Phase 1: question 테이블 컬럼 추가
-- -------------------------------------------------------------------
ALTER TABLE question
    ADD COLUMN IF NOT EXISTS schema_sample_data TEXT         NULL,
    ADD COLUMN IF NOT EXISTS schema_intent      TEXT         NULL,
    ADD COLUMN IF NOT EXISTS answer_sql         TEXT         NULL,
    ADD COLUMN IF NOT EXISTS hint               TEXT         NULL,
    ADD COLUMN IF NOT EXISTS choice_set_policy  VARCHAR(20)  NOT NULL DEFAULT 'AI_ONLY';

-- -------------------------------------------------------------------
-- Phase 2: question_choice_set (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice_set (
    choice_set_uuid             UUID     NOT NULL,
    question_uuid               UUID     NOT NULL,

    source                      VARCHAR(30)  NOT NULL,
    status                      VARCHAR(20)  NOT NULL DEFAULT 'OK',

    generated_for_member_uuid   UUID     NULL,
    is_reusable                 BOOLEAN      NOT NULL DEFAULT FALSE,

    prompt_template_uuid        UUID     NULL,
    model_name                  VARCHAR(100) NULL,
    temperature                 FLOAT        NULL,
    max_tokens                  INT          NULL,
    generation_attempts         INT          NOT NULL DEFAULT 1,
    sandbox_validation_passed   BOOLEAN      NOT NULL DEFAULT FALSE,
    raw_response_json           JSONB        NULL,
    total_elapsed_ms            INT          NULL,

    created_by_member_uuid      UUID     NULL,
    consumed_at                 TIMESTAMP(6) NULL,
    last_error_code             VARCHAR(64)  NULL,

    created_at                  TIMESTAMP(6),
    updated_at                  TIMESTAMP(6),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),

    PRIMARY KEY (choice_set_uuid),
    CONSTRAINT fk_choice_set_question
        FOREIGN KEY (question_uuid) REFERENCES question(question_uuid)
);

CREATE INDEX IF NOT EXISTS idx_choice_set_question ON question_choice_set (question_uuid);
CREATE INDEX IF NOT EXISTS idx_choice_set_source   ON question_choice_set (source);
CREATE INDEX IF NOT EXISTS idx_choice_set_status   ON question_choice_set (status);
CREATE INDEX IF NOT EXISTS idx_choice_set_prefetch ON question_choice_set (question_uuid, generated_for_member_uuid, consumed_at);

-- -------------------------------------------------------------------
-- Phase 3: question_choice_set_item (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice_set_item (
    choice_set_item_uuid    UUID     NOT NULL,
    choice_set_uuid         UUID     NOT NULL,

    choice_key              VARCHAR(8)   NOT NULL,
    sort_order              INT          NOT NULL,
    kind                    VARCHAR(10)  NOT NULL DEFAULT 'SQL',
    body                    TEXT         NOT NULL,
    is_correct              BOOLEAN      NOT NULL DEFAULT FALSE,
    rationale               TEXT         NULL,
    sandbox_execution_json  JSONB        NULL,

    created_at              TIMESTAMP(6),
    updated_at              TIMESTAMP(6),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),

    PRIMARY KEY (choice_set_item_uuid),
    CONSTRAINT fk_choice_set_item_set
        FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid)
        ON DELETE CASCADE,
    CONSTRAINT uk_choice_set_item_key UNIQUE (choice_set_uuid, choice_key)
);

CREATE INDEX IF NOT EXISTS idx_choice_set_item_set ON question_choice_set_item (choice_set_uuid);

-- -------------------------------------------------------------------
-- Phase 4: quiz_session (신규)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_session (
    session_uuid            UUID     NOT NULL,
    member_uuid             UUID     NOT NULL,

    question_order_json     JSONB        NOT NULL,
    current_index           INT          NOT NULL DEFAULT 0,
    total_questions         INT          NOT NULL DEFAULT 10,

    topic_uuid              UUID     NULL,
    difficulty_min          INT          NULL,
    difficulty_max          INT          NULL,

    status                  VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    started_at              TIMESTAMP(6) NOT NULL,
    completed_at            TIMESTAMP(6) NULL,

    created_at              TIMESTAMP(6),
    updated_at              TIMESTAMP(6),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),

    PRIMARY KEY (session_uuid),
    CONSTRAINT fk_quiz_session_member
        FOREIGN KEY (member_uuid) REFERENCES member(member_uuid)
);

CREATE INDEX IF NOT EXISTS idx_quiz_session_member ON quiz_session (member_uuid);
CREATE INDEX IF NOT EXISTS idx_quiz_session_status ON quiz_session (status);

-- -------------------------------------------------------------------
-- Phase 5: submission 컬럼 추가 (NULLABLE)
-- -------------------------------------------------------------------
ALTER TABLE submission
    ADD COLUMN IF NOT EXISTS choice_set_uuid  UUID  NULL,
    ADD COLUMN IF NOT EXISTS session_uuid     UUID  NULL,
    ADD COLUMN IF NOT EXISTS question_index   INT       NULL;

-- FK 추가 (PostgreSQL은 ADD CONSTRAINT IF NOT EXISTS 미지원 → 예외 무시 방식)
DO $$
BEGIN
    ALTER TABLE submission
        ADD CONSTRAINT fk_submission_choice_set
            FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE submission
        ADD CONSTRAINT fk_submission_session
            FOREIGN KEY (session_uuid) REFERENCES quiz_session(session_uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_submission_session    ON submission (session_uuid);
CREATE INDEX IF NOT EXISTS idx_submission_choice_set ON submission (choice_set_uuid);

-- -------------------------------------------------------------------
-- Phase 6: prompt_template 시드 2개 (v1)
-- -------------------------------------------------------------------
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT gen_random_uuid(), 'generate_question_full', 1, TRUE, 'gemini-2.5-flash-lite',
       '너는 SQL 교육용 4지선다 문제를 만드는 한국어 출제자야. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[난이도] {difficulty}/5\n[토픽] {topic}\n[서브토픽] {subtopic}\n[힌트] {hint}\n\n[DB 스키마 - DDL]\n{schema_ddl}\n\n[샘플 데이터 - INSERT]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n위 스키마를 기반으로 SQL 문제 1개와 정답 SQL, 선택지 4개(A,B,C,D)를 JSON으로 반환해.',
       0.8, 2048,
       '관리자 문제 등록용. 실제 프롬프트 본문은 sub-plan 2 에서 확정.',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_question_full' AND version = 1
);

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT gen_random_uuid(), 'generate_choice_set', 1, TRUE, 'gemini-2.5-flash-lite',
       '너는 이미 주어진 SQL 문제와 정답에 대해 4지선다 선택지 세트를 매번 다르게 생성하는 출제자야. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[문제]\n{stem}\n\n[기준 정답 SQL]\n{answer_sql}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n[난이도] {difficulty}/5\n\n위 문제에 대한 4지선다 선택지(A,B,C,D)를 새로 생성해줘. 정답 1개, 오답 3개.',
       0.9, 1536,
       '사용자 풀이 진입 시 선택지 생성용. 실제 프롬프트 본문은 sub-plan 2 에서 확정.',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set' AND version = 1
);
