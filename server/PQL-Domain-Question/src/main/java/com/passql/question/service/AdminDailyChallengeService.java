package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.DailyChallengeItem;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.entity.Question;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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
     * DailyChallengeScheduler(자정 cron)에서 호출한다.
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

        try {
            // saveAndFlush: 트랜잭션 커밋 전에 즉시 flush하여 UNIQUE 위반을 여기서 감지
            dailyChallengeRepository.saveAndFlush(
                    DailyChallenge.builder()
                            .challengeDate(date)
                            .questionUuid(pick)
                            .build()
            );
        } catch (DataIntegrityViolationException ignored) {
            // 동시 호출로 다른 스레드가 먼저 저장 완료 — 결정론적 알고리즘이므로 동일한 pick 사용
        }
    }
}
