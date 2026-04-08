-- ===================================================================
-- V0_0_22: Entity UUID 통일 재작성 (전면 재작성)
--
-- 목적:
--   - 모든 Entity PK를 UUID(CHAR(36))로 통일 (server/CLAUDE.md §Entity 작성 규칙)
--   - 기존 Long IDENTITY PK와 비즈니스 키 PK 혼재 상태 해소
--   - 비즈니스 키(code, tag_key, setting_key, key_name)는 unique 컬럼으로 보존
--   - 신규 테이블: exam_schedule, daily_challenge, question_concept_tag (Entity 승격)
--   - member 테이블은 이미 UUID PK 준수 → 건드리지 않음
--
-- 구조: Phase 1 (DROP, FK 의존 역순) → Phase 2 (CREATE, FK 의존 순) → Phase 3 (SEED)
-- ===================================================================

-- -------------------------------------------------------------------
-- Phase 1: DROP (FK 의존 역순)
-- -------------------------------------------------------------------
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
-- member: DROP 하지 않음 (이미 UUID 준수)

-- -------------------------------------------------------------------
-- Phase 2: CREATE (FK 의존 순)
-- -------------------------------------------------------------------

-- topic
CREATE TABLE IF NOT EXISTS topic (
    topic_uuid   CHAR(36)     NOT NULL,
    code         VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    sort_order   INT,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6),
    updated_at   DATETIME(6),
    created_by   VARCHAR(255),
    updated_by   VARCHAR(255),
    PRIMARY KEY (topic_uuid),
    CONSTRAINT uk_topic_code UNIQUE (code)
);

-- subtopic
CREATE TABLE IF NOT EXISTS subtopic (
    subtopic_uuid CHAR(36)     NOT NULL,
    code          VARCHAR(100) NOT NULL,
    topic_uuid    CHAR(36)     NOT NULL,
    display_name  VARCHAR(255),
    sort_order    INT,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    DATETIME(6),
    updated_at    DATETIME(6),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    PRIMARY KEY (subtopic_uuid),
    CONSTRAINT uk_subtopic_code UNIQUE (code),
    CONSTRAINT fk_subtopic_topic FOREIGN KEY (topic_uuid) REFERENCES topic(topic_uuid),
    INDEX idx_subtopic_topic_uuid (topic_uuid)
);

-- concept_tag
CREATE TABLE IF NOT EXISTS concept_tag (
    concept_tag_uuid CHAR(36)     NOT NULL,
    tag_key          VARCHAR(100) NOT NULL,
    label_ko         VARCHAR(255),
    category         VARCHAR(100),
    description      TEXT,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order       INT,
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    PRIMARY KEY (concept_tag_uuid),
    CONSTRAINT uk_concept_tag_key UNIQUE (tag_key)
);

-- concept_doc
CREATE TABLE IF NOT EXISTS concept_doc (
    concept_doc_uuid  CHAR(36) NOT NULL,
    concept_tag_uuid  CHAR(36) NOT NULL,
    title             VARCHAR(255),
    body_md           TEXT,
    embedding_version VARCHAR(100),
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    created_at        DATETIME(6),
    updated_at        DATETIME(6),
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    PRIMARY KEY (concept_doc_uuid),
    CONSTRAINT fk_concept_doc_tag FOREIGN KEY (concept_tag_uuid) REFERENCES concept_tag(concept_tag_uuid),
    INDEX idx_concept_doc_tag_uuid (concept_tag_uuid)
);

-- app_setting
CREATE TABLE IF NOT EXISTS app_setting (
    app_setting_uuid CHAR(36)     NOT NULL,
    setting_key      VARCHAR(100) NOT NULL,
    value_type       VARCHAR(50),
    value_text       TEXT,
    category         VARCHAR(100),
    description      TEXT,
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    created_by       VARCHAR(255),
    updated_by       VARCHAR(255),
    PRIMARY KEY (app_setting_uuid),
    CONSTRAINT uk_app_setting_key UNIQUE (setting_key)
);

-- prompt_template
CREATE TABLE IF NOT EXISTS prompt_template (
    prompt_template_uuid CHAR(36)     NOT NULL,
    key_name             VARCHAR(255) NOT NULL,
    version              INT          NOT NULL,
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    model                VARCHAR(100),
    system_prompt        TEXT,
    user_template        TEXT,
    temperature          FLOAT,
    max_tokens           INT,
    note                 VARCHAR(500),
    extra_params_json    JSON,
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255),
    PRIMARY KEY (prompt_template_uuid),
    CONSTRAINT uk_prompt_template_key_version UNIQUE (key_name, version)
);

