package com.passql.web.dto.report;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public record AdminReportSummary(
        UUID questionUuid,
        String questionStem,
        long totalCount,
        long pendingCount,
        Map<String, Long> categoryDistribution,
        LocalDateTime latestReportedAt
) {}
