package com.passql.question.repository;

import com.passql.question.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, UUID> {

    Optional<DailyChallenge> findByChallengeDate(LocalDate challengeDate);

    List<DailyChallenge> findByChallengeDateBetweenOrderByChallengeDateAsc(LocalDate from, LocalDate to);
}
