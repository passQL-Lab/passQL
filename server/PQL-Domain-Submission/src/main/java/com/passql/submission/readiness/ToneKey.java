package com.passql.submission.readiness;

/**
 * 합격 준비도 응답의 카피 톤 분기 키.
 *
 * 카피 문자열 자체는 FE가 관리하고, 백엔드는 "어떤 톤인지"만 내려준다.
 * FE는 (toneKey, scoreBand) 조합으로 카피 매트릭스를 선택한다.
 *
 * 우선순위: NO_EXAM > ONBOARDING > POST_EXAM > TODAY > SPRINT > PUSH > STEADY > EARLY
 */
public enum ToneKey {
    /** 선택된 시험 일정 없음 */
    NO_EXAM,
    /** 최근 시도 이력 0건 (첫 진입 또는 장기 이탈 복귀) */
    ONBOARDING,
    /** 시험일이 지남 */
    POST_EXAM,
    /** 시험 당일 */
    TODAY,
    /** D-1 ~ D-6: 막판 스퍼트 */
    SPRINT,
    /** D-7 ~ D-14: 가속 구간 */
    PUSH,
    /** D-15 ~ D-30: 정석 구간 */
    STEADY,
    /** D-31+ : 여유 */
    EARLY
}
