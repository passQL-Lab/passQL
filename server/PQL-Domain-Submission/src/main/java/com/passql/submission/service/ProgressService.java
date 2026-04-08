package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.repository.MemberRepository;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.util.StreakCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {
    private final SubmissionRepository submissionRepository;
    private final MemberRepository memberRepository;

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
        return new ProgressResponse(solvedCount, correctRate, streakDays);
    }

    public ProgressSummary getSummary(UUID memberUuid) {
        ProgressResponse pr = getProgress(memberUuid);
        return new ProgressSummary(pr.solvedCount(), pr.correctRate(), pr.streakDays());
    }
}
