package com.passql.question.dto;

import java.util.List;

public record RecommendationsResponse(
    List<QuestionSummary> questions
) {}
