-- ===================================================================
-- V0_0_70: CHAR(36) UUID 컬럼 → PostgreSQL 네이티브 uuid 타입 일괄 변환
--
-- 배경:
--   이전 마이그레이션(V0_0_22 이전)이 MariaDB 기준 CHAR(36)으로 UUID 컬럼을
--   생성했고, PostgreSQL 마이그레이션 후에도 기존 DB는 CHAR(36) 상태로 남아있음.
--   Hibernate 6의 UUIDJdbcType은 PostgreSQL native uuid 타입을 기대하므로
--   CHAR(36) 컬럼과 타입 불일치가 발생 → ClassCastException / ALTER 실패.
--
-- 처리 방법:
--   1. FK 제약 조건 DROP (타입 변경 시 FK가 방해)
--   2. CHAR(36) → uuid 변환 (USING col::uuid)
--   3. FK 제약 조건 재등록
-- ===================================================================

-- ─────────────────────────────────────────────────────────────────────
-- Phase 1: FK 제약 조건 전체 DROP
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE subtopic              DROP CONSTRAINT IF EXISTS fk_subtopic_topic;
ALTER TABLE concept_doc           DROP CONSTRAINT IF EXISTS fk_concept_doc_tag;
ALTER TABLE question              DROP CONSTRAINT IF EXISTS fk_question_topic;
ALTER TABLE question              DROP CONSTRAINT IF EXISTS fk_question_subtopic;
ALTER TABLE question_choice       DROP CONSTRAINT IF EXISTS fk_question_choice_question;
ALTER TABLE question_concept_tag  DROP CONSTRAINT IF EXISTS fk_qct_question;
ALTER TABLE question_concept_tag  DROP CONSTRAINT IF EXISTS fk_qct_concept_tag;
ALTER TABLE daily_challenge       DROP CONSTRAINT IF EXISTS fk_daily_challenge_question;
ALTER TABLE question_choice_set   DROP CONSTRAINT IF EXISTS fk_choice_set_question;
ALTER TABLE question_choice_set_item DROP CONSTRAINT IF EXISTS fk_choice_set_item_set;
ALTER TABLE quiz_session          DROP CONSTRAINT IF EXISTS fk_quiz_session_member;
ALTER TABLE submission            DROP CONSTRAINT IF EXISTS fk_submission_member;
ALTER TABLE submission            DROP CONSTRAINT IF EXISTS fk_submission_question;
ALTER TABLE submission            DROP CONSTRAINT IF EXISTS fk_submission_session;
ALTER TABLE submission            DROP CONSTRAINT IF EXISTS fk_submission_choice_set;
ALTER TABLE execution_log         DROP CONSTRAINT IF EXISTS fk_execution_log_member;
ALTER TABLE execution_log         DROP CONSTRAINT IF EXISTS fk_execution_log_question;
ALTER TABLE member_suspend_history DROP CONSTRAINT IF EXISTS fk_member_suspend_member;

-- ─────────────────────────────────────────────────────────────────────
-- Phase 2: CHAR(36) → uuid 변환 (USING col::uuid)
-- ─────────────────────────────────────────────────────────────────────

-- app_setting
ALTER TABLE app_setting
    ALTER COLUMN app_setting_uuid TYPE uuid USING app_setting_uuid::uuid;

-- concept_tag
ALTER TABLE concept_tag
    ALTER COLUMN concept_tag_uuid TYPE uuid USING concept_tag_uuid::uuid;

-- concept_doc
ALTER TABLE concept_doc
    ALTER COLUMN concept_doc_uuid  TYPE uuid USING concept_doc_uuid::uuid,
    ALTER COLUMN concept_tag_uuid  TYPE uuid USING concept_tag_uuid::uuid;

-- topic
ALTER TABLE topic
    ALTER COLUMN topic_uuid TYPE uuid USING topic_uuid::uuid;

-- subtopic
ALTER TABLE subtopic
    ALTER COLUMN subtopic_uuid TYPE uuid USING subtopic_uuid::uuid,
    ALTER COLUMN topic_uuid    TYPE uuid USING topic_uuid::uuid;

-- prompt_template
ALTER TABLE prompt_template
    ALTER COLUMN prompt_template_uuid TYPE uuid USING prompt_template_uuid::uuid;

-- exam_schedule
ALTER TABLE exam_schedule
    ALTER COLUMN exam_schedule_uuid TYPE uuid USING exam_schedule_uuid::uuid;

-- question
ALTER TABLE question
    ALTER COLUMN question_uuid  TYPE uuid USING question_uuid::uuid,
    ALTER COLUMN topic_uuid     TYPE uuid USING topic_uuid::uuid,
    ALTER COLUMN subtopic_uuid  TYPE uuid USING subtopic_uuid::uuid;

-- question_choice
ALTER TABLE question_choice
    ALTER COLUMN question_choice_uuid TYPE uuid USING question_choice_uuid::uuid,
    ALTER COLUMN question_uuid        TYPE uuid USING question_uuid::uuid;

-- question_concept_tag
ALTER TABLE question_concept_tag
    ALTER COLUMN question_concept_tag_uuid TYPE uuid USING question_concept_tag_uuid::uuid,
    ALTER COLUMN question_uuid             TYPE uuid USING question_uuid::uuid,
    ALTER COLUMN concept_tag_uuid          TYPE uuid USING concept_tag_uuid::uuid;

-- daily_challenge
ALTER TABLE daily_challenge
    ALTER COLUMN daily_challenge_uuid TYPE uuid USING daily_challenge_uuid::uuid,
    ALTER COLUMN question_uuid        TYPE uuid USING question_uuid::uuid;

