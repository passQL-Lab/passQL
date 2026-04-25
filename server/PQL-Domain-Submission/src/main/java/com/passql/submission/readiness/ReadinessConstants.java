package com.passql.submission.readiness;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.ZoneId;

/**
 * 합격 준비도(Readiness) 산식에서 사용하는 튜닝 가능 상수 모음.
 * 실험/조정 시 이 파일만 수정하면 전체 로직이 일관되게 반영된다.
 */
public final class ReadinessConstants {

    private ReadinessConstants() {}

    /** 정답률·난이도 계산 시 참조할 최근 시도 개수 */
    public static final int RECENT_ATTEMPT_WINDOW = 50;

    /** Accuracy/Difficulty 조회용 재사용 Pageable */
    public static final Pageable RECENT_PAGE = PageRequest.of(0, RECENT_ATTEMPT_WINDOW);

    /** 커버리지·고른학습 판정 기준 일수 (최근 N일 내 푼 토픽) */
    public static final int COVERAGE_WINDOW_DAYS = 14;

    /** 시도 이력이 전혀 없을 때의 Recency 바닥값 */
    public static final double RECENCY_DEFAULT = 0.70;

    // ── Recency 감쇠 테이블 ──────────────────────────────────────────

    /** 0~1일 경과: 생생한 학습 */
    public static final long RECENCY_T1_DAYS = 1L;
    public static final double RECENCY_T1_VALUE = 1.00;

    /** 2~3일 경과 */
    public static final long RECENCY_T2_DAYS = 3L;
    public static final double RECENCY_T2_VALUE = 0.95;

    /** 4~7일 경과 */
    public static final long RECENCY_T3_DAYS = 7L;
    public static final double RECENCY_T3_VALUE = 0.85;

    /** 8~14일 경과 */
    public static final long RECENCY_T4_DAYS = 14L;
    public static final double RECENCY_T4_VALUE = 0.75;

    /** 15일+: RECENCY_DEFAULT 적용 */

    // ── 보너스 계수 가중치 ───────────────────────────────────────────
    // base = Accuracy × Coverage × Recency
    // bonus = 1 + (retry × BONUS_RETRY) + (spread × BONUS_SPREAD)
    // score = clamp(base × bonus, 0, 1)

    /** 오답 복습 보너스 — 최대 +10% */
    public static final double BONUS_RETRY  = 0.10;

    /** 고른 학습 보너스 — 최대 +5% */
    public static final double BONUS_SPREAD = 0.05;

    /** 서버 기준 타임존 — Recency/D-day 계산에 사용 */
    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
}
