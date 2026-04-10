package com.passql.question.dto;

// EXECUTABLE 문제: selectedResult/correctResult/selectedSql/correctSql 포함
// CONCEPT_ONLY 문제: 위 4개 필드 null
public record SubmitResult(
    boolean isCorrect,
    String correctKey,
    String rationale,
    ExecuteResult selectedResult,
    ExecuteResult correctResult,
    String correctSql,
    String selectedSql
) {}
