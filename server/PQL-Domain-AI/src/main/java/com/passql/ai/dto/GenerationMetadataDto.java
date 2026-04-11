package com.passql.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;

import java.util.Map;
import java.util.UUID;

/**
 * AI 호출 메타데이터.
 * Python 서버는 model_name, elapsed_ms 등 snake_case로 응답한다.
 * snakeCaseMapper(SNAKE_CASE)가 modelName ↔ model_name 자동 변환.
 * Python이 보내지 않는 promptTemplateUuid, attempts는 Nulls.SET(null→기본값)으로 처리.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GenerationMetadataDto(
        String modelName,
        @JsonSetter(nulls = Nulls.SET) UUID promptTemplateUuid,
        int elapsedMs,
        Integer promptTokens,
        Integer completionTokens,
        Map<String, Object> rawResponseJson,
        @JsonSetter(nulls = Nulls.SET) Integer attempts
) {}
