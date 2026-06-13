package com.passql.question.dto;

import java.util.UUID;

public record DailySetCompleteRequest(int correctCount, UUID sessionUuid) {}
