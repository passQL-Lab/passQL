package com.passql.ai.dto;

import java.util.List;

/**
 * DB UUID vs Qdrant 색인 UUID 비교 결과 DTO.
 * Python AI 서버 POST /api/ai/index-status 응답 매핑.
 * 관리자 임베딩 인덱스 관리 화면에서 미색인 문제 탐지에 사용.
 */
public record IndexStatusResult(
        int collectionPointsCount,  // Qdrant 현재 포인트 수
        int dbQuestionCount,        // Java가 전달한 DB 문제 수
        int unindexedCount,         // 미색인 문제 수
        List<String> unindexedUuids // 미색인 문제 UUID 목록
) {}
