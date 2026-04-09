package com.passql.question.constant;

/**
 * 문제가 선택지를 어떻게 공급받는지 결정하는 정책.
 * MVP는 AI_ONLY 만 동작. CURATED_ONLY/HYBRID 는 스키마 예약.
 */
public enum ChoiceSetPolicy {
    AI_ONLY,
    CURATED_ONLY,
    HYBRID
}
