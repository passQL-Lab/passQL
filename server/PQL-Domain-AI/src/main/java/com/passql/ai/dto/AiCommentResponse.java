package com.passql.ai.dto;

import java.time.LocalDateTime;

public record AiCommentResponse(String comment, LocalDateTime generatedAt) {}
