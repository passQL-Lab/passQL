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
    @Column(name = "member_uuid", columnDefinition = "CHAR(36)", updatable = false, nullable = false)
    private UUID memberUuid;

    @Column(name = "nickname", length = 50, nullable = false)
    private String nickname;

    // === 권한 / 상태 ===
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 30, nullable = false)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private MemberStatus status;

    @Column(name = "is_test_account", nullable = false)
    private Boolean isTestAccount;

    // === 인증 연동 (향후 member_auth 테이블 분리 후보) ===
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", length = 30, nullable = false)
    private AuthProvider authProvider;

    @Column(name = "provider_user_id", length = 255)
    private String providerUserId;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified;

    // === 라이프사이클 ===
    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    // === 행동 추적 (향후 member_activity 테이블 분리 후보) ===
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    // === 정적 팩토리 ===

    /** 익명 회원 생성. 닉네임은 호출자가 NicknameGenerator로 미리 만들어 전달한다. */
    public static Member createAnonymous(String nickname) {
        Member m = new Member();
        m.nickname = nickname;
        m.role = MemberRole.USER;
        m.status = MemberStatus.ACTIVE;
        m.authProvider = AuthProvider.ANONYMOUS;
        m.emailVerified = false;
        m.isTestAccount = false;
        m.lastSeenAt = LocalDateTime.now();
        return m;
    }

    /** 테스트 계정 생성. 통계/랭킹 집계에서 제외되도록 {@code isTestAccount}가 true로 설정된다. */
    public static Member createTestAccount(String nickname) {
        Member m = createAnonymous(nickname);
        m.isTestAccount = true;
        return m;
    }
}
