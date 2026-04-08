package com.passql.application.service;

import com.passql.question.dto.TodayQuestionResponse;
import com.passql.question.entity.Question;
import com.passql.question.service.QuestionService;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 홈 화면 관련 도메인 조합 로직.
 * QuestionService(오늘의 문제) + SubmissionRepository(오늘 풀었는지)를 묶는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

    private final QuestionService questionService;
    private final SubmissionRepository submissionRepository;

    public TodayQuestionResponse getToday(UUID memberUuid) {
        Question question = questionService.resolveTodayQuestion();
        if (question == null) {
            return new TodayQuestionResponse(null, false);
        }
        boolean already = false;
        if (memberUuid != null) {
            LocalDate today = LocalDate.now();
            LocalDateTime start = today.atStartOfDay();
            LocalDateTime end = today.plusDays(1).atStartOfDay();
            already = submissionRepository.existsByMemberUuidAndQuestionUuidAndSubmittedAtBetween(
                    memberUuid, question.getQuestionUuid(), start, end);
        }
        return new TodayQuestionResponse(questionService.toSummary(question), already);
    }
}
