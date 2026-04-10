package com.passql.submission.readiness;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 합격 준비도 3요소(정답률 × 커버리지 × 최신성) 순수 계산기.
 *
 * 상태가 없는 순수 함수 묶음이므로 {@code static} 메서드로 노출한다.
 * 프로젝트 내 다른 순수 유틸(예: {@code StreakCalculator})과 컨벤션 일치.
 *
 * DB / Spring Context 의존 없음 — 입력값을 모아서 서비스가 호출한다.
 */
@Slf4j
public final class ReadinessCalculator {

    private ReadinessCalculator() {}

    /**
     * @param recentCorrectFlags 최근 시도의 isCorrect 리스트 (submittedAt DESC, 상위 RECENT_ATTEMPT_WINDOW개)
     * @param lastStudiedAt 마지막 시도 일자 (없으면 null)
     * @param coveredTopicCount 최근 COVERAGE_WINDOW_DAYS일 내 distinct 활성 토픽 수
     * @param activeTopicCount 활성 토픽 전체 수
     * @param today KST 기준 "오늘" (테스트 용이성)
     */
    public static ReadinessResult calculate(
        List<Boolean> recentCorrectFlags,
        LocalDate lastStudiedAt,
        int coveredTopicCount,
        int activeTopicCount,
        LocalDate today
    ) {
        double accuracy = computeAccuracy(recentCorrectFlags);
        double coverage = computeCoverage(coveredTopicCount, activeTopicCount);
        double recency = computeRecency(lastStudiedAt, today);

        double score = round2(accuracy * coverage * recency);

        return new ReadinessResult(
            score,
            round2(accuracy),
            round2(coverage),
            round2(recency),
            recentCorrectFlags == null ? 0 : recentCorrectFlags.size()
        );
    }

    private static double computeAccuracy(List<Boolean> flags) {
        if (flags == null || flags.isEmpty()) return 0.0;
        long correct = flags.stream().filter(Boolean.TRUE::equals).count();
        return (double) correct / flags.size();
    }

    private static double computeCoverage(int covered, int active) {
        if (active <= 0) return 0.0;
        return (double) covered / active;
    }

    private static double computeRecency(LocalDate lastStudiedAt, LocalDate today) {
        if (lastStudiedAt == null) return ReadinessConstants.RECENCY_DEFAULT;

        long days = ChronoUnit.DAYS.between(lastStudiedAt, today);
        if (days < 0) {
            // 시계 스큐 / 수동 데이터 이상. 0으로 보정하되 관측을 남긴다.
            log.warn("lastStudiedAt is in the future — clock skew? lastStudiedAt={}, today={}",
                lastStudiedAt, today);
            days = 0;
        }

        if (days <= ReadinessConstants.RECENCY_T1_DAYS) return ReadinessConstants.RECENCY_T1_VALUE;
        if (days <= ReadinessConstants.RECENCY_T2_DAYS) return ReadinessConstants.RECENCY_T2_VALUE;
        if (days <= ReadinessConstants.RECENCY_T3_DAYS) return ReadinessConstants.RECENCY_T3_VALUE;
        if (days <= ReadinessConstants.RECENCY_T4_DAYS) return ReadinessConstants.RECENCY_T4_VALUE;
        return ReadinessConstants.RECENCY_DEFAULT;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /**
     * 계산 결과. ProgressService가 이를 받아 ReadinessResponse로 변환한다.
     */
    public record ReadinessResult(
        double score,
        double accuracy,
        double coverage,
        double recency,
        int recentAttemptCount
    ) {}
}
