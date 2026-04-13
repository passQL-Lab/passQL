package com.passql.ai.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.passql.ai.dto.*;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Java 코드에서 AI 기능 사용 시 유일한 진입점.
 * <p>
 * 메인 경로: Python AI 서버 (HTTP)
 * Fallback: {@link GeminiFallbackClient} (GeminiClient 직접 호출)
 */
@Slf4j
@Component
public class AiGatewayClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper snakeCaseMapper;
    private final GeminiFallbackClient fallbackClient;
    private final String baseUrl;
    private final String apiKey;

    public AiGatewayClient(
            GeminiFallbackClient fallbackClient,
            @Value("${passql.ai-server.base-url:http://localhost:8001}") String baseUrl,
            @Value("${passql.ai-server.api-key:}") String apiKey,
            @Value("${passql.ai-server.timeout-ms:15000}") int timeoutMs
    ) {
        this.fallbackClient = fallbackClient;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;

        // Python 서버는 snake_case JSON
        this.snakeCaseMapper = new ObjectMapper();
        this.snakeCaseMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        // RestTemplate with timeout
        var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(timeoutMs));
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));
        this.restTemplate = new RestTemplate(factory);
    }

    // ========================
    //  generateQuestionFull
    // ========================

    @CircuitBreaker(name = "aiServer", fallbackMethod = "generateQuestionFullFallback")
    @Retry(name = "aiServer")
    public GenerateQuestionFullResult generateQuestionFull(GenerateQuestionFullRequest request) {
        return postToPython("/api/ai/generate-question-full", request, GenerateQuestionFullResult.class);
    }

    private GenerateQuestionFullResult generateQuestionFullFallback(
            GenerateQuestionFullRequest request, Throwable t) {
        log.warn("[AiGateway] generateQuestionFull fallback 진입: {}", t.getMessage());
        return fallbackClient.generateQuestionFull(request);
    }

    // ========================
    //  generateChoiceSet
    // ========================

    @CircuitBreaker(name = "aiServer", fallbackMethod = "generateChoiceSetFallback")
    @Retry(name = "aiServer")
    public GenerateChoiceSetResult generateChoiceSet(GenerateChoiceSetRequest request) {
        return postToPython("/api/ai/generate-choice-set", request, GenerateChoiceSetResult.class);
    }

    private GenerateChoiceSetResult generateChoiceSetFallback(
            GenerateChoiceSetRequest request, Throwable t) {
        log.warn("[AiGateway] generateChoiceSet fallback 진입: {}", t.getMessage());
        return fallbackClient.generateChoiceSet(request);
    }

    // ========================
    //  testPrompt
    // ========================

    @CircuitBreaker(name = "aiServer", fallbackMethod = "testPromptFallback")
    @Retry(name = "aiServer")
    public TestPromptResult testPrompt(TestPromptRequest request) {
        return postToPython("/api/ai/test-prompt", request, TestPromptResult.class);
    }

    private TestPromptResult testPromptFallback(TestPromptRequest request, Throwable t) {
        log.warn("[AiGateway] testPrompt fallback 진입: {}", t.getMessage());
        return fallbackClient.testPrompt(request);
    }

    // ========================
    //  indexQuestion
    // ========================

    /**
     * 문제 1개를 Qdrant에 임베딩 적재.
     * 실패해도 문제 등록 흐름에 영향을 주지 않도록 예외를 catch하여 warn 로그만 남긴다.
     */
    public IndexQuestionResult indexQuestion(IndexQuestionRequest request) {
        try {
            return postToPython("/api/ai/index-question", request, IndexQuestionResult.class);
        } catch (Exception e) {
            log.warn("[AiGateway] indexQuestion 실패 (non-critical): questionUuid={}, error={}",
                    request.questionUuid(), e.getMessage());
            return null;
        }
    }

    /**
     * 문제 목록을 Qdrant에 일괄 적재 (관리자 전체 재색인용).
     */
    public IndexQuestionsBulkResult indexQuestionsBulk(IndexQuestionsBulkRequest request) {
        return postToPython("/api/ai/index-questions-bulk", request, IndexQuestionsBulkResult.class);
    }

    // ========================
    //  recommend
    // ========================

    /**
     * 사용자 신호 기반 개인화 문제 추천.
     * Fallback 없음 — 호출부에서 null 결과 시 RANDOM fallback 처리.
     */
    public RecommendResult recommend(RecommendRequest request) {
        try {
            return postToPython("/api/ai/recommend", request, RecommendResult.class);
        } catch (Exception e) {
            log.warn("[AiGateway] recommend 실패 (RANDOM fallback 예정): error={}", e.getMessage());
            return null;
        }
    }

    // ========================
    //  getIndexStatus
    // ========================

    /**
     * DB 전체 문제 UUID vs Qdrant 색인 UUID 비교하여 미색인 목록 반환.
     * 관리자 임베딩 인덱스 관리 화면에서 사용.
     * AI 서버 장애 시 null 반환 — 호출부에서 에러 배너 처리.
     */
    public IndexStatusResult getIndexStatus(IndexStatusRequest request) {
        try {
            log.info("[AiGateway] getIndexStatus 요청: db_uuid_count={}", request.questionUuids().size());
            IndexStatusResult result = postToPython("/api/ai/index-status", request, IndexStatusResult.class);
            log.info("[AiGateway] getIndexStatus 완료: unindexed_count={}", result.unindexedCount());
            return result;
        } catch (Exception e) {
            log.warn("[AiGateway] getIndexStatus 실패 (null 반환): error={}", e.getMessage());
            return null;
        }
    }

    // ========================
    //  내부 HTTP 처리
    // ========================

    private <T> T postToPython(String path, Object request, Class<T> responseType) {
        String url = baseUrl + path;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isBlank()) {
                headers.set("X-API-Key", apiKey);
            }

            String body = snakeCaseMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new CustomException(ErrorCode.AI_SERVER_UNAVAILABLE,
                        "Python AI 서버 응답 코드: " + response.getStatusCode());
            }

            return snakeCaseMapper.readValue(response.getBody(), responseType);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[AiGateway] Python AI 서버 호출 실패: url={}, error={}", url, e.getMessage());
            throw new CustomException(ErrorCode.AI_SERVER_UNAVAILABLE,
                    "Python AI 서버 호출 실패: " + e.getMessage());
        }
    }
}
