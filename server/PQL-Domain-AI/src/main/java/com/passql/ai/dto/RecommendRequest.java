package com.passql.ai.dto;

import java.util.List;

/**
 * 개인화 문제 추천 요청 DTO.
 * Java가 Submission DB에서 사용자 신호를 집계하여 Python에 전달한다.
 *
 * Python AI 서버 POST /api/ai/recommend 으로 전달된다.
 */
public record RecommendRequest(
        int size,
        // 최근 오답 문제 UUID 목록 — 이 벡터들의 평균을 쿼리로 사용
        List<String> recentWrongQuestionUuids,
        // 이미 푼 문제 UUID 목록 — Qdrant must_not 필터로 제외
        List<String> solvedQuestionUuids
) {}
