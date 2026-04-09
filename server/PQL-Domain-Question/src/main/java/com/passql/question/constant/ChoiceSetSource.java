package com.passql.question.constant;

/**
 * 선택지 세트가 어떻게 생성되었는지 출처 구분.
 * - AI_RUNTIME        : 사용자 진입 시 실시간 생성
 * - AI_PREFETCH       : 백그라운드 프리페치로 생성 (특정 멤버 예약)
 * - AI_ADMIN_PREVIEW  : 관리자 프롬프트 테스트용
 * - ADMIN_SEED        : 관리자 문제 등록 시 AI 보조로 생성된 초기 세트
 * - ADMIN_CURATED     : 관리자가 직접 검수·승격한 재사용 세트
 */
public enum ChoiceSetSource {
    AI_RUNTIME,
    AI_PREFETCH,
    AI_ADMIN_PREVIEW,
    ADMIN_SEED,
    ADMIN_CURATED
}
