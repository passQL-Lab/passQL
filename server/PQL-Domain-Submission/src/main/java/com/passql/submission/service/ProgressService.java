package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.repository.TopicRepository;
import com.passql.meta.service.ExamScheduleService;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.dto.ReadinessResponse;
import com.passql.submission.readiness.ReadinessCalculator;
import com.passql.submission.readiness.ReadinessConstants;
import com.passql.submission.readiness.ToneKeyResolver;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.util.StreakCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {

    private final SubmissionRepository submissionRepository;
    private final MemberRepository memberRepository;
    private final TopicRepository topicRepository;
    private final ExamScheduleService examScheduleService;
    private final ReadinessCalculator readinessCalculator;
    private final ToneKeyResolver toneKeyResolver;

    public ProgressResponse getProgress(UUID memberUuid) {
        if (!memberRepository.existsByMemberUuidAndIsDeletedFalse(memberUuid)) {
            throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
        }

        // 기존 3지표
        long solvedCount = submissionRepository.countDistinctQuestionUuidByMemberUuid(memberUuid);
        Double rateRaw = submissionRepository.calculateCorrectRateByMemberUuid(memberUuid.toString());
        double correctRate = rateRaw == null ? 0.0 : Math.round(rateRaw * 100.0) / 100.0;
        int streakDays = StreakCalculator.calculate(
            submissionRepository.findSubmissionDatesByMemberUuid(memberUuid)
        );

        // Readiness 계산
        ReadinessResponse readiness = buildReadiness(memberUuid);

        return new ProgressResponse(solvedCount, correctRate, streakDays, readiness);
    }

    public ProgressSummary getSummary(UUID memberUuid) {
        ProgressResponse pr = getProgress(memberUuid);
        return new ProgressSummary(pr.solvedCount(), pr.correctRate(), pr.streakDays());
    }

    private ReadinessResponse buildReadiness(UUID memberUuid) {
        LocalDate today = LocalDate.now(ReadinessConstants.ZONE);

        // 1. 최근 N개 시도 정답 플래그
        List<Boolean> recentFlags = submissionRepository.findRecentCorrectFlagsByMemberUuid(
            memberUuid,
            PageRequest.of(0, ReadinessConstants.RECENT_ATTEMPT_WINDOW)
        );

        // 2. 마지막 시도 시각
        LocalDateTime lastStudiedAt = submissionRepository.findLastSubmittedAtByMemberUuid(memberUuid);
        LocalDate lastStudiedDate = lastStudiedAt == null
            ? null
            : lastStudiedAt.atZone(ReadinessConstants.ZONE).toLocalDate();

        // 3. 활성 토픽 전체 수
        int activeTopicCount = topicRepository.findByIsActiveTrueOrderBySortOrderAsc().size();

        // 4. 최근 W일 내 푼 활성 토픽 수
        LocalDateTime since = today
            .minusDays(ReadinessConstants.COVERAGE_WINDOW_DAYS)
            .atStartOfDay();
        long coveredLong = submissionRepository.countDistinctRecentActiveTopicsByMemberUuid(memberUuid, since);
        int coveredTopicCount = (int) coveredLong;

        // 5. 3요소 계산
        ReadinessCalculator.ReadinessResult result = readinessCalculator.calculate(
            recentFlags,
            lastStudiedDate,
            coveredTopicCount,
            activeTopicCount,
            today
        );

        // 6. D-day
        Integer daysUntilExam = null;
        ExamScheduleResponse selected = examScheduleService.getSelectedSchedule();
        if (selected != null && selected.getExamDate() != null) {
            long diff = ChronoUnit.DAYS.between(today, selected.getExamDate());
            daysUntilExam = (int) diff;
        }

        // 7. toneKey
        String toneKey = toneKeyResolver.resolve(daysUntilExam, result.recentAttemptCount());

        return new ReadinessResponse(
            result.score(),
            result.accuracy(),
            result.coverage(),
            result.recency(),
            lastStudiedAt,
            result.recentAttemptCount(),
            coveredTopicCount,
            activeTopicCount,
            daysUntilExam,
            toneKey
        );
    }
}
