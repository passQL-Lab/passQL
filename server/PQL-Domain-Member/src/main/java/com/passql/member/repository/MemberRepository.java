package com.passql.member.repository;

import com.passql.member.constant.AuthProvider;
import com.passql.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {

    // === 일반 조회 (소프트 딜리트 제외) ===
    Optional<Member> findByMemberUuidAndIsDeletedFalse(UUID memberUuid);

    boolean existsByNicknameAndIsDeletedFalse(String nickname);

    Optional<Member> findByAuthProviderAndProviderUserIdAndIsDeletedFalse(
        AuthProvider authProvider, String providerUserId);

    // === 관리자/통계용 (소프트 딜리트 포함) ===
    Optional<Member> findByMemberUuid(UUID memberUuid);
}
