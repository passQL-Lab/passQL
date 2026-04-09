package com.passql.ai.dto;

import java.util.Map;
import java.util.UUID;

/**
 * AI 호출 메타데이터.
 * ChoiceSetGenerationService 가 이를 QuestionChoiceSet 엔티티로 저장.
 */
public record GenerationMetadataDto(
        String modelName,
        UUID promptTemplateUuid,
        int elapsedMs,
        Integer promptTokens,
        Integer completionTokens,
        Map<String, Object> rawResponseJson,
        int attempts
) {}
