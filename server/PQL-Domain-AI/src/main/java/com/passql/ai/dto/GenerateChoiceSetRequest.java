package com.passql.ai.dto;

public record GenerateChoiceSetRequest(
        ChoiceSetContextDto context,
        LlmConfigDto llmConfig
) {}
