package com.passql.submission.readiness;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * 합격 준비도 계산기 (v3).
 *
 * score = clamp(base × bonus, 0, 1)
 * base  = Accuracy × Coverage × Recency
 * bonus = 1 + (retry × BONUS_RETRY) + (spread × BONUS_SPREAD)
 *
 * 곱셈 구조로 Coverage가 낮으면 전체 점수가 낮아지는 필수 조건 역할을 한다.
 * 상태가 없는 순수 함수 묶음이므로 static 메서드로 노출한다.
 * DB / Spring Context 의존 없음 — 입력값을 모아서 서비스가 호출한다.
 */
@Slf4j
public final class ReadinessCalculator {

    private ReadinessCalculator() {}

    /**
     * @param recentCorrectFlags  최근 시도의 isCorrect 리스트 (submittedAt DESC, 상위 50개)
     * @param lastStudiedAt       마지막 시도 일자 (없으면 null)
     * @param coveredTopicCount   최근 14일 내 distinct 활성 토픽 수
     * @param activeTopicCount    활성 토픽 전체 수
     * @param topicCountMap       최근 14일 내 토픽별 제출 건수 (Spread 계산용)
     * @param wrongCount          전체 이력 중 한 번이라도 틀린 distinct 문제 수
     * @param retriedCount        틀렸다가 이후 정답을 낸 distinct 문제 수
     * @param today               KST 기준 오늘 (테스트 용이성)
     */
    public static ReadinessResult calculate(
        List<Boolean> recentCorrectFlags,
        LocalDate lastStudiedAt,
        int coveredTopicCount,
        int activeTopicCount,
        Map<String, Long> topicCountMap,
        long wrongCount,
        long retriedCount,
        LocalDate today
    ) {
        double accuracy = computeAccuracy(recentCorrectFlags);
        double coverage = computeCoverage(coveredTopicCount, activeTopicCount);
        double recency  = computeRecency(lastStudiedAt, today);
        double retry    = computeRetry(wrongCount, retriedCount);
        double spread   = computeSpread(topicCountMap, activeTopicCount);

        double base  = accuracy * coverage * recency;
        double bonus = 1.0
            + retry  * ReadinessConstants.BONUS_RETRY
            + spread * ReadinessConstants.BONUS_SPREAD;
        double score = round2(Math.min(1.0, Math.max(0.0, base * bonus)));

        return new ReadinessResult(
            score,
            round2(accuracy),
            round2(coverage),
            round2(recency),
            round2(retry),
            round2(spread),
            recentCorrectFlags == null ? 0 : recentCorrectFlags.size()
        );
    }

    // ── 요소별 계산 메서드 ──────────────────────────────────────────

    private static double computeAccuracy(List<Boolean> flags) {
        if (flags == null || flags.isEmpty()) return 0.0;
        long correct = flags.stream().filter(Boolean.TRUE::equals).count();
        return (double) correct / flags.size();
    }

    private static double computeCoverage(int covered, int active) {
        if (active <= 0) return 0.0;
        return Math.min(1.0, (double) covered / active);
    }

    private static double computeRecency(LocalDate lastStudiedAt, LocalDate today) {
        if (lastStudiedAt == null) return ReadinessConstants.RECENCY_DEFAULT;

        long days = ChronoUnit.DAYS.between(lastStudiedAt, today);
        if (days < 0) {
            // 시계 스큐 / 수동 데이터 이상. 0으로 보정
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

    /**
     * 틀린 적 없으면 0.0 — 복습 시도 자체가 없으므로 보너스 없음.
     * wrongCount > 0이면 retriedCount / wrongCount.
     */
    static double computeRetry(long wrongCount, long retriedCount) {
        if (wrongCount <= 0) return 0.0;
        return Math.min(1.0, (double) retriedCount / wrongCount);
    }

    /**
     * Shannon 엔트로피로 토픽 분포의 균등도 측정.
     * H_max = log2(activeTopicCount), spread = H / H_max.
     */
    static double computeSpread(Map<String, Long> topicCountMap, int activeTopicCount) {
        if (topicCountMap == null || topicCountMap.isEmpty()) return 0.0;
        if (activeTopicCount <= 1) return 1.0;

        long total = topicCountMap.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) return 0.0;

        double entropy = 0.0;
        for (long count : topicCountMap.values()) {
            if (count > 0) {
                double p = (double) count / total;
                entropy -= p * (Math.log(p) / Math.log(2));
            }
        }

        double hMax = Math.log(activeTopicCount) / Math.log(2);
        if (hMax <= 0) return 0.0;
        return Math.min(1.0, entropy / hMax);
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
        double retry,
        double spread,
        int recentAttemptCount
    ) {}
}
