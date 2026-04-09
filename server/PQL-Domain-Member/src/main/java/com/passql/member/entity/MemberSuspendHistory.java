package com.passql.member.entity;

import com.passql.common.entity.BaseEntity;
import com.passql.member.constant.SuspendAction;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 회원 제재/해제 이력 Entity.
 *
 * <p>Member와 조인 없이 memberUuid만 저장한다 (단순 이력).
 */
@Entity
@Table(
    name = "member_suspend_history",
    indexes = {
        @Index(name = "idx_suspend_history_member", columnList = "member_uuid")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MemberSuspendHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID memberSuspendHistoryUuid;

    @Column(columnDefinition = "CHAR(36)", nullable = false)
    private UUID memberUuid;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private SuspendAction action;

    @Column(length = 500)
    private String reason;

    /** 제재 시 설정된 만료 시각. UNSUSPENDED 이력에서는 null. */
    private LocalDateTime suspendUntil;

    @Column(nullable = false)
    private LocalDateTime actedAt;

    public static MemberSuspendHistory ofSuspend(UUID memberUuid, String reason, LocalDateTime suspendUntil) {
        return MemberSuspendHistory.builder()
            .memberUuid(memberUuid)
            .action(SuspendAction.SUSPENDED)
            .reason(reason)
            .suspendUntil(suspendUntil)
            .actedAt(LocalDateTime.now())
            .build();
    }

    public static MemberSuspendHistory ofUnsuspend(UUID memberUuid) {
        return MemberSuspendHistory.builder()
            .memberUuid(memberUuid)
            .action(SuspendAction.UNSUSPENDED)
            .reason(null)
            .suspendUntil(null)
            .actedAt(LocalDateTime.now())
            .build();
    }
}
