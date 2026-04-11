package com.passql.application.service;

import com.passql.application.dto.DashboardStats;
import com.passql.member.constant.MemberStatus;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.repository.QuestionRepository;
import com.passql.submission.dto.MonitorStats;
import com.passql.submission.repository.ExecutionLogRepository;
import com.passql.submission.repository.SubmissionRepository;
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
    private final ExecutionLogRepository executionLogRepository;
    private final TopicRepository topicRepository;

    /**
     * 대시보드 통계를 집계해 반환한다.
     *
     * <p>쿼리 목록:
     * <ol>
     *   <li>활성 문제 수 (count)</li>
     *   <li>토픽별 문제 수 (native group-by)</li>
     *   <li>토픽 목록 (displayName 조인용)</li>
     *   <li>전체/활성/정지 회원 수</li>
     *   <li>오늘 제출 건수 (24h 기준)</li>
     *   <li>최근 24h 실행 로그 → 에러율 계산</li>
     * </ol>
     */
    public DashboardStats collect() {
        // --- 문제 통계 ---
        // findByIsActiveTrue()는 이미 정의된 메서드이므로 size()로 집계
        long totalQuestions = questionRepository.findByIsActiveTrue().size();

        List<DashboardStats.TopicQuestionCount> questionsByTopic = buildTopicCounts();

        // --- 회원 통계 (테스트 계정 제외) ---
        List<com.passql.member.entity.Member> allMembers = memberRepository
                .findAll()
                .stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsTestAccount()) && !m.isDeleted())
                .toList();

        long totalMembers    = allMembers.size();
        long activeMembers   = allMembers.stream().filter(m -> m.getStatus() == MemberStatus.ACTIVE).count();
        long suspendedMembers = allMembers.stream().filter(m -> m.getStatus() == MemberStatus.SUSPENDED).count();

        // --- 오늘 제출 건수 (오늘 00:00 이후) ---
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long todaySubmissions = submissionRepository.countBySubmittedAtAfter(todayStart);

        // --- 최근 24시간 실행 로그 → 에러율 ---
        MonitorStats monitorStats = buildMonitorStats();
        long total24h  = monitorStats.successCount() + monitorStats.failCount();
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
     * 토픽 displayName과 조인해 정렬된 리스트로 반환한다.
     */
    private List<DashboardStats.TopicQuestionCount> buildTopicCounts() {
        // { topicUuid(String), count(Long) }
        List<Object[]> raw = questionRepository.countActiveByTopic();

        // 토픽 UUID → displayName 맵
        Map<UUID, String> topicNameMap = topicRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Topic::getTopicUuid, t ->
                        t.getDisplayName() != null ? t.getDisplayName() : t.getCode()));

        return raw.stream()
                .map(row -> {
                    String uuidStr  = row[0].toString();
                    long    count   = ((Number) row[1]).longValue();
                    UUID    uuid    = UUID.fromString(uuidStr);
                    String  name    = topicNameMap.getOrDefault(uuid, uuidStr.substring(0, 8) + "…");
                    return new DashboardStats.TopicQuestionCount(uuidStr, name, count);
                })
                // 문제 수 내림차순 정렬
                .sorted(Comparator.comparingLong(DashboardStats.TopicQuestionCount::count).reversed())
                .collect(Collectors.toList());
    }

    /**
     * 최근 24시간 실행 로그 통계를 반환한다.
     * SubmissionService.getStats24h()와 동일한 로직이나, Service 간 의존성을 피해 직접 구현.
     */
    private MonitorStats buildMonitorStats() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        var logs = executionLogRepository.findByExecutedAtAfter(since);
        long successCount = logs.stream().filter(l -> "OK".equals(l.getStatus())).count();
        long failCount    = logs.stream().filter(l -> !"OK".equals(l.getStatus())).count();
        double avgMs      = logs.stream()
                .filter(l -> l.getElapsedMs() != null)
                .mapToLong(l -> l.getElapsedMs())
                .average().orElse(0.0);
        return new MonitorStats(successCount, failCount, avgMs, 0L);
    }
}
