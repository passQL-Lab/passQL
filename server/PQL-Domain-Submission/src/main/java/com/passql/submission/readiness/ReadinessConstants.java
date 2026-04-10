package com.passql.submission.readiness;

import java.time.ZoneId;

/**
 * 합격 준비도(Readiness) 산식에서 사용하는 튜닝 가능 상수 모음.
 * 실험/조정 시 이 파일만 수정하면 전체 로직이 일관되게 반영된다.
 */
public final class ReadinessConstants {

    private ReadinessConstants() {}

    /** 정답률 계산 시 참조할 최근 시도 개수 */
    public static final int RECENT_ATTEMPT_WINDOW = 50;

    /** 커버리지 판정 기준 일수 (최근 N일 내 푼 토픽) */
    public static final int COVERAGE_WINDOW_DAYS = 14;

    /** 시도 이력이 전혀 없을 때의 Recency 바닥값 */
    public static final double RECENCY_DEFAULT = 0.70;

    /** 서버 기준 타임존 — Recency/D-day 계산에 사용 */
    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    // toneKey 상수
    public static final String TONE_NO_EXAM    = "NO_EXAM";
    public static final String TONE_ONBOARDING = "ONBOARDING";
    public static final String TONE_POST_EXAM  = "POST_EXAM";
    public static final String TONE_TODAY      = "TODAY";
    public static final String TONE_SPRINT     = "SPRINT";
    public static final String TONE_PUSH       = "PUSH";
    public static final String TONE_STEADY     = "STEADY";
    public static final String TONE_EARLY      = "EARLY";
}