-- exam_schedule (신규)
CREATE TABLE IF NOT EXISTS exam_schedule (
    exam_schedule_uuid CHAR(36)    NOT NULL,
    cert_type          VARCHAR(20) NOT NULL,
    round              INT         NOT NULL,
    exam_date          DATE        NOT NULL,
    is_selected        TINYINT(1)  NOT NULL DEFAULT 0,
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    created_by         VARCHAR(255),
    updated_by         VARCHAR(255),
    PRIMARY KEY (exam_schedule_uuid),
    CONSTRAINT uk_exam_schedule_cert_round UNIQUE (cert_type, round),
    INDEX idx_exam_schedule_cert (cert_type),
    INDEX idx_exam_schedule_selected (is_selected)
);

-- question
CREATE TABLE IF NOT EXISTS question (
    question_uuid        CHAR(36)    NOT NULL,
    topic_uuid           CHAR(36)    NOT NULL,
    subtopic_uuid        CHAR(36)    NULL,
    difficulty           INT         NOT NULL,
    execution_mode       VARCHAR(50),
    dialect              VARCHAR(50),
    sandbox_db_name      VARCHAR(255),
    stem                 TEXT,
    schema_display       TEXT,
    schema_ddl           TEXT,
    explanation_summary  TEXT,
    extra_meta_json      JSON,
    is_active            TINYINT(1)  NOT NULL DEFAULT 1,
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255),
    PRIMARY KEY (question_uuid),
    CONSTRAINT fk_question_topic    FOREIGN KEY (topic_uuid)    REFERENCES topic(topic_uuid),
    CONSTRAINT fk_question_subtopic FOREIGN KEY (subtopic_uuid) REFERENCES subtopic(subtopic_uuid),
    INDEX idx_question_topic_uuid    (topic_uuid),
    INDEX idx_question_subtopic_uuid (subtopic_uuid),
    INDEX idx_question_active        (is_active)
);

-- question_choice
CREATE TABLE IF NOT EXISTS question_choice (
    question_choice_uuid CHAR(36)   NOT NULL,
    question_uuid        CHAR(36)   NOT NULL,
    choice_key           VARCHAR(8) NOT NULL,
    kind                 VARCHAR(50),
    body                 TEXT,
    is_correct           TINYINT(1) NOT NULL DEFAULT 0,
    rationale            TEXT,
    sort_order           INT,
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255),
    PRIMARY KEY (question_choice_uuid),
    CONSTRAINT fk_question_choice_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid),
    CONSTRAINT uk_question_choice UNIQUE (question_uuid, choice_key),
    INDEX idx_question_choice_question (question_uuid)
);

-- question_concept_tag (Entity 승격, 자체 UUID PK)
CREATE TABLE IF NOT EXISTS question_concept_tag (
    question_concept_tag_uuid CHAR(36) NOT NULL,
    question_uuid             CHAR(36) NOT NULL,
    concept_tag_uuid          CHAR(36) NOT NULL,
    created_at                DATETIME(6),
    updated_at                DATETIME(6),
    created_by                VARCHAR(255),
    updated_by                VARCHAR(255),
    PRIMARY KEY (question_concept_tag_uuid),
    CONSTRAINT fk_qct_question    FOREIGN KEY (question_uuid)    REFERENCES question(question_uuid),
    CONSTRAINT fk_qct_concept_tag FOREIGN KEY (concept_tag_uuid) REFERENCES concept_tag(concept_tag_uuid),
    CONSTRAINT uk_question_concept_tag UNIQUE (question_uuid, concept_tag_uuid),
    INDEX idx_qct_question (question_uuid),
    INDEX idx_qct_tag      (concept_tag_uuid)
);

-- daily_challenge (신규)
CREATE TABLE IF NOT EXISTS daily_challenge (
    daily_challenge_uuid CHAR(36) NOT NULL,
    challenge_date       DATE     NOT NULL,
    question_uuid        CHAR(36) NOT NULL,
    created_at           DATETIME(6),
    updated_at           DATETIME(6),
    created_by           VARCHAR(255),
    updated_by           VARCHAR(255),
    PRIMARY KEY (daily_challenge_uuid),
    CONSTRAINT fk_daily_challenge_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid),
    CONSTRAINT uk_daily_challenge_date UNIQUE (challenge_date),
    INDEX idx_daily_challenge_question (question_uuid)
);

