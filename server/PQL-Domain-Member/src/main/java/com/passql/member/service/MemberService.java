package com.passql.member.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.common.util.NicknameGenerator;
import com.passql.member.constant.MemberStatus;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import com.passql.member.entity.Member;
import com.passql.member.entity.MemberSuspendHistory;
import com.passql.member.repository.MemberRepository;
import com.passql.member.repository.MemberSuspendHistoryRepository;
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
    private final MemberSuspendHistoryRepository memberSuspendHistoryRepository;

    /** 본인 정보 조회 + last_seen_at throttled 갱신. */
    @Transactional
    public MemberMeResponse getMe(UUID memberUuid) {
        Member member = findActiveMember(memberUuid);
        touchLastSeenIfStale(member);
        checkAndAutoUnsuspendIfExpired(member);
        return MemberMeResponse.from(member);
    }

    /**
     * 제재 상태 체크.
     * <ul>
     *   <li>만료된 경우 → 자동 해제 후 통과</li>
     *   <li>만료 전(또는 영구 제재) → {@link ErrorCode#MEMBER_SUSPENDED} 예외</li>
     *   <li>SUSPENDED 아님 → 통과</li>
     * </ul>
     */
    private void checkAndAutoUnsuspendIfExpired(Member member) {
        if (member.getStatus() != MemberStatus.SUSPENDED) {
            return;
        }
        LocalDateTime until = member.getSuspendUntil();
        if (until != null && until.isBefore(LocalDateTime.now())) {
            member.setStatus(MemberStatus.ACTIVE);
            member.setSuspendUntil(null);
            memberSuspendHistoryRepository.save(MemberSuspendHistory.ofUnsuspend(member.getMemberUuid()));
            log.info("Member auto-unsuspended on getMe: uuid={}", member.getMemberUuid());
            return;
        }
        log.warn("Suspended member access blocked: uuid={}, until={}", member.getMemberUuid(), until);
        throw new CustomException(ErrorCode.MEMBER_SUSPENDED);
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

    // 닉네임 중복 확인 — 유효성은 컨트롤러 @Valid에서 처리
    @Transactional(readOnly = true)
    public NicknameCheckResponse checkNickname(String nickname) {
        boolean available = !memberRepository.existsByNicknameAndIsDeletedFalse(nickname);
        return new NicknameCheckResponse(available);
    }

    // 닉네임 직접 변경 — 쿨다운, 중복 검증 포함
    @Transactional
    public NicknameChangeResponse changeNickname(UUID memberUuid, NicknameChangeRequest request) {
        Member member = findActiveMember(memberUuid);

        // 3일 쿨다운 체크
        if (member.isNicknameChangeCooldown()) {
            throw new CustomException(ErrorCode.NICKNAME_COOLDOWN);
        }

        // 중복 체크 (본인 제외)
        String newNickname = request.nickname();
        if (!newNickname.equals(member.getNickname())
                && memberRepository.existsByNicknameAndIsDeletedFalse(newNickname)) {
            throw new CustomException(ErrorCode.NICKNAME_DUPLICATE);
        }

        member.changeNickname(newNickname);
        return new NicknameChangeResponse(member.getNickname());
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
