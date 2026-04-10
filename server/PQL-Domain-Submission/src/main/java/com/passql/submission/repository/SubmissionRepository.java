package com.passql.submission.repository;

import com.passql.submission.dto.RecentAttemptProjection;
import com.passql.submission.entity.Submission;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * Readiness 계산용 최근 시도 투영 (Accuracy + lastStudiedAt 단일 조회).
     *
     * 정렬 안정성: 동시각 tiebreaker로 submissionUuid DESC 추가.
     * 호출부에서 {@code ReadinessConstants.RECENT_PAGE}로 상위 N개만 가져온다.
     *
     * 결과의 첫 원소 submittedAt이 마지막 학습 시각이므로 별도 MAX 쿼리가 불필요.
     */
    @Query("SELECT new com.passql.submission.dto.RecentAttemptProjection(s.isCorrect, s.submittedAt) " +
           "FROM Submission s " +
           "WHERE s.memberUuid = :memberUuid " +
           "ORDER BY s.submittedAt DESC, s.submissionUuid DESC")
    List<RecentAttemptProjection> findRecentAttemptsByMemberUuid(
        @Param("memberUuid") UUID memberUuid,
        Pageable pageable
    );

    /**
     * 최근 :since 이후에 제출된 문제들 중 "활성 토픽"의 distinct 개수.
     *
     * 네이티브 쿼리로 작성한 이유:
     *  - Submission 엔티티에 Question/Topic 연관관계(@ManyToOne)가 없어 JPQL theta-join을 쓰면
     *    파서/옵티마이저 이슈(데카르트 조인 → HashJoin 최적화 실패)가 생길 수 있음
     *  - JPQL FQN 참조는 부분 컨텍스트 테스트(@DataJpaTest)에서 엔티티 클래스 로딩 순서 의존성을 가짐
     *  - 기존 {@code calculateCorrectRateByMemberUuid}가 이미 네이티브 쿼리를 쓰고 있어 컨벤션 일관
     *
     * ReadinessCalculator의 Coverage 분자.
     */
    @Query(value =
        "SELECT COUNT(DISTINCT q.topic_uuid) " +
        "FROM submission s " +
        "JOIN question q ON q.question_uuid = s.question_uuid " +
        "JOIN topic t ON t.topic_uuid = q.topic_uuid " +
        "WHERE s.member_uuid = :memberUuid " +
        "  AND s.submitted_at >= :since " +
        "  AND t.is_active = 1",
        nativeQuery = true)
    long countDistinctRecentActiveTopicsByMemberUuid(
        @Param("memberUuid") String memberUuid,
        @Param("since") LocalDateTime since
    );

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);
}
