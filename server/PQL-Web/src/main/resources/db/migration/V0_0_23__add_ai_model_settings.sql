-- =============================================================================
-- V0_0_23: AI 모델 설정값 app_setting 추가
-- Redis 캐시 키: passql:settings:{setting_key}
-- API Key는 여기 저장하지 않음 (환경변수 전용)
-- =============================================================================

INSERT INTO app_setting (app_setting_uuid, setting_key, value_type, value_text, category, description, created_at, updated_at)
VALUES
    (UUID(), 'ai.gemini_model',       'STRING', 'gemini-2.5-flash-lite', 'ai', 'Gemini 사용 모델명 (어드민 수정 가능)',   NOW(), NOW()),
    (UUID(), 'ai.ollama_chat_model',  'STRING', 'qwen2.5:7b',            'ai', 'Ollama 채팅 모델명 (어드민 수정 가능)',   NOW(), NOW()),
    (UUID(), 'ai.ollama_embed_model', 'STRING', 'bge-m3',                'ai', 'Ollama 임베딩 모델명 (어드민 수정 가능)', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    value_type  = VALUES(value_type),
    value_text  = VALUES(value_text),
    category    = VALUES(category),
    description = VALUES(description);
