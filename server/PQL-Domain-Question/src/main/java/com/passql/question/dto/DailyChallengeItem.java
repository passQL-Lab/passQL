package com.passql.question.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DailyChallengeItem(
    LocalDate challengeDate,
    int sortOrder,
    UUID questionUuid,
    String topicName,
    Integer difficulty,
    String stemPreview
) {}
