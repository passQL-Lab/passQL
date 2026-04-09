package com.passql.ai.dto;

import java.util.List;

public record GenerateQuestionFullResult(
        String stem,
        String answerSql,
        List<GeneratedChoiceDto> seedChoices,
        GenerationMetadataDto metadata
) {}
