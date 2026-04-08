package com.passql.submission.service;

import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {
    private final SubmissionRepository submissionRepository;

    public ProgressResponse getProgress(UUID memberUuid) {
        long solvedCount = submissionRepository.countDistinctQuestionUuidByMemberUuid(memberUuid);
        Double rateRaw = submissionRepository.calculateCorrectRateByMemberUuid(memberUuid.toString());
        double correctRate = rateRaw == null ? 0.0 : Math.round(rateRaw * 100.0) / 100.0;
        int streakDays = calculateStreak(memberUuid);
        return new ProgressResponse(solvedCount, correctRate, streakDays);
    }

    public ProgressSummary getSummary(UUID memberUuid) {
        ProgressResponse pr = getProgress(memberUuid);
        return new ProgressSummary(pr.solvedCount(), pr.correctRate(), pr.streakDays());
    }

    private int calculateStreak(UUID memberUuid) {
        List<java.sql.Date> dates = submissionRepository.findSubmissionDatesByMemberUuid(memberUuid);
        if (dates == null || dates.isEmpty()) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        int streak = 0;
        LocalDate expected = today;
        boolean started = false;
        for (java.sql.Date d : dates) {
            LocalDate ld = d.toLocalDate();
            if (!started) {
                if (ld.equals(today) || ld.equals(today.minusDays(1))) {
                    streak = 1;
                    expected = ld.minusDays(1);
                    started = true;
                } else {
                    return 0;
                }
            } else {
                if (ld.equals(expected)) {
                    streak++;
                    expected = expected.minusDays(1);
                } else if (ld.isBefore(expected)) {
                    break;
                }
            }
        }
        return streak;
    }
}
