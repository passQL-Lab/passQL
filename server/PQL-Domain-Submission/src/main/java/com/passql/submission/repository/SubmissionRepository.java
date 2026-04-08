package com.passql.submission.repository;

import com.passql.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    List<Submission> findByMemberUuidOrderBySubmittedAtDesc(UUID memberUuid);

    long countByMemberUuid(UUID memberUuid);

    long countByMemberUuidAndIsCorrectTrue(UUID memberUuid);

    @Query("SELECT COUNT(DISTINCT s.questionUuid) FROM Submission s WHERE s.memberUuid = :memberUuid")
    long countDistinctQuestionUuidByMemberUuid(@Param("memberUuid") UUID memberUuid);

    boolean existsByMemberUuidAndQuestionUuidAndSubmittedAtBetween(
            UUID memberUuid, UUID questionUuid, LocalDateTime start, LocalDateTime end);

    @Query(value = "WITH latest AS (SELECT question_uuid, is_correct, ROW_NUMBER() OVER (PARTITION BY question_uuid ORDER BY submitted_at DESC) rn FROM submission WHERE member_uuid = :memberUuid) SELECT COALESCE(AVG(CASE WHEN is_correct=1 THEN 1.0 ELSE 0.0 END),0) FROM latest WHERE rn=1", nativeQuery = true)
    Double calculateCorrectRateByMemberUuid(@Param("memberUuid") String memberUuid);

    @Query("SELECT DISTINCT FUNCTION('DATE', s.submittedAt) FROM Submission s WHERE s.memberUuid = :memberUuid ORDER BY FUNCTION('DATE', s.submittedAt) DESC")
    List<java.sql.Date> findSubmissionDatesByMemberUuid(@Param("memberUuid") UUID memberUuid);
}
