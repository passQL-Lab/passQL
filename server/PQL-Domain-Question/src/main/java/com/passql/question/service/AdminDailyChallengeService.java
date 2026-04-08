package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.DailyChallengeItem;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.entity.Question;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDailyChallengeService {

    private final DailyChallengeRepository dailyChallengeRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;

    public List<DailyChallengeItem> getChallenges(LocalDate from, LocalDate to) {
        return dailyChallengeRepository
                .findByChallengeDateBetweenOrderByChallengeDateAsc(from, to)
                .stream()
                .map(dc -> {
                    Question q = questionRepository.findById(dc.getQuestionUuid()).orElse(null);
                    if (q == null) return null;
                    return new DailyChallengeItem(
                            dc.getChallengeDate(),
                            q.getQuestionUuid(),
                            questionService.toSummary(q).topicName(),
                            q.getDifficulty(),
                            q.getStem() == null ? "" : (q.getStem().length() > 80 ? q.getStem().substring(0, 80) : q.getStem())
                    );
                })
                .filter(item -> item != null)
                .toList();
    }

    @Transactional
    public DailyChallengeItem assign(LocalDate date, UUID questionUuid) {
        Question question = questionRepository.findById(questionUuid)
                .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND));
        if (!Boolean.TRUE.equals(question.getIsActive())) {
            throw new CustomException(ErrorCode.DAILY_CHALLENGE_QUESTION_INACTIVE);
        }

        DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(date)
                .map(existing -> {
                    existing.setQuestionUuid(questionUuid);
                    return existing;
                })
                .orElseGet(() -> DailyChallenge.builder()
                        .challengeDate(date)
                        .questionUuid(questionUuid)
                        .build());

        dailyChallengeRepository.save(dc);

        return new DailyChallengeItem(
                date,
                question.getQuestionUuid(),
                questionService.toSummary(question).topicName(),
                question.getDifficulty(),
                question.getStem() == null ? "" : (question.getStem().length() > 80 ? question.getStem().substring(0, 80) : question.getStem())
        );
    }

    @Transactional
    public void unassign(LocalDate date) {
        dailyChallengeRepository.findByChallengeDate(date)
                .ifPresent(dailyChallengeRepository::delete);
    }
}
