package com.passql.submission.dto;

import com.passql.submission.readiness.ToneKey;

import java.time.LocalDateTime;

/**
 * 합격 준비도(Readiness) 응답 블록 (v3).
 *
 * base(Accuracy × Coverage × Recency) + bonus(retry, spread) 구조의 5요소 원본값 공개.
 */
public record ReadinessResponse(
    double score,
    double accuracy,
    double coverage,
    double recency,
    double retry,
    double spread,
    LocalDateTime lastStudiedAt,
    int recentAttemptCount,
    int coveredTopicCount,
    int activeTopicCount,
    Integer daysUntilExam,
    ToneKey toneKey
) {}
