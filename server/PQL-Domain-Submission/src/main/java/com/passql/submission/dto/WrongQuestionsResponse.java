package com.passql.submission.dto;

import java.util.List;

public record WrongQuestionsResponse(
    List<WrongQuestionItem> items,
    long totalCount
) {}