-- submission
CREATE TABLE IF NOT EXISTS submission (
    submission_uuid     CHAR(36)   NOT NULL,
    member_uuid         CHAR(36)   NOT NULL,
    question_uuid       CHAR(36)   NOT NULL,
    selected_choice_key VARCHAR(8) NOT NULL,
    is_correct          TINYINT(1) NOT NULL,
    submitted_at        DATETIME(6) NOT NULL,
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    PRIMARY KEY (submission_uuid),
    CONSTRAINT fk_submission_member   FOREIGN KEY (member_uuid)   REFERENCES member(member_uuid),
    CONSTRAINT fk_submission_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid),
    INDEX idx_submission_member           (member_uuid),
    INDEX idx_submission_member_submitted (member_uuid, submitted_at),
    INDEX idx_submission_member_question  (member_uuid, question_uuid),
    INDEX idx_submission_question         (question_uuid)
);

-- execution_log
CREATE TABLE IF NOT EXISTS execution_log (
    execution_log_uuid CHAR(36) NOT NULL,
    member_uuid        CHAR(36) NULL,
    question_uuid      CHAR(36) NOT NULL,
    choice_key         VARCHAR(8),
    sql_text           TEXT,
    status             VARCHAR(50),
    error_code         VARCHAR(100),
    error_message      TEXT,
    row_count          INT,
    elapsed_ms         BIGINT,
    executed_at        DATETIME(6) NOT NULL,
    created_at         DATETIME(6),
    updated_at         DATETIME(6),
    created_by         VARCHAR(255),
    updated_by         VARCHAR(255),
    PRIMARY KEY (execution_log_uuid),
    CONSTRAINT fk_execution_log_member   FOREIGN KEY (member_uuid)   REFERENCES member(member_uuid),
    CONSTRAINT fk_execution_log_question FOREIGN KEY (question_uuid) REFERENCES question(question_uuid),
    INDEX idx_execution_log_member      (member_uuid),
    INDEX idx_execution_log_question    (question_uuid),
    INDEX idx_execution_log_executed_at (executed_at)
);

-- -------------------------------------------------------------------
-- Phase 3: SEED (멱등 패턴: INSERT ... SELECT WHERE NOT EXISTS)
-- -------------------------------------------------------------------

-- app_setting 시드 (12개) — exam.target_date 제거 (exam_schedule이 책임)
INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.pass_score', 'INT', '60', 'exam', '합격 기준 점수 (총점 60점 이상, 과목별 40% 이상)', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.pass_score');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.total_questions', 'INT', '50', 'exam', '전체 문제 수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.total_questions');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.subject1_questions', 'INT', '10', 'exam', '1과목(데이터 모델링의 이해) 문제 수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.subject1_questions');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.subject2_questions', 'INT', '40', 'exam', '2과목(SQL 기본 및 활용) 문제 수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.subject2_questions');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'exam.time_limit_minutes', 'INT', '90', 'exam', '시험 시간(분)', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'exam.time_limit_minutes');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'ratelimit.execute.per_minute', 'INT', '90', 'ratelimit', 'SQL 실행 API 분당 최대 요청 수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'ratelimit.execute.per_minute');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'ratelimit.submit.per_minute', 'INT', '30', 'ratelimit', '문제 제출 API 분당 최대 요청 수', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'ratelimit.submit.per_minute');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'ai.default_model', 'STRING', 'gemini-2.5-flash-lite', 'ai', 'AI 기본 모델 (Gemini Flash-Lite, fallback: Ollama)', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'ai.default_model');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'ai.default_temperature', 'FLOAT', '0.7', 'ai', 'AI 기본 temperature', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'ai.default_temperature');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'ai.default_max_tokens', 'INT', '1024', 'ai', 'AI 기본 최대 토큰', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'ai.default_max_tokens');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'question.default_page_size', 'INT', '20', 'question', '문제 목록 기본 페이지 크기', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'question.default_page_size');

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
SELECT UUID(), 'question.max_difficulty', 'INT', '5', 'question', '문제 최대 난이도', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM app_setting WHERE setting_key = 'question.max_difficulty');

