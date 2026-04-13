CREATE TABLE IF NOT EXISTS feedback (
    feedback_uuid CHAR(36)     NOT NULL,
    member_uuid   CHAR(36)     NOT NULL,
    content       VARCHAR(500) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMP(6),
    updated_at    TIMESTAMP(6),
    created_by    VARCHAR(255) NULL,
    updated_by    VARCHAR(255) NULL,
    PRIMARY KEY (feedback_uuid)
);

CREATE INDEX IF NOT EXISTS idx_feedback_member_uuid ON feedback (member_uuid);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at  ON feedback (created_at);
