package com.passql.ai.dto;

import java.util.List;

public record GenerateChoiceSetResult(
        List<GeneratedChoiceDto> choices,
        GenerationMetadataDto metadata
) {}
