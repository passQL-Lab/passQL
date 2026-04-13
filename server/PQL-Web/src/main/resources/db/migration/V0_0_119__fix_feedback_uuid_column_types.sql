DO $$
BEGIN
    -- feedback_uuid 컬럼이 character 타입인 경우에만 UUID로 변환
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback'
          AND column_name = 'feedback_uuid'
          AND data_type IN ('character', 'character varying')
    ) THEN
        ALTER TABLE feedback
            ALTER COLUMN feedback_uuid TYPE UUID USING feedback_uuid::uuid;
    END IF;

    -- member_uuid 컬럼이 character 타입인 경우에만 UUID로 변환
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'feedback'
          AND column_name = 'member_uuid'
          AND data_type IN ('character', 'character varying')
    ) THEN
        ALTER TABLE feedback
            ALTER COLUMN member_uuid TYPE UUID USING member_uuid::uuid;
    END IF;
END $$;
