package com.passql.ai.dto;

/**
 * 문제 임베딩 적재 결과 DTO.
 * Python AI 서버 응답 매핑.
 */
public record IndexQuestionResult(
        String questionUuid,
        // 신규 적재면 true, 기존 덮어쓰기면 false
        boolean created
) {}
