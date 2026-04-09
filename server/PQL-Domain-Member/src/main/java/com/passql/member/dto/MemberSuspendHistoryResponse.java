package com.passql.member.dto;

import com.passql.member.constant.SuspendAction;
import com.passql.member.entity.MemberSuspendHistory;

import java.time.LocalDateTime;
import java.util.UUID;

public record MemberSuspendHistoryResponse(
    UUID memberSuspendHistoryUuid,
    SuspendAction action,
    String reason,
    LocalDateTime suspendUntil,
    LocalDateTime actedAt
) {
    public static MemberSuspendHistoryResponse from(MemberSuspendHistory h) {
        return new MemberSuspendHistoryResponse(
            h.getMemberSuspendHistoryUuid(),
            h.getAction(),
            h.getReason(),
            h.getSuspendUntil(),
            h.getActedAt()
        );
    }
}
