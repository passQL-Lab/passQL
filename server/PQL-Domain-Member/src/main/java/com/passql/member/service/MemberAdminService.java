package com.passql.member.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.constant.MemberStatus;
import com.passql.member.dto.MemberAdminDetailResponse;
import com.passql.member.dto.MemberAdminListResponse;
import com.passql.member.dto.MemberSearchCondition;
import com.passql.member.dto.MemberSuspendHistoryResponse;
import com.passql.member.entity.Member;
import com.passql.member.entity.MemberSuspendHistory;
import com.passql.member.repository.MemberRepository;
import com.passql.member.repository.MemberSpecification;
import com.passql.member.repository.MemberSuspendHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberAdminService {

    private final MemberRepository memberRepository;
    private final MemberSuspendHistoryRepository suspendHistoryRepository;

    /** self-injection: @Transactional(REQUIRES_NEW) 가 AOP 프록시를 거치게 하기 위함. */
    @Autowired
    @Lazy
    private MemberAdminService self;

    /** 회원 목록 검색 (동적 필터 + 페이지네이션) */
    public Page<MemberAdminListResponse> searchMembers(MemberSearchCondition cond, Pageable pageable) {
        Specification<Member> spec = Specification
            .where(MemberSpecification.notDeleted())
            .and(MemberSpecification.nicknameContains(cond.getNickname()))
            .and(MemberSpecification.statusEquals(cond.getStatus()))
            .and(MemberSpecification.roleEquals(cond.getRole()))
            .and(MemberSpecification.joinedAfter(cond.getJoinedFrom()))
            .and(MemberSpecification.joinedBefore(cond.getJoinedTo()))
            .and(MemberSpecification.lastSeenAfter(cond.getLastSeenFrom()))
            .and(MemberSpecification.lastSeenBefore(cond.getLastSeenTo()));

        if (!Boolean.TRUE.equals(cond.getIncludeTest())) {
            spec = spec.and(MemberSpecification.excludeTest());
        }

        return memberRepository.findAll(spec, pageable).map(MemberAdminListResponse::from);
    }

    /** 회원 상세 조회 */
    public MemberAdminDetailResponse getMemberDetail(UUID memberUuid) {
        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        List<MemberSuspendHistoryResponse> histories = suspendHistoryRepository
            .findAllByMemberUuidOrderByActedAtDesc(memberUuid)
            .stream()
            .map(MemberSuspendHistoryResponse::from)
            .toList();

        return MemberAdminDetailResponse.from(member, histories);
    }

    /** 회원 제재. suspendUntil은 null 불가, 과거 시각 불가. */
    @Transactional
    public void suspendMember(UUID memberUuid, String reason, LocalDateTime suspendUntil) {
        if (suspendUntil == null || suspendUntil.isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.INVALID_SUSPEND_UNTIL);
        }

        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        member.setStatus(MemberStatus.SUSPENDED);
        member.setSuspendUntil(suspendUntil);

        suspendHistoryRepository.save(MemberSuspendHistory.ofSuspend(memberUuid, reason, suspendUntil));
        log.info("Member suspended: uuid={}, until={}, reason={}", memberUuid, suspendUntil, reason);
    }

    /** 회원 제재 해제 (수동) */
    @Transactional
    public void unsuspendMember(UUID memberUuid) {
        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));

        member.setStatus(MemberStatus.ACTIVE);
        member.setSuspendUntil(null);

        suspendHistoryRepository.save(MemberSuspendHistory.ofUnsuspend(memberUuid));
        log.info("Member unsuspended (manual): uuid={}", memberUuid);
    }

    /**
     * 만료된 제재 자동 해제 (스케줄러에서 호출).
     * 조회는 readOnly TX, 건별 해제는 REQUIRES_NEW로 격리하여
     * 한 건 실패가 배치 전체를 롤백하지 않도록 한다.
     */
    public void autoUnsuspendExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<UUID> expiredUuids = memberRepository
            .findAllByStatusAndSuspendUntilBeforeAndIsDeletedFalse(MemberStatus.SUSPENDED, now)
            .stream()
            .map(Member::getMemberUuid)
            .toList();

        int succeeded = 0;
        int failed = 0;
        for (UUID uuid : expiredUuids) {
            try {
                self.unsuspendSingleInNewTx(uuid);
                succeeded++;
            } catch (Exception e) {
                failed++;
                log.error("Auto-unsuspend failed for member: uuid={}", uuid, e);
            }
        }

        if (!expiredUuids.isEmpty()) {
            log.info("Auto-unsuspend batch: total={}, succeeded={}, failed={}",
                expiredUuids.size(), succeeded, failed);
        }
    }

    /** 단건 자동 해제 — 새 트랜잭션에서 실행되어 실패가 배치 전체를 오염시키지 않는다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unsuspendSingleInNewTx(UUID memberUuid) {
        Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));
        // 배치 조회 후 상태 변경됐을 수 있으므로 재확인
        if (member.getStatus() != MemberStatus.SUSPENDED) {
            return;
        }
        member.setStatus(MemberStatus.ACTIVE);
        member.setSuspendUntil(null);
        suspendHistoryRepository.save(MemberSuspendHistory.ofUnsuspend(memberUuid));
        log.info("Member auto-unsuspended: uuid={}", memberUuid);
    }
}
