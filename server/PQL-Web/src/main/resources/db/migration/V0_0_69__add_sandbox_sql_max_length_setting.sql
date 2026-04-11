-- sandbox.sql_max_length 설정 추가
-- SqlSafetyValidator에서 읽는 값으로, 미존재 시 코드 기본값 2000 사용
INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description)
VALUES
    (gen_random_uuid(), 'sandbox.sql_max_length', 'INT', '2000', 'SANDBOX', '사용자 SQL 입력 최대 길이 (초과 시 오류 반환)')
ON CONFLICT (setting_key) DO NOTHING;
