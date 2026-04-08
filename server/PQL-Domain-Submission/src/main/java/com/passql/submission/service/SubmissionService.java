package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.SubmitResult;
import com.passql.question.entity.QuestionChoice;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.submission.entity.Submission;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;

    public SubmitResult submit(UUID memberUuid, UUID questionUuid, String selectedChoiceKey) {
        QuestionChoice selected = questionChoiceRepository
                .findByQuestionUuidAndChoiceKey(questionUuid, selectedChoiceKey)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));

        List<QuestionChoice> all = questionChoiceRepository.findByQuestionUuidOrderBySortOrderAsc(questionUuid);
        QuestionChoice correct = all.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsCorrect()))
                .findFirst()
                .orElse(null);

        boolean isCorrect = Boolean.TRUE.equals(selected.getIsCorrect());

        Submission submission = Submission.builder()
                .memberUuid(memberUuid)
                .questionUuid(questionUuid)
                .selectedChoiceKey(selectedChoiceKey)
                .isCorrect(isCorrect)
                .submittedAt(LocalDateTime.now())
                .build();
        submissionRepository.save(submission);

        return new SubmitResult(
                isCorrect,
                correct != null ? correct.getChoiceKey() : null,
                selected.getRationale()
        );
    }
}
