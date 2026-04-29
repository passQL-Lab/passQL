package com.passql.question.repository;

import com.passql.question.entity.DailySetSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailySetSubmissionRepository extends JpaRepository<DailySetSubmission, UUID> {

    Optional<DailySetSubmission> findByMemberUuidAndChallengeDate(UUID memberUuid, LocalDate challengeDate);

    boolean existsByMemberUuidAndChallengeDate(UUID memberUuid, LocalDate challengeDate);

    /** 오늘 날짜 기준 정답 수 내림차순, 완료 시각 오름차순으로 조회 */
    @Query("SELECT s FROM DailySetSubmission s WHERE s.challengeDate = :date " +
           "ORDER BY s.correctCount DESC, s.completedAt ASC")
    List<DailySetSubmission> findByChallengeDateOrderByScore(@Param("date") LocalDate date);
}
