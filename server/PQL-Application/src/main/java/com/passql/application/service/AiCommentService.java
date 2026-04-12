package com.passql.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.ai.client.GeminiClient;
import com.passql.ai.dto.AiCommentResponse;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.service.TopicAnalysisService;
import com.passql.submission.dto.TopicAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiCommentService {

    private static final String CACHE_KEY_PREFIX = "ai-comment:";
    /** 세션 단위 캐시 TTL — 결과 화면 확인 시간으로 충분 */
    private static final long CACHE_TTL_HOURS = 2;

    private final GeminiClient geminiClient;
    private final TopicAnalysisService topicAnalysisService;
    private final SubmissionRepository submissionRepository;
    private final PromptService promptService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 세션별 AI 코멘트 반환.
     * 캐시 키: ai-comment:{memberUuid}:{sessionUuid} (TTL 2h)
     * 프롬프트: prompt_template DB의 'ai_comment' 활성 버전
     */
    public AiCommentResponse getAiComment(UUID memberUuid, UUID sessionUuid) {
        // sessionUuid 있으면 세션 단위 캐시(결과 화면), 없으면 멤버 단위 캐시(통계 화면)
        String cacheKey = sessionUuid != null
                ? CACHE_KEY_PREFIX + memberUuid + ":" + sessionUuid
                : CACHE_KEY_PREFIX + memberUuid;

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue((String) cached, AiCommentResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("AI comment cache deserialization failed for {}, regenerating", memberUuid, e);
            }
        }

        // DB에서 활성 프롬프트 조회
        PromptTemplate prompt = promptService.getActivePrompt("ai_comment");

        // 이번 세션 결과 집계 — sessionUuid 없으면(통계 화면) 생략
        String sessionStats = sessionUuid != null ? buildSessionStats(sessionUuid) : "세션 데이터 없음";

        // 누적 토픽 통계
        TopicAnalysisResponse analysis = topicAnalysisService.getTopicAnalysis(memberUuid);
        String topicStats;
        try {
            topicStats = objectMapper.writeValueAsString(analysis.topicStats());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize topic stats", e);
            return new AiCommentResponse("분석 데이터를 처리하는 중 오류가 발생했습니다.", LocalDateTime.now());
        }

        // userTemplate 변수 치환
        String userPrompt = prompt.getUserTemplate()
                .replace("{sessionStats}", sessionStats)
                .replace("{topicStats}", topicStats);

        // Gemini 호출
        String comment;
        try {
            comment = geminiClient.chat(
                    prompt.getModel(),
                    prompt.getSystemPrompt(),
                    userPrompt,
                    prompt.getTemperature(),
                    prompt.getMaxTokens()
            );
        } catch (Exception e) {
            log.error("Gemini AI comment generation failed for member={}, session={}", memberUuid, sessionUuid, e);
            throw new CustomException(ErrorCode.AI_UNAVAILABLE);
        }

        AiCommentResponse response = new AiCommentResponse(comment.trim(), LocalDateTime.now());

        // 세션 단위 캐시 저장 (TTL 2h)
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache AI comment for member={}, session={}", memberUuid, sessionUuid, e);
        }

        return response;
    }

    /** 세션 내 제출 목록을 "토픽명: 정답/오답" 형태 텍스트로 변환 */
    private String buildSessionStats(UUID sessionUuid) {
        List<Object[]> rows = submissionRepository.findTopicResultsBySessionUuid(sessionUuid.toString());
        if (rows.isEmpty()) {
            return "세션 데이터 없음";
        }
        return rows.stream()
                .map(row -> {
                    String topicName = (String) row[0];
                    Boolean isCorrect = (Boolean) row[1];
                    return topicName + ": " + (Boolean.TRUE.equals(isCorrect) ? "정답" : "오답");
                })
                .collect(Collectors.joining("\n"));
    }

    /**
     * 특정 세션의 AI 코멘트 캐시를 즉시 무효화한다.
     * 세션 단위 캐시(ai-comment:{memberUuid}:{sessionUuid})를 삭제하므로 두 파라미터 모두 필요.
     */
    @Transactional
    public void evictCache(UUID memberUuid, UUID sessionUuid) {
        String cacheKey = sessionUuid != null
                ? CACHE_KEY_PREFIX + memberUuid + ":" + sessionUuid
                : CACHE_KEY_PREFIX + memberUuid;
        redisTemplate.delete(cacheKey);
    }
}
