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
import java.time.format.DateTimeFormatter;
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
    /** 통계 화면 AI 코멘트 프롬프트 키 — 세션 없는 누적 통계 전용 */
    private static final String PROMPT_KEY_STATS = "ai_comment_stats";
    /** 결과 화면 AI 코멘트 프롬프트 키 — 세션 결과 + 누적 통계 통합 */
    private static final String PROMPT_KEY_SESSION = "ai_comment";
    /** 통계 화면 최근 활동 기간 (일) */
    private static final int RECENT_ACTIVITY_DAYS = 7;

    private final GeminiClient geminiClient;
    private final TopicAnalysisService topicAnalysisService;
    private final SubmissionRepository submissionRepository;
    private final PromptService promptService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * AI 코멘트 반환.
     * - sessionUuid 있음(결과 화면): 'ai_comment' 프롬프트, 세션 결과 + 누적 토픽 통계
     * - sessionUuid 없음(통계 화면): 'ai_comment_stats' 프롬프트, 최근 7일 활동 + 누적 토픽 통계
     *
     * 캐시 키: ai-comment:{memberUuid}:{sessionUuid} / ai-comment:{memberUuid}:stats
     */
    public AiCommentResponse getAiComment(UUID memberUuid, UUID sessionUuid) {
        // 통계 화면은 별도 캐시 키 사용 — 세션 결과 화면과 충돌 방지
        String cacheKey = sessionUuid != null
                ? CACHE_KEY_PREFIX + memberUuid + ":" + sessionUuid
                : CACHE_KEY_PREFIX + memberUuid + ":stats";

        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                return objectMapper.readValue((String) cached, AiCommentResponse.class);
            } catch (JsonProcessingException e) {
                log.warn("AI comment cache deserialization failed for {}, regenerating", memberUuid, e);
            }
        }

        // 화면 유형에 따라 다른 프롬프트 키 사용
        String promptKey = sessionUuid != null ? PROMPT_KEY_SESSION : PROMPT_KEY_STATS;
        PromptTemplate prompt = promptService.getActivePrompt(promptKey);

        // 누적 토픽 통계 (공통)
        TopicAnalysisResponse analysis = topicAnalysisService.getTopicAnalysis(memberUuid);
        String topicStats;
        try {
            topicStats = objectMapper.writeValueAsString(analysis.topicStats());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize topic stats", e);
            return new AiCommentResponse("분석 데이터를 처리하는 중 오류가 발생했습니다.", LocalDateTime.now());
        }

        String userPrompt;
        if (sessionUuid != null) {
            // 결과 화면: 세션 결과 변수 치환
            String sessionStats = buildSessionStats(sessionUuid);
            userPrompt = prompt.getUserTemplate()
                    .replace("{sessionStats}", sessionStats)
                    .replace("{topicStats}", topicStats);
        } else {
            // 통계 화면: 최근 7일 활동 데이터 변수 치환
            String recentActivitySummary = buildRecentActivitySummary(memberUuid);
            userPrompt = prompt.getUserTemplate()
                    .replace("{topicStats}", topicStats)
                    .replace("{recentActivity}", recentActivitySummary);
        }

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

        // 캐시 저장 (TTL 2h)
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            log.warn("Failed to cache AI comment for member={}, session={}", memberUuid, sessionUuid, e);
        }

        return response;
    }

    /**
     * 최근 7일 학습 현황을 텍스트로 변환.
     * "최근 7일 풀이 수: N문제 / 최근 활동일: YYYY-MM-DD" 형태로 반환.
     */
    private String buildRecentActivitySummary(UUID memberUuid) {
        LocalDateTime since = LocalDateTime.now().minusDays(RECENT_ACTIVITY_DAYS);
        Object[] row = submissionRepository.findRecentActivityStats(memberUuid.toString(), since);

        long recentCount = row[0] != null ? ((Number) row[0]).longValue() : 0L;
        String lastActiveDate = row[1] != null
                ? ((java.sql.Timestamp) row[1]).toLocalDateTime()
                        .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                : "없음";

        return "최근 " + RECENT_ACTIVITY_DAYS + "일 풀이 수: " + recentCount + "문제\n"
                + "최근 활동일: " + lastActiveDate;
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
     * AI 코멘트 캐시 무효화.
     * - sessionUuid 있음: 결과 화면 캐시(ai-comment:{memberUuid}:{sessionUuid}) 삭제
     * - sessionUuid 없음: 통계 화면 캐시(ai-comment:{memberUuid}:stats) 삭제
     */
    @Transactional
    public void evictCache(UUID memberUuid, UUID sessionUuid) {
        String cacheKey = sessionUuid != null
                ? CACHE_KEY_PREFIX + memberUuid + ":" + sessionUuid
                : CACHE_KEY_PREFIX + memberUuid + ":stats";
        redisTemplate.delete(cacheKey);
    }
}
