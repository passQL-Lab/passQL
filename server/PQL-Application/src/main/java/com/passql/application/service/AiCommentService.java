package com.passql.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.ai.client.GeminiClient;
import com.passql.ai.dto.AiCommentResponse;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.submission.dto.TopicAnalysisResponse;
import com.passql.submission.service.TopicAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiCommentService {

    private static final String CACHE_KEY_PREFIX = "ai-comment:";
    private static final long CACHE_TTL_HOURS = 24;

    private final GeminiClient geminiClient;
    private final TopicAnalysisService topicAnalysisService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public AiCommentResponse getAiComment(UUID memberUuid) {
        String cacheKey = CACHE_KEY_PREFIX + memberUuid;

        // 캐시 조회
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue((String) cached, AiCommentResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("AI comment cache deserialization failed for {}, regenerating", memberUuid, e);
            }
        }

        // 토픽 분석 조회
        TopicAnalysisResponse analysis = topicAnalysisService.getTopicAnalysis(memberUuid);

        // 프롬프트 구성
        String systemPrompt = """
                당신은 SQL 학습 코치입니다. 사용자의 토픽별 정답률 데이터를 분석하여 약점을 파악하고 집중 학습을 추천하는 피드백을 한국어로 작성하세요. 2~3문장으로 간결하게 작성하세요.
                """;

        String topicJson;
        try {
            topicJson = objectMapper.writeValueAsString(analysis.topicStats());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize topic stats", e);
            return new AiCommentResponse("분석 데이터를 처리하는 중 오류가 발생했습니다.", LocalDateTime.now());
        }

        String userPrompt = "[토픽별 정답률 데이터]\n" + topicJson +
                "\n\n위 데이터를 바탕으로 약한 영역을 파악하고 집중 학습 추천 문구를 생성해주세요.";

        // Gemini 호출 — 실패 시 AI_UNAVAILABLE로 매핑
        String comment;
        try {
            comment = geminiClient.chat(systemPrompt, userPrompt, 0.7f, 300);
        } catch (Exception e) {
            log.error("Gemini AI comment generation failed for {}", memberUuid, e);
            throw new CustomException(ErrorCode.AI_UNAVAILABLE);
        }
        AiCommentResponse response = new AiCommentResponse(comment.trim(), LocalDateTime.now());

        // Redis 저장
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache AI comment for {}", memberUuid, e);
        }

        return response;
    }

    @Transactional
    public void evictCache(UUID memberUuid) {
        redisTemplate.delete(CACHE_KEY_PREFIX + memberUuid);
    }
}
