package com.passql.question.dto;

import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.constant.ExecutionMode;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record QuestionDetail(
    UUID questionUuid,
    String topicName,
    String subtopicName,
    Integer difficulty,
    ExecutionMode executionMode,
    String stem,
    String schemaDisplay,
    String schemaDdl,
    String schemaSampleData,
    String schemaIntent,
    String answerSql,
    String hint,
    List<ChoiceSetSummary> choiceSets
) {
    public record ChoiceSetSummary(
        UUID choiceSetUuid,
        ChoiceSetSource source,
        ChoiceSetStatus status,
        Boolean sandboxValidationPassed,
        LocalDateTime createdAt,
        List<ChoiceItem> items
    ) {}

    public record ChoiceItem(String key, ChoiceKind kind, String body, Boolean isCorrect, String rationale, Integer sortOrder) {}
}
