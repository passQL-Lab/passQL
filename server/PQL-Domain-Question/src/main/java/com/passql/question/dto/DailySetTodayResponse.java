package com.passql.question.dto;

import java.util.List;

public record DailySetTodayResponse(
    List<QuestionSummary> questions,
    Boolean alreadyCompleted,
    Integer correctCount
) {}
