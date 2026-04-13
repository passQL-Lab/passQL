package com.passql.ai.dto;

import java.util.List;

/**
 * 개인화 문제 추천 결과 DTO.
 * Python AI 서버 응답 매핑.
 */
public record RecommendResult(
        List<RecommendedQuestion> items,
        int querySourceCount
) {
    public record RecommendedQuestion(
            String questionUuid,
            double score
    ) {}
}
