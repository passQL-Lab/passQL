package com.passql.application.constant;

/**
 * 홈 화면 인사말 메시지 타입.
 * 프론트엔드는 이 값에 따라 아이콘/톤을 분기할 수 있다.
 */
public enum GreetingMessageType {
    /** 일반 인사 (시험 선택 없음 / D-30 초과 / 시험 종료 / 예외 케이스) */
    GENERAL,
    /** 카운트다운 (D-8 ~ D-30) */
    COUNTDOWN,
    /** 긴급 (D-1 ~ D-7) */
    URGENT,
    /** 시험 당일 (D-0) */
    EXAM_DAY
}
