package com.passql.question.dto;

import java.util.List;

public record ImportValidationResult(
    int total,
    int success,
    int failed,
    int newCount,
    int updateCount,
    List<ImportItemResult> items
) {}
