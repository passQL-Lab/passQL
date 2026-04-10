-- Sandbox 연결 풀 관련 설정 추가
INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description)
VALUES
    (UUID(), 'sandbox.pool.concurrency', 'INT',     '30',  'SANDBOX', '동시 샌드박스 실행 슬롯 수 (초과 요청은 대기)'),
    (UUID(), 'sandbox.pool.wait_seconds', 'INT',    '60',  'SANDBOX', '슬롯 대기 최대 시간(초) — 초과 시 오류 반환')
ON DUPLICATE KEY UPDATE
    value_text  = VALUES(value_text),
    description = VALUES(description);