-- prompt_template 시드 (3종 v1)
INSERT INTO prompt_template (prompt_template_uuid, key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note, created_at, updated_at)
SELECT UUID(), 'explain_error', 1, 1, 'gemini-2.5-flash-lite',
       '당신은 SQL 학습을 도와주는 전문 튜터입니다. 학습자가 SQL 문제를 틀렸을 때 오류 원인을 친절하고 명확하게 설명해 주세요. SQLD 시험 기준으로 설명하며, 핵심 개념(NULL 처리, 연산자 우선순위, 실행 순서 등)을 짚어주세요.',
       '문제: {{question_stem}}\n정답: {{correct_answer}}\n학습자 선택: {{selected_answer}}\n\n왜 틀렸는지 설명해 주세요.',
       0.5, 512, 'SQLD 오답 해설 프롬프트 v1', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'explain_error' AND version = 1);

INSERT INTO prompt_template (prompt_template_uuid, key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note, created_at, updated_at)
SELECT UUID(), 'diff_explain', 1, 1, 'gemini-2.5-flash-lite',
       '당신은 SQL 학습을 도와주는 전문 튜터입니다. 두 SQL 쿼리의 차이점을 비교 설명해 주세요. SQLD 시험에서 자주 출제되는 함정(RANK vs DENSE_RANK, UNION vs UNION ALL, LEFT/RIGHT OUTER JOIN 차이 등)을 중심으로 설명하세요.',
       '쿼리 A:\n{{query_a}}\n\n쿼리 B:\n{{query_b}}\n\n두 쿼리의 차이점과 각각의 실행 결과를 비교 설명해 주세요.',
       0.5, 768, 'SQL 쿼리 비교 설명 프롬프트 v1', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'diff_explain' AND version = 1);

INSERT INTO prompt_template (prompt_template_uuid, key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note, created_at, updated_at)
SELECT UUID(), 'similar', 1, 1, 'gemini-2.5-flash-lite',
       '당신은 SQLD 시험 문제를 출제하는 전문가입니다. 주어진 문제와 유사한 난이도와 유형의 새로운 연습 문제를 생성해 주세요. 실제 SQLD 기출 스타일(함정 포함)로 작성하세요.',
       '다음 문제와 유사한 연습 문제를 1개 생성해 주세요.\n\n원본 문제:\n{{question_stem}}\n\n선택지:\n{{choices}}\n\n같은 개념을 다른 각도로 묻는 문제를 만들어 주세요.',
       0.8, 1024, '유사 문제 생성 프롬프트 v1', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'similar' AND version = 1);

-- topic 시드 (9개)
INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'data_modeling', '데이터 모델링의 이해', 1, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'data_modeling');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_basic_select', 'SELECT 기본', 2, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_basic_select');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_ddl_dml_tcl', 'DDL / DML / TCL', 3, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_ddl_dml_tcl');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_function', 'SQL 함수 (문자/숫자/날짜/NULL)', 4, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_function');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_join', '조인 (JOIN)', 5, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_join');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_subquery', '서브쿼리', 6, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_subquery');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_group_aggregate', '그룹함수 / 집계', 7, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_group_aggregate');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_window', '윈도우 함수', 8, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_window');

INSERT INTO topic (topic_uuid, code, display_name, sort_order, is_active, created_at, updated_at)
SELECT UUID(), 'sql_hierarchy_pivot', '계층 쿼리 / PIVOT', 9, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM topic WHERE code = 'sql_hierarchy_pivot');

-- exam_schedule 시드 (SQLD 60~63회, 61회 기본 선택)
INSERT INTO exam_schedule (exam_schedule_uuid, cert_type, round, exam_date, is_selected, created_at, updated_at)
SELECT UUID(), 'SQLD', 60, '2026-03-07', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM exam_schedule WHERE cert_type = 'SQLD' AND round = 60);

INSERT INTO exam_schedule (exam_schedule_uuid, cert_type, round, exam_date, is_selected, created_at, updated_at)
SELECT UUID(), 'SQLD', 61, '2026-05-31', 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM exam_schedule WHERE cert_type = 'SQLD' AND round = 61);

INSERT INTO exam_schedule (exam_schedule_uuid, cert_type, round, exam_date, is_selected, created_at, updated_at)
SELECT UUID(), 'SQLD', 62, '2026-08-22', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM exam_schedule WHERE cert_type = 'SQLD' AND round = 62);

INSERT INTO exam_schedule (exam_schedule_uuid, cert_type, round, exam_date, is_selected, created_at, updated_at)
SELECT UUID(), 'SQLD', 63, '2026-11-14', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM exam_schedule WHERE cert_type = 'SQLD' AND round = 63);
