package com.passql.submission.dto;

import java.time.LocalDateTime;

/**
 * Readiness 계산용 최근 시도 투영.
 *
 * 하나의 쿼리로 "정답 여부"와 "시도 시각"을 함께 가져와
 * Accuracy 계산과 lastStudiedAt 파악을 단일 조회로 처리한다.
 * (기존엔 MAX(submittedAt) 별도 쿼리가 필요했음)
 */
public record RecentAttemptProjection(
    Boolean isCorrect,
    LocalDateTime submittedAt
) {}
