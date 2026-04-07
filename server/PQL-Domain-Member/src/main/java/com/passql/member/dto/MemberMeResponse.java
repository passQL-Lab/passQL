package com.passql.member.dto;

import com.passql.member.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class MemberMeResponse {

    private UUID memberUuid;
    private String nickname;
    private String role;
    private String status;
    private Boolean isTestAccount;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeenAt;

    public static MemberMeResponse from(Member m) {
        return new MemberMeResponse(
            m.getMemberUuid(),
            m.getNickname(),
            m.getRole().name(),
            m.getStatus().name(),
            m.getIsTestAccount(),
            m.getCreatedAt(),
            m.getLastSeenAt()
        );
    }
}
