package com.passql.member.dto;

import com.passql.member.constant.AuthProvider;
import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MemberAdminDetailResponse(
    UUID memberUuid,
    String nickname,
    MemberStatus status,
    MemberRole role,
    AuthProvider authProvider,
    String email,
    Boolean isTestAccount,
    LocalDateTime createdAt,
    LocalDateTime lastSeenAt,
    String lastLoginIp,
    LocalDateTime suspendUntil,
    LocalDateTime withdrawnAt,
    List<MemberSuspendHistoryResponse> suspendHistories
) {
    public static MemberAdminDetailResponse from(Member m, List<MemberSuspendHistoryResponse> histories) {
        return new MemberAdminDetailResponse(
            m.getMemberUuid(),
            m.getNickname(),
            m.getStatus(),
            m.getRole(),
            m.getAuthProvider(),
            m.getEmail(),
            m.getIsTestAccount(),
            m.getCreatedAt(),
            m.getLastSeenAt(),
            m.getLastLoginIp(),
            m.getSuspendUntil(),
            m.getWithdrawnAt(),
            histories
        );
    }
}
