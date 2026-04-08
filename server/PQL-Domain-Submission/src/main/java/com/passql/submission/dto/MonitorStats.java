package com.passql.submission.dto;

/**
 * 모니터링 통계 DTO (최근 24시간 기준)
 */
public record MonitorStats(
        long successCount,
        long failCount,
        double avgElapsedMs,
        long aiCallCount
) {}
