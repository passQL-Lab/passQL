package com.passql.ai.dto;

import java.util.UUID;

public record SimilarQuestion(UUID questionUuid, String stem, String topicName, double score) {}
