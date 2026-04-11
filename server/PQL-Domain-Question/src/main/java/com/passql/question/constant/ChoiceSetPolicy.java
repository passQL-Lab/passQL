package com.passql.question.constant;

/**
 * 문제가 선택지를 어떻게 공급받는지 결정하는 정책.
 * MVP는 AI_ONLY 만 동작. CURATED_ONLY/HYBRID 는 스키마 예약.
 * ODD_ONE_OUT: "결과가 다른 것은?" 유형 — 4개 중 3개가 동일 결과, 1개만 다른 결과를 정답으로 판별.
 * RESULT_MATCH: "다음 SQL의 실행 결과로 올바른 것은?" 유형 — 선택지 body가 JSON 배열 형태의 결과 테이블.
 */
public enum ChoiceSetPolicy {
    AI_ONLY,
    CURATED_ONLY,
    HYBRID,
    ODD_ONE_OUT,
    RESULT_MATCH
}
