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

    // PostgreSQL: String → uuid 캐스트는 ::uuid가 아닌 CAST(:param AS uuid) 사용 (Hibernate 파라미터 파싱 호환)
    @Query(value = "WITH latest AS (SELECT question_uuid, is_correct, ROW_NUMBER() OVER (PARTITION BY question_uuid ORDER BY submitted_at DESC) rn FROM submission WHERE member_uuid = CAST(:memberUuid AS uuid)) SELECT COALESCE(AVG(CASE WHEN is_correct=true THEN 1.0 ELSE 0.0 END),0) FROM latest WHERE rn=1", nativeQuery = true)
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
        // PostgreSQL: CAST(:param AS uuid) 사용 (::uuid는 Hibernate 파라미터 파싱 오류 유발)
        "WHERE s.member_uuid = CAST(:memberUuid AS uuid) " +
        "  AND s.submitted_at >= :since " +
        "  AND t.is_active = true",
        nativeQuery = true)
    long countDistinctRecentActiveTopicsByMemberUuid(
        @Param("memberUuid") String memberUuid,
        @Param("since") LocalDateTime since
    );

    /**
     * 히트맵용 날짜별 풀이/정답 수 집계.
     *
     * 기존 인덱스 idx_submission_member_submitted (member_uuid, submitted_at) 활용.
     * to 파라미터는 exclusive upper bound — Service에서 (to + 1일).atStartOfDay()로 전달.
     *
     * @return Object[] = { java.sql.Date date, long solvedCount, long correctCount }
     */
    @Query(value =
        // PostgreSQL: CAST(:param AS uuid) 사용, SUM(boolean) 불가 → CASE로 변환
        "SELECT DATE(s.submitted_at) AS date, " +
        "       COUNT(*)              AS solved_count, " +
        "       SUM(CASE WHEN s.is_correct THEN 1 ELSE 0 END) AS correct_count " +
        "FROM submission s " +
        "WHERE s.member_uuid = CAST(:memberUuid AS uuid) " +
        "  AND s.submitted_at >= :fromDate " +
        "  AND s.submitted_at < :toDateExclusive " +
        "GROUP BY DATE(s.submitted_at) " +
        "ORDER BY date ASC",
        nativeQuery = true)
    List<Object[]> findHeatmapByMemberUuid(
        @Param("memberUuid") String memberUuid,
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDateExclusive") LocalDateTime toDateExclusive
    );

    /** 특정 시간 이후 제출 건수 (대시보드 오늘 제출 집계용) */
    long countBySubmittedAtAfter(LocalDateTime since);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);

    // 문제 전체 기준 오답 제출 보정
    @Modifying
    @Transactional
    @Query("UPDATE Submission s SET s.isCorrect = true WHERE s.questionUuid = :questionUuid AND s.isCorrect = false")
    int correctAllByQuestionUuid(@Param("questionUuid") UUID questionUuid);

    // 선택지 세트 기준 오답 제출 보정
    @Modifying
    @Transactional
    @Query("UPDATE Submission s SET s.isCorrect = true WHERE s.choiceSetUuid = :choiceSetUuid AND s.isCorrect = false")
    int correctAllByChoiceSetUuid(@Param("choiceSetUuid") UUID choiceSetUuid);

    // PostgreSQL: CAST(:param AS uuid) 사용 (::uuid는 Hibernate 파라미터 파싱 오류 유발)
    @Query(value = """
        WITH latest AS (
            SELECT s.question_uuid,
                   q.topic_uuid,
                   s.is_correct,
                   ROW_NUMBER() OVER (PARTITION BY s.question_uuid ORDER BY s.submitted_at DESC, s.submission_uuid DESC) AS rn
            FROM submission s
            JOIN question q ON s.question_uuid = q.question_uuid
            WHERE s.member_uuid = CAST(:memberUuid AS uuid)
              AND s.submitted_at >= :since
        )
        SELECT topic_uuid,
               COUNT(*) AS solved_count,
               AVG(CASE WHEN is_correct = true THEN 1.0 ELSE 0.0 END) AS correct_rate
        FROM latest
        WHERE rn = 1
        GROUP BY topic_uuid
        """, nativeQuery = true)
    List<Object[]> findTopicStatsAfter(@Param("memberUuid") String memberUuid,
                                       @Param("since") LocalDateTime since);

    /**
     * 세션 내 제출 목록을 토픽명과 함께 조회 (AI 코멘트 세션 컨텍스트용).
     *
     * 네이티브 쿼리 사용 이유: Submission↔Question↔Topic 간 @ManyToOne 연관관계가 없어
     * JPQL theta-join 시 데카르트 조인 발생 우려.
     *
     * @return Object[] = { String topicDisplayName, Boolean isCorrect }
     */
    @Query(value =
        "SELECT t.display_name AS topic_name, s.is_correct " +
        "FROM submission s " +
        "JOIN question q ON s.question_uuid = q.question_uuid " +
        "JOIN topic t ON q.topic_uuid = t.topic_uuid " +
        "WHERE s.session_uuid = CAST(:sessionUuid AS uuid) " +
        "ORDER BY s.submitted_at ASC",
        nativeQuery = true)
    List<Object[]> findTopicResultsBySessionUuid(@Param("sessionUuid") String sessionUuid);
}
