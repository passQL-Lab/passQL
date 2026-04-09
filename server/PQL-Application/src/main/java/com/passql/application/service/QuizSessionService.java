package com.passql.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.ChoiceSetPolicy;
import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuestionChoiceSetItem;
import com.passql.question.entity.QuizSession;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.question.service.ChoiceSetResolver;
import com.passql.question.service.QuestionService;
import com.passql.submission.entity.Submission;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 퀴즈 세션 플로우 서비스.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizSessionService {

    private static final int DEFAULT_QUESTION_COUNT = 10;

    private final QuestionRepository questionRepository;
    private final QuestionService questionService;
    private final QuizSessionRepository quizSessionRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final SubmissionRepository submissionRepository;
    private final ChoiceSetResolver choiceSetResolver;
    private final PrefetchService prefetchService;
    private final ObjectMapper objectMapper;

    /**
     * 퀴즈 세션을 생성한다. 활성 AI_ONLY 문제 중 최대 10개를 무작위 픽.
     */
    @Transactional
    public QuizSession createSession(UUID memberUuid) {
        List<UUID> activeQuestions = questionRepository.findActiveAiOnlyUuids();
        if (activeQuestions.size() < DEFAULT_QUESTION_COUNT) {
            throw new CustomException(ErrorCode.QUIZ_SESSION_INSUFFICIENT_QUESTIONS,
                    "활성 문제 수: " + activeQuestions.size());
        }

        // 셔플 + 10개 픽
        List<UUID> shuffled = new ArrayList<>(activeQuestions);
        Collections.shuffle(shuffled);
        List<UUID> picked = shuffled.subList(0, DEFAULT_QUESTION_COUNT);

        String orderJson;
        try {
            orderJson = objectMapper.writeValueAsString(picked);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "세션 문제 순서 직렬화 실패");
        }

        QuizSession session = QuizSession.builder()
                .memberUuid(memberUuid)
                .questionOrderJson(orderJson)
                .totalQuestions(DEFAULT_QUESTION_COUNT)
                .currentIndex(0)
                .status(QuizSessionStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();

        return quizSessionRepository.saveAndFlush(session);
    }

    /**
     * 세션의 특정 인덱스 문제 + 선택지 세트를 반환한다.
     * 비동기로 다음 문제를 프리페치한다.
     */
    public QuestionWithChoiceSet getQuestionAt(UUID sessionUuid, int index) {
        QuizSession session = getSession(sessionUuid);
        validateIndex(session, index);

        List<UUID> order = parseOrder(session);
        UUID questionUuid = order.get(index);

        Question question = questionService.getQuestionEntity(questionUuid);
        QuestionChoiceSet choiceSet = choiceSetResolver.resolveForUser(questionUuid, session.getMemberUuid());
        List<QuestionChoiceSetItem> items = choiceSetItemRepository
                .findByChoiceSetUuidOrderBySortOrderAsc(choiceSet.getChoiceSetUuid());

        // 비동기 프리페치
        prefetchService.prefetchNext(sessionUuid, index);

        return new QuestionWithChoiceSet(question, choiceSet, items, session);
    }

    /**
     * 답변 제출.
     */
    @Transactional
    public SubmitAnswerResult submitAnswer(
            UUID sessionUuid, int index, UUID choiceSetUuid, String choiceKey) {
        QuizSession session = getSession(sessionUuid);
        validateIndex(session, index);

        if (session.getStatus() == QuizSessionStatus.COMPLETED) {
            throw new CustomException(ErrorCode.QUIZ_SESSION_ALREADY_COMPLETED);
        }

        // choiceSetUuid 검증
        List<UUID> order = parseOrder(session);
        UUID questionUuid = order.get(index);

        QuestionChoiceSetItem item = choiceSetItemRepository
                .findByChoiceSetUuidAndChoiceKey(choiceSetUuid, choiceKey)
                .orElseThrow(() -> new CustomException(ErrorCode.CHOICE_SET_NOT_FOUND,
                        "choiceSetUuid=" + choiceSetUuid + ", key=" + choiceKey));

        boolean isCorrect = Boolean.TRUE.equals(item.getIsCorrect());

        // 정답 찾기
        List<QuestionChoiceSetItem> allItems = choiceSetItemRepository
                .findByChoiceSetUuidOrderBySortOrderAsc(choiceSetUuid);
        String correctKey = allItems.stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsCorrect()))
                .findFirst()
                .map(QuestionChoiceSetItem::getChoiceKey)
                .orElse(null);

        // Submission 저장
        Submission submission = Submission.builder()
                .memberUuid(session.getMemberUuid())
                .questionUuid(questionUuid)
                .selectedChoiceKey(choiceKey)
                .isCorrect(isCorrect)
                .submittedAt(LocalDateTime.now())
                .choiceSetUuid(choiceSetUuid)
                .sessionUuid(sessionUuid)
                .questionIndex(index)
                .build();
        submissionRepository.save(submission);

        // currentIndex 업데이트
        session.setCurrentIndex(index + 1);
        quizSessionRepository.save(session);

        // rationale 맵 만들기
        Map<String, String> rationales = new LinkedHashMap<>();
        allItems.forEach(i -> rationales.put(i.getChoiceKey(),
                i.getRationale() != null ? i.getRationale() : ""));

        return new SubmitAnswerResult(isCorrect, correctKey, rationales, allItems);
    }

    /**
     * 세션 완료 처리.
     */
    @Transactional
    public QuizSession completeSession(UUID sessionUuid) {
        QuizSession session = getSession(sessionUuid);
        session.setStatus(QuizSessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        return quizSessionRepository.save(session);
    }

    // ========================
    //  내부 유틸
    // ========================

    private QuizSession getSession(UUID sessionUuid) {
        return quizSessionRepository.findById(sessionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUIZ_SESSION_NOT_FOUND));
    }

    private void validateIndex(QuizSession session, int index) {
        if (index < 0 || index >= session.getTotalQuestions()) {
            throw new CustomException(ErrorCode.QUIZ_SESSION_INDEX_OUT_OF_RANGE,
                    "index=" + index + ", total=" + session.getTotalQuestions());
        }
    }

    private List<UUID> parseOrder(QuizSession session) {
        try {
            List<String> strings = objectMapper.readValue(
                    session.getQuestionOrderJson(), new TypeReference<>() {});
            return strings.stream().map(UUID::fromString).toList();
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "세션 문제 순서 파싱 실패");
        }
    }

    // ========================
    //  응답 DTO (inner)
    // ========================

    public record QuestionWithChoiceSet(
            Question question,
            QuestionChoiceSet choiceSet,
            List<QuestionChoiceSetItem> items,
            QuizSession session
    ) {}

    public record SubmitAnswerResult(
            boolean isCorrect,
            String correctKey,
            Map<String, String> rationales,
            List<QuestionChoiceSetItem> items
    ) {}
}
