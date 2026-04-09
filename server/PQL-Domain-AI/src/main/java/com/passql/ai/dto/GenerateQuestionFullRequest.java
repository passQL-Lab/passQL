package com.passql.ai.dto;

public record GenerateQuestionFullRequest(
        QuestionFullContextDto context,
        LlmConfigDto llmConfig
) {}
