package com.passql.member.repository;

import com.passql.member.constant.AuthProvider;
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID>, JpaSpecificationExecutor<Member> {

    // === 일반 조회 (소프트 딜리트 제외) ===
    Optional<Member> findByMemberUuidAndIsDeletedFalse(UUID memberUuid);

    boolean existsByMemberUuidAndIsDeletedFalse(UUID memberUuid);

    boolean existsByNicknameAndIsDeletedFalse(String nickname);

    Optional<Member> findByAuthProviderAndProviderUserIdAndIsDeletedFalse(
        AuthProvider authProvider, String providerUserId);

    /** 스케줄러용: 제재 만료 회원 배치 조회 */
    List<Member> findAllByStatusAndSuspendUntilBeforeAndIsDeletedFalse(
        MemberStatus status, LocalDateTime now);
}
