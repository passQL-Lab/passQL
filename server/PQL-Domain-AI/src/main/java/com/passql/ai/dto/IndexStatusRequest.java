package com.passql.ai.dto;

import java.util.List;

/**
 * DB 전체 문제 UUID 목록 기반 색인 상태 확인 요청 DTO.
 * Python AI 서버 POST /api/ai/index-status 로 전달된다.
 * Java가 DB에서 조회한 전체 문제 UUID를 전달하면
 * Python이 Qdrant scroll과 비교하여 미색인 목록을 반환한다.
 */
public record IndexStatusRequest(
        List<String> questionUuids
) {}
