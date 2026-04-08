package com.passql.question.dto;

import java.util.UUID;

public record QuestionSummary(
    UUID questionUuid,
    String topicName,
    Integer difficulty,
    String stemPreview
) {}
