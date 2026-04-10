package com.passql.submission.dto;

import java.util.UUID;

public record TopicStat(
    UUID topicUuid,
    String displayName,
    int totalQuestionCount,
    double correctRate,
    int solvedCount
) {}
