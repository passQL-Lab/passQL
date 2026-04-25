package com.passql.question.dto;

import java.util.List;

// GET → POST 전환으로 쿼리스트링 URL 길이 초과 문제 해결
public record RecommendationsRequest(
    int size,
    List<String> excludeQuestionUuids
) {
    public RecommendationsRequest {
        if (excludeQuestionUuids == null) excludeQuestionUuids = List.of();
    }
}
