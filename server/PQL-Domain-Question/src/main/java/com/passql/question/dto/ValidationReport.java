package com.passql.question.dto;

import java.util.List;

/**
 * 선택지 4개의 샌드박스 실행 검증 결과.
 */
public record ValidationReport(
        int correctCount,
        List<ChoiceValidation> items
) {
    public record ChoiceValidation(
            String key,
            String status,
            List<List<Object>> rows,
            long elapsedMs,
            boolean matchesExpected,
            String error
    ) {}
}
