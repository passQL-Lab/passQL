package com.passql.question.dto;

import java.util.UUID;

public record QuestionExportDto(
    UUID questionUuid,
    String topicCode,
    Integer difficulty,
    String executionMode,
    String stem,
    String hint,
    String schemaDdl,
    String schemaSampleData,
    String schemaIntent,
    String answerSql
) {}
