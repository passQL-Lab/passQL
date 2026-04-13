package com.passql.ai.dto;

import java.util.List;

/**
 * 여러 문제를 Qdrant에 일괄 적재하는 요청 DTO.
 * Python AI 서버 POST /api/ai/index-questions-bulk 으로 전달된다.
 */
public record IndexQuestionsBulkRequest(
        List<IndexQuestionRequest> questions
) {}
