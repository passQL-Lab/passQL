package com.passql.web.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoiceSet;
import com.passql.question.entity.QuizSession;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.question.repository.QuestionChoiceSetItemRepository;
import com.passql.question.repository.QuestionChoiceSetRepository;
import com.passql.question.repository.QuestionConceptTagRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.question.repository.QuizSessionRepository;
import com.passql.submission.repository.ExecutionLogRepository;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminQuestionDeleteService {

    private final QuestionRepository questionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;
    private final QuestionChoiceSetRepository choiceSetRepository;
    private final QuestionChoiceSetItemRepository choiceSetItemRepository;
    private final QuestionConceptTagRepository conceptTagRepository;
    private final DailyChallengeRepository dailyChallengeRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final SubmissionRepository submissionRepository;
    private final ExecutionLogRepository executionLogRepository;

    @Transactional
    public void deleteQuestionCascade(UUID questionUuid) {
        // 0. Question 존재 확인
        Question question = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        // 1. 안전장치: 진행중인 QuizSession에서 해당 문제 사용 중인지 검사
        List<QuizSession> activeSessions = quizSessionRepository.findByStatus(QuizSessionStatus.IN_PROGRESS);
        for (QuizSession session : activeSessions) {
            if (session.getQuestionOrderJson() != null
                    && session.getQuestionOrderJson().contains(questionUuid.toString())) {
                throw new CustomException(ErrorCode.QUESTION_IN_ACTIVE_SESSION);
            }
        }

        // 2. ExecutionLog 삭제
        executionLogRepository.deleteByQuestionUuid(questionUuid);

        // 3. Submission 삭제
        submissionRepository.deleteByQuestionUuid(questionUuid);

        // 4. DailyChallenge 삭제
        dailyChallengeRepository.deleteByQuestionUuid(questionUuid);

        // 5. QuestionConceptTag 삭제
        conceptTagRepository.deleteByQuestionUuid(questionUuid);

        // 6. QuestionChoiceSetItem 삭제 (ChoiceSet UUID 목록 통해 간접 삭제)
        List<QuestionChoiceSet> choiceSets = choiceSetRepository.findByQuestionUuidOrderByCreatedAtDesc(questionUuid);
        if (!choiceSets.isEmpty()) {
            List<UUID> choiceSetUuids = choiceSets.stream()
                    .map(QuestionChoiceSet::getChoiceSetUuid)
                    .toList();
            choiceSetItemRepository.deleteByChoiceSetUuidIn(choiceSetUuids);
        }

        // 7. QuestionChoiceSet 삭제
        choiceSetRepository.deleteByQuestionUuid(questionUuid);

        // 8. QuestionChoice 삭제
        questionChoiceRepository.deleteByQuestionUuid(questionUuid);

        // 9. Question 본체 삭제
        questionRepository.delete(question);

        log.info("문제 삭제 완료: questionUuid={}", questionUuid);
    }

    /**
     * 선택된 UUID 목록을 순차적으로 cascade 삭제한다.
     * 각 문제를 독립 트랜잭션으로 처리하여 일부 실패 시 나머지 삭제는 계속 진행한다.
     *
     * @return 삭제 결과 요약 (deleted: 성공, skipped: 건너뜀, errors: 실패 UUID 목록)
     */
    public BulkDeleteResult bulkDeleteQuestions(List<UUID> questionUuids) {
        int deleted = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        for (UUID uuid : questionUuids) {
            try {
                // REQUIRES_NEW: 문제별 독립 트랜잭션 → 한 건 실패가 다른 건 롤백에 영향 안 줌
                deleteSingleInNewTransaction(uuid);
                deleted++;
            } catch (Exception e) {
                // CustomException(활성세션·미존재) 및 JPA 예외 등 모두 스킵 처리
                skipped++;
                errors.add(uuid + ": " + e.getMessage());
                log.warn("일괄삭제 스킵: questionUuid={}, reason={}", uuid, e.getMessage());
            }
        }

        log.info("일괄삭제 완료: total={}, deleted={}, skipped={}", questionUuids.size(), deleted, skipped);
        return new BulkDeleteResult(deleted, skipped, errors);
    }

    /**
     * 단일 문제를 새 트랜잭션으로 삭제한다.
     * bulkDeleteQuestions에서 문제별 독립 커밋을 보장하기 위해 분리.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteSingleInNewTransaction(UUID questionUuid) {
        deleteQuestionCascade(questionUuid);
    }

    /**
     * 일괄삭제 결과 DTO.
     */
    public record BulkDeleteResult(int deleted, int skipped, List<String> errors) {}
}
