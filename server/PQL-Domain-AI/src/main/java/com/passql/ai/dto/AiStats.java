package com.passql.ai.dto;

/**
 * 모니터링 화면용 AI 호출 통계 DTO.
 *
 * <p>geminiCallCount — GeminiClient 호출 횟수 (서버 기동 이후 누적, 인메모리).
 * explainError / diffExplain / similar 는 AiService 구현 전까지 -1 (미구현 표시).
 */
public record AiStats(
        long geminiCallCount,    // Gemini 직접 호출 횟수 (서버 기동 후 누적)
        long explainErrorCount,  // explain_error 호출 수 (-1 = 미구현)
        long diffExplainCount,   // diff_explain 호출 수 (-1 = 미구현)
        long similarCount,       // Qdrant similar 호출 수 (-1 = 미구현)
        double avgTopK           // Qdrant 평균 k (-1 = 미구현)
) {
    /** 미구현 필드는 -1로 채운 기본 인스턴스 */
    public static AiStats withGeminiCount(long geminiCallCount) {
        return new AiStats(geminiCallCount, -1, -1, -1, -1);
    }
}
