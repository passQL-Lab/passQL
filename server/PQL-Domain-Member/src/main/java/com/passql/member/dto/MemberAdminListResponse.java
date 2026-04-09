package com.passql.member.dto;

import com.passql.member.constant.AuthProvider;
import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;

import java.time.LocalDateTime;
import java.util.UUID;

public record MemberAdminListResponse(
    UUID memberUuid,
    String nickname,
    MemberStatus status,
    MemberRole role,
    AuthProvider authProvider,
    Boolean isTestAccount,
    LocalDateTime createdAt,
    LocalDateTime lastSeenAt
) {
    public static MemberAdminListResponse from(Member m) {
        return new MemberAdminListResponse(
            m.getMemberUuid(),
            m.getNickname(),
            m.getStatus(),
            m.getRole(),
            m.getAuthProvider(),
            m.getIsTestAccount(),
            m.getCreatedAt(),
            m.getLastSeenAt()
        );
    }
}
