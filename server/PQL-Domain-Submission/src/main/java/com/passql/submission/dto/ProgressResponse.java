package com.passql.submission.dto;

/**
 * 홈 화면용 사용자 진도 응답.
 *
 * 기존 3필드(solvedCount, correctRate, streakDays)는 다른 화면에서 계속 사용되므로 100% 보존한다.
 * `readiness` 블록은 무한 문제 환경에서 "합격 준비도" 개념으로 산출된 게이지 값이다.
 */
public record ProgressResponse(
    long solvedCount,
    double correctRate,
    int streakDays,
    ReadinessResponse readiness
) {}
