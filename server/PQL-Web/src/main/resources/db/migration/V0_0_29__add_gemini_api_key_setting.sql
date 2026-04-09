-- =============================================================================
-- V0_0_29: Gemini API Key를 app_setting DB에서 관리
-- Redis 캐시 키: passql:settings:ai.gemini_api_key
-- 실제 키 값은 AppInitializer에서 application-prod.yml → DB로 적재
-- =============================================================================

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
VALUES
    (UUID(), 'ai.gemini_api_key', 'SECRET', '', 'ai', 'Google Gemini API Key (관리자만 수정 가능)', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    value_type  = VALUES(value_type),
    category    = VALUES(category),
    description = VALUES(description);
