-- #70: schema_sample_data 컬럼 추가 (스키마 샘플 데이터 시각화용)
ALTER TABLE question
    ADD COLUMN IF NOT EXISTS schema_sample_data TEXT NULL AFTER schema_ddl;
