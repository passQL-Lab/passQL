package com.passql.application.service;

import com.passql.question.dto.DailySetTodayResponse;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.DailySetSubmissionRepository;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

    private final QuestionService questionService;
    private final DailyChallengeRepository dailyChallengeRepository;
    private final DailySetSubmissionRepository dailySetSubmissionRepository;

    public DailySetTodayResponse getToday(UUID memberUuid) {
        LocalDate today = LocalDate.now();
        List<DailyChallenge> challenges = dailyChallengeRepository
                .findByChallengeDateOrderBySortOrderAsc(today);

        if (challenges.isEmpty()) {
            return new DailySetTodayResponse(List.of(), false, null);
        }

        boolean alreadyCompleted = memberUuid != null &&
                dailySetSubmissionRepository.existsByMemberUuidAndChallengeDate(memberUuid, today);

        Integer correctCount = null;
        if (alreadyCompleted) {
            correctCount = dailySetSubmissionRepository
                    .findByMemberUuidAndChallengeDate(memberUuid, today)
                    .map(s -> s.getCorrectCount())
                    .orElse(null);
        }

        // 삭제된 문제는 null 필터링, 멤버별 seed로 셔플하여 순서 노출 방지
        var questions = challenges.stream()
                .map(dc -> questionService.getQuestionEntityOrNull(dc.getQuestionUuid()))
                .filter(Objects::nonNull)
                .map(questionService::toSummary)
                .collect(Collectors.toCollection(ArrayList::new));

        if (memberUuid != null) {
            long seed = (memberUuid.toString() + today.toString()).hashCode();
            Collections.shuffle(questions, new Random(seed));
        }

        return new DailySetTodayResponse(questions, alreadyCompleted, correctCount);
    }
}
