package com.passql.question.dto;

import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ExecutionMode;
import java.util.List;

public record QuestionDetail(
    Long id, String topicCode, String subtopicCode, Integer difficulty,
    ExecutionMode executionMode, String stem, String schemaDisplay,
    List<ChoiceItem> choices
) {
    public record ChoiceItem(String key, ChoiceKind kind, String body, Integer sortOrder) {}
}
