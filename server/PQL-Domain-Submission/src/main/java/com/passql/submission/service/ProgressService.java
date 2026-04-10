package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.repository.TopicRepository;
import com.passql.meta.service.ExamScheduleService;
import com.passql.submission.dto.HeatmapEntry;
import com.passql.submission.dto.HeatmapResponse;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.ReadinessResponse;
import com.passql.submission.dto.RecentAttemptProjection;
import com.passql.submission.readiness.ReadinessCalculator;
import com.passql.submission.readiness.ReadinessConstants;
import com.passql.submission.readiness.ToneKey;
import com.passql.submission.readiness.ToneKeyResolver;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.util.StreakCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
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

    public ProgressResponse getProgress(UUID memberUuid) {
        if (!memberRepository.existsByMemberUuidAndIsDeletedFalse(memberUuid)) {
            throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
        }

        long solvedCount = submissionRepository.countDistinctQuestionUuidByMemberUuid(memberUuid);
        Double rateRaw = submissionRepository.calculateCorrectRateByMemberUuid(memberUuid.toString());
        double correctRate = rateRaw == null ? 0.0 : Math.round(rateRaw * 100.0) / 100.0;
        int streakDays = StreakCalculator.calculate(
            submissionRepository.findSubmissionDatesByMemberUuid(memberUuid)
        );

        ReadinessResponse readiness = buildReadiness(memberUuid);

        return new ProgressResponse(solvedCount, correctRate, streakDays, readiness);
    }

    private ReadinessResponse buildReadiness(UUID memberUuid) {
        LocalDate today = LocalDate.now(ReadinessConstants.ZONE);

        // 최근 N개 시도 (정답 여부 + 시각) — 단일 쿼리
        List<RecentAttemptProjection> recentAttempts = submissionRepository.findRecentAttemptsByMemberUuid(
            memberUuid,
            ReadinessConstants.RECENT_PAGE
        );

        List<Boolean> recentFlags = recentAttempts.stream()
            .map(RecentAttemptProjection::isCorrect)
            .toList();

        LocalDateTime lastStudiedAt = recentAttempts.isEmpty()
            ? null
            : recentAttempts.get(0).submittedAt();
        LocalDate lastStudiedDate = lastStudiedAt == null
            ? null
            : lastStudiedAt.atZone(ReadinessConstants.ZONE).toLocalDate();

        int activeTopicCount = topicRepository.findByIsActiveTrueOrderBySortOrderAsc().size();

        LocalDateTime since = today
            .minusDays(ReadinessConstants.COVERAGE_WINDOW_DAYS)
            .atStartOfDay();
        long coveredLong = submissionRepository.countDistinctRecentActiveTopicsByMemberUuid(
            memberUuid.toString(), since
        );
        int coveredTopicCount = (int) coveredLong;

        ReadinessCalculator.ReadinessResult result = ReadinessCalculator.calculate(
            recentFlags,
            lastStudiedDate,
            coveredTopicCount,
            activeTopicCount,
            today
        );

        Integer daysUntilExam = null;
        ExamScheduleResponse selected = examScheduleService.getSelectedSchedule();
        if (selected != null && selected.getExamDate() != null) {
            long diff = ChronoUnit.DAYS.between(today, selected.getExamDate());
            daysUntilExam = (int) diff;
        }

        ToneKey toneKey = ToneKeyResolver.resolve(daysUntilExam, result.recentAttemptCount());

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

    public HeatmapResponse getHeatmap(UUID memberUuid, LocalDate from, LocalDate to) {
        if (!memberRepository.existsByMemberUuidAndIsDeletedFalse(memberUuid)) {
            throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
        }

        LocalDate today = LocalDate.now();
        LocalDate effectiveFrom = (from != null) ? from : today.minusDays(30);
        LocalDate effectiveTo = (to != null) ? to : today;

        if (effectiveFrom.isAfter(effectiveTo)) {
            return new HeatmapResponse(Collections.emptyList());
        }

        LocalDateTime fromDateTime = effectiveFrom.atStartOfDay();
        LocalDateTime toDateTimeExclusive = effectiveTo.plusDays(1).atStartOfDay();

        List<Object[]> rows = submissionRepository.findHeatmapByMemberUuid(
            memberUuid.toString(), fromDateTime, toDateTimeExclusive
        );

        List<HeatmapEntry> entries = rows.stream()
            .map(row -> new HeatmapEntry(
                ((java.sql.Date) row[0]).toLocalDate(),
                ((Number) row[1]).intValue(),
                ((Number) row[2]).intValue()
            ))
            .toList();

        return new HeatmapResponse(entries);
    }
}
