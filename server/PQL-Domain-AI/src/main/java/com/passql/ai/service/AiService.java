package com.passql.ai.service;

import com.passql.ai.client.OllamaClient;
import com.passql.ai.client.QdrantSearchClient;
import com.passql.ai.dto.AiResult;
import com.passql.ai.dto.SimilarQuestion;
import com.passql.meta.service.PromptService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {
    private final OllamaClient ollamaClient;
    private final QdrantSearchClient qdrantSearchClient;
    private final PromptService promptService;

    @CircuitBreaker(name = "ai", fallbackMethod = "explainErrorFallback")
    public AiResult explainError(UUID memberUuid, UUID questionUuid, String sql, String errorMessage) {
        throw new UnsupportedOperationException("TODO");
    }

    @CircuitBreaker(name = "ai", fallbackMethod = "diffExplainFallback")
    public AiResult diffExplain(UUID memberUuid, UUID questionUuid, String selectedChoiceKey) {
        throw new UnsupportedOperationException("TODO");
    }

    public List<SimilarQuestion> getSimilar(UUID questionUuid, int k) {
        throw new UnsupportedOperationException("TODO");
    }

    public AiResult explainErrorFallback(UUID memberUuid, UUID questionUuid, String sql, String errorMessage, Exception e) {
        log.warn("AI circuit breaker fallback (explainError): {}", e.getMessage());
        return new AiResult("AI 기능이 일시적으로 사용 불가합니다.", 0);
    }

    public AiResult diffExplainFallback(UUID memberUuid, UUID questionUuid, String selectedChoiceKey, Exception e) {
        log.warn("AI circuit breaker fallback (diffExplain): {}", e.getMessage());
        return new AiResult("AI 기능이 일시적으로 사용 불가합니다.", 0);
    }
}
