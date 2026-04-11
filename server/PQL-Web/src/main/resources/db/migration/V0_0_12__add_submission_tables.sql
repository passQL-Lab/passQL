-- -------------------------------------------------------------------
-- execution_log
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_log (
    id            BIGINT       NOT NULL GENERATED ALWAYS AS IDENTITY,
    user_uuid     UUID,
    question_id   BIGINT,
    choice_key    VARCHAR(100),
    sql_text      TEXT,
    status        VARCHAR(50),
    error_code    VARCHAR(100),
    error_message TEXT,
    row_count     INT,
    elapsed_ms    BIGINT,
    executed_at   TIMESTAMP,
    PRIMARY KEY (id)
);

-- -------------------------------------------------------------------
-- submission
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission (
    id           BIGINT      NOT NULL GENERATED ALWAYS AS IDENTITY,
    user_uuid    UUID,
    question_id  BIGINT,
    selected_key VARCHAR(100),
    is_correct   BOOLEAN,
    submitted_at TIMESTAMP,
    PRIMARY KEY (id)
);
