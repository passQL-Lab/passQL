-- =============================================================================
-- V0_0_29: Gemini API Key를 app_setting DB에서 관리
-- =============================================================================

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ai.gemini_api_key', 'SECRET', '', 'ai', 'Google Gemini API Key (관리자만 수정 가능)', NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE
    SET value_type  = EXCLUDED.value_type,
        category    = EXCLUDED.category,
        description = EXCLUDED.description;
