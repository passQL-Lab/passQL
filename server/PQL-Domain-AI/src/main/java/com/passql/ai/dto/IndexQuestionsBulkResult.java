package com.passql.ai.dto;

import java.util.List;

/**
 * 문제 일괄 적재 결과 DTO.
 * Python AI 서버 응답 매핑.
 */
public record IndexQuestionsBulkResult(
        int total,
        int succeeded,
        int failed,
        List<String> failedUuids
) {}
