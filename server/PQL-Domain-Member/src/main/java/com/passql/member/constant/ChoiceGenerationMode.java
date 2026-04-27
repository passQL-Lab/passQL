package com.passql.member.constant;

public enum ChoiceGenerationMode {
    /** 기존 검증된 선택지 재사용 우선 — 없을 때만 AI 실시간 생성 */
    PRACTICE,
    /** 기존 선택지 유무와 무관하게 항상 AI 실시간 생성 */
    REAL
}
