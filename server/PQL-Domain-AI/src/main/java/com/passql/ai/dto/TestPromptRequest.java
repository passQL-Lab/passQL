package com.passql.ai.dto;

import java.util.Map;

public record TestPromptRequest(
        LlmConfigDto llmConfig,
        Map<String, String> variables
) {}
