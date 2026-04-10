package com.passql.question.dto;

public record SseStatusEvent(
    String phase,
    String message
) {}
