package com.passql.ai.dto;

import java.util.List;

/**
 * 문제 1개를 Qdrant에 임베딩 적재하는 요청 DTO.
 * Python AI 서버 POST /api/ai/index-question 으로 전달된다.
 */
public record IndexQuestionRequest(
        String questionUuid,
        String topicDisplayName,
        String subtopicDisplayName,
        int difficulty,
        List<String> tagKeys,
        String stem
) {}
