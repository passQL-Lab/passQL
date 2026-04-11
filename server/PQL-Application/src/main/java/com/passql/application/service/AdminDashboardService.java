package com.passql.application.service;

import com.passql.application.dto.DashboardStats;
import com.passql.member.constant.MemberStatus;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.submission.dto.MonitorStats;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 관리자 대시보드 통계 집계 서비스.
 *
 * <p>여러 도메인 Repository를 조합해 단일 {@link DashboardStats}를 만든다.
 * Application 레이어에 배치하는 이유: 멤버·문제·제출·메타 등 복수 도메인 경계를 넘는
 * 읽기 전용 집계 로직이기 때문이다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final QuestionRepository questionRepository;
    private final MemberRepository memberRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionService submissionService;
    private final TopicRepository topicRepository;

    /**
     * 대시보드 통계를 집계해 반환한다.
     *
     * <p>쿼리 목록:
     * <ol>
     *   <li>활성 문제 수 (count 쿼리)</li>
     *   <li>토픽별 문제 수 (native group-by)</li>
     *   <li>활성 토픽 목록 (displayName 조인용)</li>
     *   <li>전체/활성/정지 회원 수 (count 쿼리, 테스트 계정 제외)</li>
     *   <li>오늘 제출 건수 (count 쿼리)</li>
     *   <li>최근 24h 실행 로그 → 에러율 계산 (SubmissionService 위임)</li>
     * </ol>
     */
    public DashboardStats collect() {
        // --- 문제 통계 ---
        long totalQuestions = questionRepository.countByIsActiveTrue();

        List<DashboardStats.TopicQuestionCount> questionsByTopic = buildTopicCounts();

        // --- 회원 통계 (테스트 계정 제외, count 쿼리로 처리) ---
        long totalMembers     = memberRepository.countByIsTestAccountFalseAndIsDeletedFalse();
        long activeMembers    = memberRepository.countByIsTestAccountFalseAndIsDeletedFalseAndStatus(MemberStatus.ACTIVE);
        long suspendedMembers = memberRepository.countByIsTestAccountFalseAndIsDeletedFalseAndStatus(MemberStatus.SUSPENDED);

        // --- 오늘 제출 건수 (오늘 00:00 이후) ---
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long todaySubmissions = submissionRepository.countBySubmittedAtAfter(todayStart);

        // --- 최근 24시간 실행 로그 → 에러율 (SubmissionService 재사용) ---
        MonitorStats monitorStats = submissionService.getStats24h();
        long total24h = monitorStats.successCount() + monitorStats.failCount();
        double errorRate = total24h > 0
                ? (monitorStats.failCount() * 100.0) / total24h
                : 0.0;

        return new DashboardStats(
                totalQuestions,
                questionsByTopic,
                totalMembers,
                activeMembers,
                suspendedMembers,
                todaySubmissions,
                monitorStats.aiCallCount(),
                errorRate
        );
    }

    /**
     * 토픽별 활성 문제 수를 집계한다.
     *
     * <p>QuestionRepository의 native group-by 결과({@code Object[]})를
     * 활성 토픽 displayName과 조인해 정렬된 리스트로 반환한다.
     * 비활성 토픽은 조인 대상에서 제외하며, 조인 실패 시 UUID 앞 8자리를 폴백으로 표시한다.
     */
    private List<DashboardStats.TopicQuestionCount> buildTopicCounts() {
        List<Object[]> raw = questionRepository.countActiveByTopic();

        // 활성 토픽만 대상으로 UUID → displayName 맵 구성
        Map<UUID, String> topicNameMap = topicRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .collect(Collectors.toMap(Topic::getTopicUuid, t ->
                        t.getDisplayName() != null ? t.getDisplayName() : t.getCode()));

        return raw.stream()
                .map(row -> {
                    String uuidStr = row[0].toString();
                    long   count   = ((Number) row[1]).longValue();
                    UUID   uuid    = UUID.fromString(uuidStr);
                    String name    = topicNameMap.getOrDefault(uuid, uuidStr.substring(0, 8) + "…");
                    return new DashboardStats.TopicQuestionCount(uuidStr, name, count);
                })
                .sorted(Comparator.comparingLong(DashboardStats.TopicQuestionCount::count).reversed())
                .collect(Collectors.toList());
    }
}
