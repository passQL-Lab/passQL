package com.passql.question.dto;

import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ExecutionMode;

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
    List<ChoiceItem> choices
) {
    public record ChoiceItem(String key, ChoiceKind kind, String body, Integer sortOrder) {}
}
