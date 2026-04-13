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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDailyChallengeService {

    private final DailyChallengeRepository dailyChallengeRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;

    public List<DailyChallengeItem> getChallenges(LocalDate from, LocalDate to) {
        List<DailyChallenge> challenges = dailyChallengeRepository
                .findByChallengeDateBetweenOrderByChallengeDateAsc(from, to);

        List<UUID> uuids = challenges.stream().map(DailyChallenge::getQuestionUuid).toList();
        Map<UUID, Question> questionMap = questionRepository.findAllById(uuids)
                .stream().collect(Collectors.toMap(Question::getQuestionUuid, q -> q));

        return challenges.stream()
                .map(dc -> {
                    Question q = questionMap.get(dc.getQuestionUuid());
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

    /**
     * 폴백 결과를 daily_challenge 테이블에 확정 저장한다.
     * 이미 배정된 날짜는 스킵한다. 활성 문제가 없으면 저장하지 않는다.
     * 스케줄러와 resolveTodayQuestion() 백업 경로에서 공통으로 사용한다.
     */
    @Transactional
    public void confirmFallback(LocalDate date) {
        // 이미 배정된 날짜면 스킵
        if (dailyChallengeRepository.findByChallengeDate(date).isPresent()) {
            return;
        }

        List<UUID> active = questionRepository.findActiveUuidsOrderedByCreatedAt();
        if (active.isEmpty()) {
            return;
        }

        long seed = date.toEpochDay();
        UUID pick = active.get((int) Math.floorMod(seed, active.size()));

        DailyChallenge dc = DailyChallenge.builder()
                .challengeDate(date)
                .questionUuid(pick)
                .build();
        dailyChallengeRepository.save(dc);
    }
}
