package com.passql.question.dto;

public record SubmitResult(
    boolean isCorrect,
    String correctKey,
    String rationale,
    ExecuteResult selectedResult,
    ExecuteResult correctResult,
    String correctSql,
    String selectedSql
) {}
