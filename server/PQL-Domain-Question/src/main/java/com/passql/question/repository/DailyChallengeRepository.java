package com.passql.question.repository;

import com.passql.question.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, UUID> {

    List<DailyChallenge> findByChallengeDateOrderBySortOrderAsc(LocalDate challengeDate);

    List<DailyChallenge> findByChallengeDateBetweenOrderByChallengeDateAscSortOrderAsc(LocalDate from, LocalDate to);

    boolean existsByChallengeDateAndSortOrder(LocalDate challengeDate, int sortOrder);

    @Modifying
    @Transactional
    void deleteByChallengeDateAndSortOrder(LocalDate challengeDate, int sortOrder);

    @Modifying
    @Transactional
    void deleteByChallengeDate(LocalDate challengeDate);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);
}
