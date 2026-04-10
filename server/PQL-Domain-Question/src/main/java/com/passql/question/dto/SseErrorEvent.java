package com.passql.question.dto;

public record SseErrorEvent(
    String code,
    String message,
    boolean retryable
) {}
