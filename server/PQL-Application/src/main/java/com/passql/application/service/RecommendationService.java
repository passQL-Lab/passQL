package com.passql.application.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.RecommendRequest;
import com.passql.ai.dto.RecommendResult;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.service.QuestionService;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 개인화 문제 추천 서비스.
 *
 * PQL-Domain-Question과 PQL-Domain-Submission의 의존성을 Application 레이어에서 조합한다.
 * - 사용자 신호 집계: SubmissionRepository
 * - 벡터 검색 요청: AiGatewayClient
 * - 결과 변환: QuestionService
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private final AiGatewayClient aiGatewayClient;
    private final SubmissionRepository submissionRepository;
    private final QuestionService questionService;

    // 오답 쿼리 벡터 생성에 사용할 최근 오답 수
    private static final int WRONG_QUESTION_LIMIT = 10;
    // Qdrant must_not 필터에 포함할 최근 풀이 문제 수 — 전량 전송 시 페이로드 과부하 방지
    private static final int SOLVED_QUESTION_LIMIT = 200;

    /**
     * 개인화 문제 추천.
     *
     * memberUuid가 있으면 RAG 기반 추천을 시도하고, 실패하거나 결과가 없으면 RANDOM fallback.
     *
     * @param size              추천 문제 수 (1~5)
     * @param excludeQuestionUuid 제외할 문제 UUID (오늘의 문제 등)
     * @param memberUuid        회원 UUID (없으면 RANDOM)
     * @return 추천 문제 목록
     */
    public RecommendationsResponse recommend(int size, UUID excludeQuestionUuid, UUID memberUuid) {
        // RAG/RANDOM 경로 모두 동일한 범위 적용
        int clamped = Math.max(1, Math.min(size, 5));
        if (memberUuid != null) {
            RecommendationsResponse aiResult = tryAiRecommend(memberUuid, clamped, excludeQuestionUuid);
            if (aiResult != null && !aiResult.questions().isEmpty()) {
                return aiResult;
            }
            log.info("[recommendation] AI 추천 결과 없음, RANDOM fallback: memberUuid={}", memberUuid);
        }
        return questionService.getRecommendations(clamped, excludeQuestionUuid);
    }

    /**
     * AI 서버에 사용자 신호를 전달하여 개인화 추천을 시도한다.
     *
     * @return 추천 결과 (AI 추천 불가 또는 결과 없으면 null → 호출부에서 RANDOM fallback)
     */
    private RecommendationsResponse tryAiRecommend(UUID memberUuid, int size, UUID excludeQuestionUuid) {
        try {
            String memberUuidStr = memberUuid.toString();

            // 최근 오답 문제 UUID 목록 — 벡터 쿼리 원본
            List<String> recentWrong = submissionRepository.findRecentWrongQuestionUuids(
                    memberUuidStr, WRONG_QUESTION_LIMIT);

            // 오답이 없으면 쿼리 벡터를 만들 수 없으므로 fallback
            if (recentWrong.isEmpty()) {
                log.debug("[recommendation] 최근 오답 없음, RANDOM fallback: memberUuid={}", memberUuid);
                return null;
            }

            // 이미 푼 문제 UUID 목록 — Qdrant must_not 필터 (최근 N건만 전송)
            List<String> solved = submissionRepository.findSolvedQuestionUuids(memberUuidStr, SOLVED_QUESTION_LIMIT);

            // excludeQuestionUuid도 제외 목록에 추가 (오늘의 문제 등)
            List<String> mustNotIds = new ArrayList<>(solved);
            if (excludeQuestionUuid != null) {
                mustNotIds.add(excludeQuestionUuid.toString());
            }

            RecommendResult result = aiGatewayClient.recommend(
                    new RecommendRequest(size, recentWrong, mustNotIds));

            if (result == null || result.items() == null || result.items().isEmpty()) {
                return null;
            }

            // 추천된 questionUuid 목록으로 QuestionSummary 변환
            List<String> recommendedUuids = result.items().stream()
                    .map(RecommendResult.RecommendedQuestion::questionUuid)
                    .toList();

            RecommendationsResponse response = questionService.getRecommendationsByUuids(recommendedUuids);

            log.info("[recommendation] AI 추천 성공: memberUuid={}, count={}, querySourceCount={}",
                    memberUuid, response.questions().size(), result.querySourceCount());
            return response;

        } catch (Exception e) {
            // AI 추천 실패는 서비스 장애로 이어지면 안 됨 — warn 후 null 반환
            log.warn("[recommendation] AI 추천 실패, RANDOM fallback: memberUuid={}, error={}",
                    memberUuid, e.getMessage());
            return null;
        }
    }
}
