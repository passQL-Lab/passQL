CREATE TABLE IF NOT EXISTS question_report (
    question_report_uuid UUID        PRIMARY KEY,
    question_uuid        UUID        NOT NULL,
    choice_set_uuid      UUID,
    member_uuid          UUID        NOT NULL,
    submission_uuid      UUID        NOT NULL,
    detail               TEXT,
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolved_at          TIMESTAMP,
    resolved_by          UUID,
    correction_scope     VARCHAR(30),
    created_at           TIMESTAMP   NOT NULL,
    updated_at           TIMESTAMP   NOT NULL,
    created_by           VARCHAR(50),
    updated_by           VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS question_report_category (
    question_report_uuid UUID        NOT NULL REFERENCES question_report(question_report_uuid),
    category             VARCHAR(30) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_report_member_submission
    ON question_report(member_uuid, submission_uuid);
