-- question_report_category 복합 PK 추가 (V0_0_120에서 누락)
-- (question_report_uuid, category) 쌍을 DB 레벨에서 유니크 보장

ALTER TABLE question_report_category
    ADD CONSTRAINT IF NOT EXISTS pk_question_report_category
        PRIMARY KEY (question_report_uuid, category);
