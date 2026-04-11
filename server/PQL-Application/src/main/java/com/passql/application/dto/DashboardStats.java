package com.passql.application.dto;

import java.util.List;

/**
 * 관리자 대시보드 통계 집계 결과.
 *
 * <p>AdminDashboardService가 여러 도메인 Repository를 조합해 만들며,
 * Controller는 이 DTO를 Model에 바인딩해 Thymeleaf에 전달한다.
 */
public record DashboardStats(

        // === 문제 통계 ===
        long totalQuestions,          // 활성 문제 수
        List<TopicQuestionCount> questionsByTopic, // 토픽별 활성 문제 수

        // === 회원 통계 ===
        long totalMembers,            // 전체 회원 수 (비삭제, 비테스트)
        long activeMembers,           // 활성(ACTIVE) 회원 수
        long suspendedMembers,        // 정지(SUSPENDED) 회원 수

        // === 오늘 제출 ===
        long todaySubmissions,        // 오늘 00:00 이후 제출 건수

        // === 실행 로그 (최근 24시간) ===
        long aiCallCount,             // AI 호출 건수 (현재 0, 확장 포인트)
        double errorRate              // SQL 실행 실패율 (%)

) {

    /**
     * 토픽별 문제 수 집계 결과.
     *
     * @param topicUuid  토픽 UUID 문자열
     * @param topicName  토픽 display name (nullable — 조인 실패 시 UUID 약칭 표시)
     * @param count      활성 문제 수
     */
    public record TopicQuestionCount(
            String topicUuid,
            String topicName,
            long count
    ) {}
}
