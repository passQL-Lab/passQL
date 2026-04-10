package com.passql.question.dto;

public record SubmitResult(
        Boolean isCorrect,
        String correctKey,
        String rationale,
        String selectedSql,
        String correctSql,
        ExecuteResult selectedResult,
        ExecuteResult correctResult
) {}
