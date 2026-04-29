package com.passql.question.dto;

import java.util.List;

public record DailySetTodayResponse(
    List<QuestionSummary> questions,
    boolean alreadyCompleted,
    Integer correctCount
) {}
