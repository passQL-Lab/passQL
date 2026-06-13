package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.question.dto.DailySetCompleteRequest;
import com.passql.question.dto.DailySetCompleteResponse;
import com.passql.question.dto.LeaderboardEntry;
import com.passql.question.dto.LeaderboardResponse;
import com.passql.question.entity.DailySetSubmission;
import com.passql.question.repository.DailySetSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySetService {

    private final DailySetSubmissionRepository dailySetSubmissionRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public DailySetCompleteResponse complete(UUID memberUuid, DailySetCompleteRequest request) {
        LocalDate today = LocalDate.now();

        // 중복 제출 방어 — DB unique 제약 이전에 애플리케이션 레벨에서 먼저 차단
        if (dailySetSubmissionRepository.existsByMemberUuidAndChallengeDate(memberUuid, today)) {
            throw new CustomException(ErrorCode.DAILY_SET_ALREADY_COMPLETED);
        }

        try {
            dailySetSubmissionRepository.saveAndFlush(
                    DailySetSubmission.builder()
                            .memberUuid(memberUuid)
                            .challengeDate(today)
                            .correctCount(request.correctCount())
                            .completedAt(LocalDateTime.now())
                            .build());
        } catch (DataIntegrityViolationException e) {
            // 동시 요청으로 unique 제약 위반 — 중복 제출로 처리
            throw new CustomException(ErrorCode.DAILY_SET_ALREADY_COMPLETED);
        }

        List<DailySetSubmission> board = dailySetSubmissionRepository
                .findByChallengeDateOrderByScore(today);

        // 제출자의 현재 순위 계산 (1-based)
        int rank = 1;
        for (DailySetSubmission s : board) {
            if (s.getMemberUuid().equals(memberUuid)) break;
            rank++;
        }

        return new DailySetCompleteResponse(request.correctCount(), rank, board.size());
    }

    public LeaderboardResponse getLeaderboard(UUID memberUuid) {
        LocalDate today = LocalDate.now();
        List<DailySetSubmission> board = dailySetSubmissionRepository
                .findByChallengeDateOrderByScore(today);

        List<UUID> memberUuids = board.stream().map(DailySetSubmission::getMemberUuid).toList();
        Map<UUID, String> nicknameMap = memberRepository.findAllById(memberUuids).stream()
                .collect(Collectors.toMap(Member::getMemberUuid, Member::getNickname));

        List<LeaderboardEntry> entries = new ArrayList<>();
        LeaderboardEntry myEntry = null;

        for (int i = 0; i < board.size(); i++) {
            DailySetSubmission s = board.get(i);
            String nickname = nicknameMap.getOrDefault(s.getMemberUuid(), "알 수 없음");
            LeaderboardEntry entry = new LeaderboardEntry(i + 1, nickname, s.getCorrectCount());
            entries.add(entry);
            if (s.getMemberUuid().equals(memberUuid)) {
                myEntry = entry;
            }
        }

        return new LeaderboardResponse(today, entries, myEntry);
    }
}
