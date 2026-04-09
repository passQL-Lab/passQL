package com.passql.ai.dto;

/**
 * AI 생성 선택지 한 개.
 */
public record GeneratedChoiceDto(
        String key,
        String body,
        boolean isCorrect,
        String rationale
) {}
