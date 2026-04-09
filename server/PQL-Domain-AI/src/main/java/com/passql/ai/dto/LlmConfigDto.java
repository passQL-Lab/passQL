package com.passql.ai.dto;

import java.util.Map;

/**
 * Spring → Python AI 서버 에 전달되는 LLM 설정.
 * 프롬프트 전문, 모델, response_schema 를 모두 포함한다.
 */
public record LlmConfigDto(
        String model,
        String systemPrompt,
        String userTemplate,
        float temperature,
        int maxTokens,
        Map<String, Object> responseSchema
) {}
