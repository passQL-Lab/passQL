DO $$
BEGIN
    -- question_report_category 복합 PK 추가 (V0_0_120에서 누락)
    -- PK가 없는 경우에만 추가 (멱등성 보장)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'question_report_category'
          AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE question_report_category
            ADD CONSTRAINT pk_question_report_category
                PRIMARY KEY (question_report_uuid, category);
    END IF;
END $$;
