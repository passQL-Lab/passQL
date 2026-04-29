package com.passql.question.dto;

import java.util.List;
import java.util.UUID;

public record DailyChallengeAssignRequest(List<UUID> questionUuids) {}
