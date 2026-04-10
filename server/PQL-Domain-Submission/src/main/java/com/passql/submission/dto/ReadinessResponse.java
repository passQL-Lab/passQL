package com.passql.submission.dto;

import java.time.LocalDateTime;

/**
 * 합격 준비도(Readiness) 응답 블록.
 *
 * 산식의 3요소(정답률/커버리지/최신성)와 원본 카운트를 투명하게 공개한다.
 * FE는 (toneKey, scoreBand) 조합으로 카피를 선택한다.
 */
public record ReadinessResponse(
    double score,
    double accuracy,
    double coverage,
    double recency,
    LocalDateTime lastStudiedAt,
    int recentAttemptCount,
    int coveredTopicCount,
    int activeTopicCount,
    Integer daysUntilExam,
    String toneKey
) {}
