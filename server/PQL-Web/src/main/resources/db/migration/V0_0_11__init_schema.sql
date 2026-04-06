-- ===================================================================
-- passQL 초기 스키마 생성
-- version: 참조 version.yml (프로젝트 루트)
-- ===================================================================

-- -------------------------------------------------------------------
-- topic
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS topic (
    code         VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    sort_order   INT,
    is_active    TINYINT(1),
    PRIMARY KEY (code)
);

-- -------------------------------------------------------------------
-- subtopic
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subtopic (
    code         VARCHAR(100) NOT NULL,
    topic_code   VARCHAR(100),
    display_name VARCHAR(255),
    sort_order   INT,
    is_active    TINYINT(1),
    PRIMARY KEY (code)
);

-- -------------------------------------------------------------------
-- concept_tag
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concept_tag (
    tag_key     VARCHAR(100) NOT NULL,
    label_ko    VARCHAR(255),
    category    VARCHAR(100),
    description TEXT,
    is_active   TINYINT(1),
    sort_order  INT,
    PRIMARY KEY (tag_key)
);

-- -------------------------------------------------------------------
-- concept_doc (BaseEntity: created_at, updated_at, created_by, updated_by)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concept_doc (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    tag_key           VARCHAR(100),
    title             VARCHAR(255),
    body_md           TEXT,
    embedding_version VARCHAR(100),
    is_active         TINYINT(1),
    created_at        DATETIME(6),
    updated_at        DATETIME(6),
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------------
-- prompt_template
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prompt_template (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    key_name          VARCHAR(255),
    version           INT,
    is_active         TINYINT(1),
    model             VARCHAR(100),
    system_prompt     TEXT,
    user_template     TEXT,
    temperature       FLOAT,
    max_tokens        INT,
    note              VARCHAR(500),
    extra_params_json JSON,
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------------
-- app_setting
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_setting (
    setting_key  VARCHAR(100) NOT NULL,
    value_type   VARCHAR(50),
    value_text   TEXT,
    category     VARCHAR(100),
    description  TEXT,
    PRIMARY KEY (setting_key)
);

-- -------------------------------------------------------------------
-- question (BaseEntity)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    topic_code          VARCHAR(100),
    subtopic_code       VARCHAR(100),
    difficulty          INT,
    execution_mode      VARCHAR(50),
    dialect             VARCHAR(50),
    sandbox_db_name     VARCHAR(255),
    stem                TEXT,
    schema_display      TEXT,
    schema_ddl          TEXT,
    explanation_summary TEXT,
    extra_meta_json     JSON,
    created_at          DATETIME(6),
    updated_at          DATETIME(6),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------------
-- question_choice
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    question_id BIGINT,
    choice_key  VARCHAR(100),
    kind        VARCHAR(50),
    body        TEXT,
    is_correct  TINYINT(1),
    rationale   TEXT,
    sort_order  INT,
    PRIMARY KEY (id)
);
