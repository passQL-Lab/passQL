package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.question.constant.ChoiceSetSource;
import com.passql.question.constant.ChoiceSetStatus;
import com.passql.question.entity.QuizSession;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.question.service.ChoiceSetGenerationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * 비동기 프리페치 서비스.
 * 사용자가 현재 문제를 보는 동안, 다음 문제의 선택지를 미리 생성한다.
 * 모든 예외 흡수 — 사용자 플로우 차단 금지.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PrefetchService {

    private final QuizSessionRepository quizSessionRepository;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final ChoiceSetGenerationService choiceSetGenerationService;
    private final ObjectMapper objectMapper;

    @Async("aiTaskExecutor")
    public void prefetchNext(UUID sessionUuid, int currentIndex) {
        try {
            QuizSession session = quizSessionRepository.findById(sessionUuid).orElse(null);
            if (session == null) return;

            int nextIndex = currentIndex + 1;
            if (nextIndex >= session.getTotalQuestions()) return;

            List<String> order = objectMapper.readValue(
                    session.getQuestionOrderJson(), new TypeReference<>() {});
            UUID nextQuestionUuid = UUID.fromString(order.get(nextIndex));

            // 이미 프리페치된 게 있으면 스킵
            boolean exists = choiceSetRepository
                    .existsByQuestionUuidAndGeneratedForMemberUuidAndSourceAndStatusAndConsumedAtIsNull(
                            nextQuestionUuid, session.getMemberUuid(),
                            ChoiceSetSource.AI_PREFETCH, ChoiceSetStatus.OK);
            if (exists) {
                log.debug("[prefetch] already exists: sessionUuid={}, nextIndex={}", sessionUuid, nextIndex);
                return;
            }

            choiceSetGenerationService.generate(nextQuestionUuid, session.getMemberUuid(),
                    ChoiceSetSource.AI_PREFETCH);
            log.info("[prefetch] success: sessionUuid={}, nextIndex={}", sessionUuid, nextIndex);

        } catch (CustomException e) {
            log.warn("[prefetch] failed, runtime will regenerate: code={}, sessionUuid={}, nextIndex={}",
                    e.getErrorCode(), sessionUuid, currentIndex + 1, e);
        } catch (Exception e) {
            log.error("[prefetch] unexpected: sessionUuid={}", sessionUuid, e);
        }
    }
}
