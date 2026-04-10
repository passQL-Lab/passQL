package com.passql.question.dto;

import java.util.List;
import java.util.UUID;

public record ExportRequest(
    List<UUID> questionUuids
) {}
