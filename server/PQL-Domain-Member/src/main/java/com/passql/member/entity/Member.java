package com.passql.member.entity;

import com.passql.common.entity.SoftDeletableBaseEntity;
import com.passql.member.constant.AuthProvider;
import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 회원 Entity.
 *
 * <p>설계 원칙:
 * <ul>
 *   <li>PK는 {@link UUID}, JPA가 자동 생성한다 ({@code GenerationType.UUID}).</li>
 *   <li>외부 노출 식별자도 동일한 PK를 그대로 사용한다.</li>
 *   <li>{@link SoftDeletableBaseEntity}를 상속하여 소프트 딜리트를 지원한다.</li>
 *   <li>인증 연동 / 라이프사이클 / 행동 추적 컬럼은 향후 별도 테이블로 분리될 후보 그룹이다.</li>
 * </ul>
 */
@Entity
@Table(
    name = "member",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_member_nickname", columnNames = "nickname")
    },
    indexes = {
        @Index(name = "idx_member_auth_provider", columnList = "auth_provider, provider_user_id"),
        @Index(name = "idx_member_status", columnList = "status"),
        @Index(name = "idx_member_role", columnList = "role"),
        @Index(name = "idx_member_is_test", columnList = "is_test_account"),
        @Index(name = "idx_member_is_deleted", columnList = "is_deleted")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends SoftDeletableBaseEntity {

    // === 식별 (코어) ===
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID memberUuid;

    @Column(length = 50, nullable = false)
    private String nickname;

    // 닉네임 마지막 변경 시각 — 3일 쿨다운 계산 기준
    private LocalDateTime nicknameChangedAt;

    // === 권한 / 상태 ===
    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private MemberStatus status;

    @Column(nullable = false)
    private Boolean isTestAccount;

    // === 인증 연동 (향후 member_auth 테이블 분리 후보) ===
    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private AuthProvider authProvider;

    @Column(length = 255)
    private String providerUserId;

    @Column(length = 255)
    private String email;

    @Column(nullable = false)
    private Boolean emailVerified;

    // === 라이프사이클 ===
    private LocalDateTime withdrawnAt;

    /** 제재 만료 시각. null이면 제재 없음. */
    private LocalDateTime suspendUntil;

    // === 행동 추적 (향후 member_activity 테이블 분리 후보) ===
    private LocalDateTime lastSeenAt;

    @Column(length = 45)
    private String lastLoginIp;

    // === 정적 팩토리 ===

    /** OAuth 소셜 로그인으로 신규 가입 시 호출. 닉네임은 호출자가 NicknameGenerator로 미리 만들어 전달한다. */
    public static Member signUp(String providerUserId, AuthProvider authProvider,
                                String email, Boolean emailVerified, String nickname) {
        Member m = new Member();
        m.nickname = nickname;
        m.role = MemberRole.USER;
        m.status = MemberStatus.ACTIVE;
        m.authProvider = authProvider;
        m.providerUserId = providerUserId;
        m.email = email;
        m.emailVerified = emailVerified != null ? emailVerified : false;
        m.isTestAccount = false;
        m.lastSeenAt = LocalDateTime.now();
        return m;
    }

    // 닉네임 직접 변경 — 쿨다운 갱신 포함
    public void changeNickname(String newNickname) {
        this.nickname = newNickname;
        this.nicknameChangedAt = LocalDateTime.now();
    }

    // 3일 쿨다운 여부 확인
    public boolean isNicknameChangeCooldown() {
        if (nicknameChangedAt == null) return false;
        return LocalDateTime.now().isBefore(nicknameChangedAt.plusDays(3));
    }
}
