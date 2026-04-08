package com.passql.question.dto;

public record TodayQuestionResponse(
    QuestionSummary question,
    boolean alreadySolvedToday
) {}
