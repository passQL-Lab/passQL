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
import java.util.*;
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
                .findByChallengeDateBetweenOrderByChallengeDateAscSortOrderAsc(from, to);

        List<UUID> uuids = challenges.stream().map(DailyChallenge::getQuestionUuid).toList();
        Map<UUID, Question> questionMap = questionRepository.findAllById(uuids)
                .stream().collect(Collectors.toMap(Question::getQuestionUuid, q -> q));

        return challenges.stream()
                .map(dc -> {
                    Question q = questionMap.get(dc.getQuestionUuid());
                    if (q == null) return null;
                    return new DailyChallengeItem(
                            dc.getChallengeDate(),
                            dc.getSortOrder(),
                            q.getQuestionUuid(),
                            questionService.toSummary(q).topicName(),
                            q.getDifficulty(),
                            q.getStem() == null ? "" : (q.getStem().length() > 80 ? q.getStem().substring(0, 80) : q.getStem())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }

    /** 날짜에 10문제 일괄 배정 (기존 배정 전부 삭제 후 재삽입) */
    @Transactional
    public List<DailyChallengeItem> assign(LocalDate date, List<UUID> questionUuids) {
        if (questionUuids == null || questionUuids.isEmpty()) {
            throw new CustomException(ErrorCode.QUESTION_NOT_FOUND);
        }

        List<Question> questions = questionUuids.stream()
                .map(uuid -> questionRepository.findById(uuid)
                        .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND)))
                .toList();

        questions.forEach(q -> {
            if (!Boolean.TRUE.equals(q.getIsActive())) {
                throw new CustomException(ErrorCode.DAILY_CHALLENGE_QUESTION_INACTIVE);
            }
        });

        dailyChallengeRepository.deleteByChallengeDate(date);

        List<DailyChallenge> saved = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            saved.add(dailyChallengeRepository.save(
                    DailyChallenge.builder()
                            .challengeDate(date)
                            .sortOrder(i)
                            .questionUuid(questions.get(i).getQuestionUuid())
                            .build()));
        }

        return saved.stream().map(dc -> {
            Question q = questions.get(dc.getSortOrder());
            return new DailyChallengeItem(
                    date, dc.getSortOrder(), q.getQuestionUuid(),
                    questionService.toSummary(q).topicName(),
                    q.getDifficulty(),
                    q.getStem() == null ? "" : (q.getStem().length() > 80 ? q.getStem().substring(0, 80) : q.getStem())
            );
        }).toList();
    }

    @Transactional
    public void unassign(LocalDate date) {
        dailyChallengeRepository.deleteByChallengeDate(date);
    }

    /**
     * 자정 스케줄러 폴백. 이미 배정된 날짜 스킵.
     * 토픽 round-robin으로 10문제 선정.
     */
    @Transactional
    public void confirmFallback(LocalDate date) {
        List<DailyChallenge> existing = dailyChallengeRepository
                .findByChallengeDateOrderBySortOrderAsc(date);
        if (!existing.isEmpty()) return;

        List<Question> active = questionRepository.findByIsActiveTrue();
        if (active.isEmpty()) return;

        Map<UUID, List<Question>> byTopic = active.stream()
                .collect(Collectors.groupingBy(Question::getTopicUuid));
        List<List<Question>> groups = new ArrayList<>(byTopic.values());

        long seed = date.toEpochDay();
        groups.forEach(g -> Collections.shuffle(g, new Random(seed)));
        Collections.shuffle(groups, new Random(seed + 1));

        List<UUID> picks = new ArrayList<>();
        int groupIdx = 0;
        int target = Math.min(10, active.size());
        Set<UUID> seen = new HashSet<>();
        while (picks.size() < target) {
            List<Question> group = groups.get(groupIdx % groups.size());
            for (Question q : group) {
                if (!seen.contains(q.getQuestionUuid())) {
                    picks.add(q.getQuestionUuid());
                    seen.add(q.getQuestionUuid());
                    break;
                }
            }
            groupIdx++;
            if (groupIdx > groups.size() * target) break;
        }

        try {
            for (int i = 0; i < picks.size(); i++) {
                dailyChallengeRepository.saveAndFlush(
                        DailyChallenge.builder()
                                .challengeDate(date)
                                .sortOrder(i)
                                .questionUuid(picks.get(i))
                                .build());
            }
        } catch (DataIntegrityViolationException ignored) {
        }
    }
}
