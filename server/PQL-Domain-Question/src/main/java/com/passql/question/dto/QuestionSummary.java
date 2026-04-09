package com.passql.question.dto;

import com.passql.question.constant.ExecutionMode;

import java.time.LocalDateTime;
import java.util.UUID;

public record QuestionSummary(
    UUID questionUuid,
    String topicCode,
    String topicName,
    Integer difficulty,
    ExecutionMode executionMode,
    String stemPreview,
    LocalDateTime createdAt
) {}
