package com.passql.question.dto;

public record ImportResult(
    int created,
    int updated,
    int skipped
) {}
