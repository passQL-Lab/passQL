package com.passql.submission.dto;

import com.passql.submission.readiness.ToneKey;

import java.time.LocalDateTime;

/**
 * 합격 준비도(Readiness) 응답 블록 (v2).
 *
 * 6요소 원본값을 모두 공개해 FE가 팝오버에서 드릴다운할 수 있게 한다.
 */
public record ReadinessResponse(
    double score,
    double accuracy,
    double coverage,
    double recency,
    double difficulty,
    double retry,
    double spread,
    LocalDateTime lastStudiedAt,
    int recentAttemptCount,
    int coveredTopicCount,
    int activeTopicCount,
    Integer daysUntilExam,
    ToneKey toneKey
) {}
