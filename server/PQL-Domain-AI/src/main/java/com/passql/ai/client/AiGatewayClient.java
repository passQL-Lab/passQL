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