-- question_choice_set
ALTER TABLE question_choice_set
    ALTER COLUMN choice_set_uuid            TYPE uuid USING choice_set_uuid::uuid,
    ALTER COLUMN question_uuid              TYPE uuid USING question_uuid::uuid,
    ALTER COLUMN prompt_template_uuid       TYPE uuid USING prompt_template_uuid::uuid,
    ALTER COLUMN generated_for_member_uuid  TYPE uuid USING generated_for_member_uuid::uuid,
    ALTER COLUMN created_by_member_uuid     TYPE uuid USING created_by_member_uuid::uuid;

-- question_choice_set_item
ALTER TABLE question_choice_set_item
    ALTER COLUMN choice_set_item_uuid TYPE uuid USING choice_set_item_uuid::uuid,
    ALTER COLUMN choice_set_uuid      TYPE uuid USING choice_set_uuid::uuid;

-- member
ALTER TABLE member
    ALTER COLUMN member_uuid TYPE uuid USING member_uuid::uuid;

-- member_suspend_history
ALTER TABLE member_suspend_history
    ALTER COLUMN member_suspend_history_uuid TYPE uuid USING member_suspend_history_uuid::uuid,
    ALTER COLUMN member_uuid                 TYPE uuid USING member_uuid::uuid;

-- quiz_session
ALTER TABLE quiz_session
    ALTER COLUMN session_uuid TYPE uuid USING session_uuid::uuid,
    ALTER COLUMN member_uuid  TYPE uuid USING member_uuid::uuid,
    ALTER COLUMN topic_uuid   TYPE uuid USING topic_uuid::uuid;

-- submission
ALTER TABLE submission
    ALTER COLUMN submission_uuid TYPE uuid USING submission_uuid::uuid,
    ALTER COLUMN member_uuid     TYPE uuid USING member_uuid::uuid,
    ALTER COLUMN question_uuid   TYPE uuid USING question_uuid::uuid,
    ALTER COLUMN session_uuid    TYPE uuid USING session_uuid::uuid,
    ALTER COLUMN choice_set_uuid TYPE uuid USING choice_set_uuid::uuid;

-- execution_log
ALTER TABLE execution_log
    ALTER COLUMN execution_log_uuid TYPE uuid USING execution_log_uuid::uuid,
    ALTER COLUMN member_uuid        TYPE uuid USING member_uuid::uuid,
    ALTER COLUMN question_uuid      TYPE uuid USING question_uuid::uuid;

-- ─────────────────────────────────────────────────────────────────────
-- Phase 3: FK 제약 조건 재등록
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE subtopic
    ADD CONSTRAINT fk_subtopic_topic FOREIGN KEY (topic_uuid) REFERENCES topic(topic_uuid);

ALTER TABLE concept_doc
    ADD CONSTRAINT fk_concept_doc_tag FOREIGN KEY (concept_tag_uuid) REFERENCES concept_tag(concept_tag_uuid);

ALTER TABLE question
    ADD CONSTRAINT fk_question_topic    FOREIGN KEY (topic_uuid)    REFERENCES topic(topic_uuid),
    ADD CONSTRAINT fk_question_subtopic FOREIGN KEY (subtopic_uuid) REFERENCES subtopic(subtopic_uuid);

ALTER TABLE question_choice
    ADD CONSTRAINT fk_question_choice_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid);

ALTER TABLE question_concept_tag
    ADD CONSTRAINT fk_qct_question    FOREIGN KEY (question_uuid)    REFERENCES question(question_uuid),
    ADD CONSTRAINT fk_qct_concept_tag FOREIGN KEY (concept_tag_uuid) REFERENCES concept_tag(concept_tag_uuid);

ALTER TABLE daily_challenge
    ADD CONSTRAINT fk_daily_challenge_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid);

ALTER TABLE question_choice_set
    ADD CONSTRAINT fk_choice_set_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid);

ALTER TABLE question_choice_set_item
    ADD CONSTRAINT fk_choice_set_item_set FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid);

ALTER TABLE quiz_session
    ADD CONSTRAINT fk_quiz_session_member FOREIGN KEY (member_uuid) REFERENCES member(member_uuid);

ALTER TABLE submission
    ADD CONSTRAINT fk_submission_member     FOREIGN KEY (member_uuid)     REFERENCES member(member_uuid),
    ADD CONSTRAINT fk_submission_question   FOREIGN KEY (question_uuid)   REFERENCES question(question_uuid),
    ADD CONSTRAINT fk_submission_session    FOREIGN KEY (session_uuid)    REFERENCES quiz_session(session_uuid),
    ADD CONSTRAINT fk_submission_choice_set FOREIGN KEY (choice_set_uuid) REFERENCES question_choice_set(choice_set_uuid);

ALTER TABLE execution_log
    ADD CONSTRAINT fk_execution_log_member   FOREIGN KEY (member_uuid)   REFERENCES member(member_uuid),
    ADD CONSTRAINT fk_execution_log_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid);

-- member_suspend_history FK (존재하는 경우만 재등록 — 원래 없었을 수도 있음)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'member_suspend_history'
    ) THEN
        -- FK가 없을 때만 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'fk_member_suspend_member'
              AND table_name = 'member_suspend_history'
        ) THEN
            ALTER TABLE member_suspend_history
                ADD CONSTRAINT fk_member_suspend_member FOREIGN KEY (member_uuid) REFERENCES member(member_uuid);
        END IF;
    END IF;
END $$;
