package com.passql.question.dto;

import java.util.UUID;

// EXECUTABLE 문제: selectedResult/correctResult/selectedSql/correctSql 포함
// CONCEPT_ONLY 문제: 위 4개 필드 null
// submissionUuid: 저장된 제출 UUID — 프론트 신고 기능에서 사용
public record SubmitResult(
    boolean isCorrect,
    String correctKey,
    String rationale,
    ExecuteResult selectedResult,
    ExecuteResult correctResult,
    String correctSql,
    String selectedSql,
    UUID submissionUuid
) {}
