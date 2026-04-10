package com.passql.question.dto;

public record ImportItemResult(
    int index,
    String stemPreview,
    String topicCode,
    Integer difficulty,
    String executionMode,
    String sandboxStatus,
    Integer sandboxRowCount,
    Long sandboxElapsedMs,
    String sandboxError,
    String importAction
) {}
