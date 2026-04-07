package com.passql.member.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.common.util.NicknameGenerator;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.MemberRegisterResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    /** last_seen_at throttle 간격 (분) — 5분 이내 재호출은 UPDATE 스킵 */
    private static final long LAST_SEEN_THROTTLE_MINUTES = 5L;

    /** UNIQUE 충돌(nickname race) 재시도 횟수. */
    private static final int UNIQUE_CONFLICT_RETRY = 3;

    private final MemberRepository memberRepository;
    private final NicknameGenerator nicknameGenerator;

    /** 익명 회원 등록. UUID와 닉네임을 자동 발급한다. */
    @Transactional
    public MemberRegisterResponse register() {
        for (int attempt = 1; attempt <= UNIQUE_CONFLICT_RETRY; attempt++) {
            String nickname = generateUniqueNicknameOrThrow();
            Member member = Member.createAnonymous(nickname);
            try {
                Member saved = memberRepository.saveAndFlush(member);
                log.info("Member registered: uuid={}, nickname={}", saved.getMemberUuid(), saved.getNickname());
                return new MemberRegisterResponse(saved.getMemberUuid(), saved.getNickname());
            } catch (DataIntegrityViolationException e) {
                log.warn("Nickname UNIQUE conflict on register (attempt {}/{}): nickname={}",
                    attempt, UNIQUE_CONFLICT_RETRY, nickname);
                if (attempt == UNIQUE_CONFLICT_RETRY) {
                    throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED, e);
                }
            }
        }
        throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED);
    }

    /** 본인 정보 조회 + last_seen_at throttled 갱신. */
    @Transactional
    public MemberMeResponse getMe(UUID memberUuid) {
        Member member = findActiveMember(memberUuid);
        touchLastSeenIfStale(member);
        return MemberMeResponse.from(member);
    }

    /** 닉네임 재생성. */
    @Transactional
    public NicknameRegenerateResponse regenerateNickname(UUID memberUuid) {
        Member member = findActiveMember(memberUuid);
        for (int attempt = 1; attempt <= UNIQUE_CONFLICT_RETRY; attempt++) {
            String newNickname = generateUniqueNicknameOrThrow();
            member.setNickname(newNickname);
            try {
                memberRepository.saveAndFlush(member);
                log.info("Nickname regenerated: uuid={}, nickname={}", memberUuid, newNickname);
                return new NicknameRegenerateResponse(newNickname);
            } catch (DataIntegrityViolationException e) {
                log.warn("Nickname UNIQUE conflict on regenerate (attempt {}/{}): uuid={}, nickname={}",
                    attempt, UNIQUE_CONFLICT_RETRY, memberUuid, newNickname);
                if (attempt == UNIQUE_CONFLICT_RETRY) {
                    throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED, e);
                }
            }
        }
        throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED);
    }

    // === 내부 헬퍼 ===

    private Member findActiveMember(UUID memberUuid) {
        return memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
            .orElseThrow(() -> {
                log.warn("Member not found: uuid={}", memberUuid);
                return new CustomException(ErrorCode.MEMBER_NOT_FOUND);
            });
    }

    private String generateUniqueNicknameOrThrow() {
        try {
            return nicknameGenerator.generateUnique(
                memberRepository::existsByNicknameAndIsDeletedFalse
            );
        } catch (IllegalStateException e) {
            log.error("Nickname generation failed after all fallbacks", e);
            throw new CustomException(ErrorCode.NICKNAME_GENERATION_FAILED, e);
        }
    }

    /**
     * 마지막 갱신 후 {@value #LAST_SEEN_THROTTLE_MINUTES}분이 지난 경우에만 갱신한다.
     * 동일 트랜잭션 내 dirty checking으로 UPDATE가 발생한다.
     */
    private void touchLastSeenIfStale(Member member) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last = member.getLastSeenAt();
        if (last == null || last.plusMinutes(LAST_SEEN_THROTTLE_MINUTES).isBefore(now)) {
            member.setLastSeenAt(now);
        }
    }
}
