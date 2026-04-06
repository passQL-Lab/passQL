package com.passql.question.dto;

import com.passql.question.constant.ExecutionMode;

public record QuestionSummary(Long id, String topicCode, Integer difficulty, String stemPreview, ExecutionMode executionMode) {}
