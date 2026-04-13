# 어드민 회원 관리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자 페이지에 회원 목록 조회 / 상세 조회 / 기간 제재 / 자동 해제 기능을 추가한다.

**Architecture:** `PQL-Domain-Member`에 `MemberSuspendHistory` 엔티티, `MemberAdminService`를 추가하고, `PQL-Web`에 `AdminMemberController`, Thymeleaf 템플릿 2개, `MemberSuspendScheduler`를 추가한다. `member` 테이블에 `suspend_until` 컬럼을 추가하고 `member_suspend_history` 테이블을 신규 생성한다. 동적 검색은 JPA Specification으로 처리한다.

**Tech Stack:** Spring Boot 3.4.4, JPA/Hibernate, JPA Specification, Thymeleaf, DaisyUI 5, Tailwind CSS 4, Lucide Icons, Flyway, Spring `@Scheduled`

---

## File Map

| 파일 | 변경 | 책임 |
|------|------|------|
| `PQL-Domain-Member/src/main/java/com/passql/member/constant/SuspendAction.java` | 생성 | SUSPENDED / UNSUSPENDED enum |
| `PQL-Domain-Member/src/main/java/com/passql/member/entity/MemberSuspendHistory.java` | 생성 | 제재 이력 엔티티 |
| `PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java` | 수정 | `suspendUntil` 필드 추가 |
| `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSuspendHistoryRepository.java` | 생성 | 이력 조회 레포지터리 |
| `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberRepository.java` | 수정 | 스케줄러용 쿼리 추가 |
| `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSpecification.java` | 생성 | JPA Specification 동적 검색 |
| `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSearchCondition.java` | 생성 | 검색 조건 DTO |
| `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberAdminListResponse.java` | 생성 | 목록용 응답 DTO |
| `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberAdminDetailResponse.java` | 생성 | 상세용 응답 DTO |
| `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSuspendHistoryResponse.java` | 생성 | 이력용 응답 DTO |
| `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSuspendRequest.java` | 생성 | 제재 요청 DTO |
| `PQL-Domain-Member/src/main/java/com/passql/member/service/MemberAdminService.java` | 생성 | 조회/제재/해제/자동해제 비즈니스 로직 |
| `PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java` | 수정 | `getMe()`에 자동 해제 체크 추가 |
| `PQL-Web/src/main/resources/db/migration/V0_0_24__add_member_suspend.sql` | 생성 | Flyway DDL 마이그레이션 |
| `PQL-Web/src/main/java/com/passql/web/controller/admin/AdminMemberController.java` | 생성 | 목록/상세/제재/해제 HTTP 엔드포인트 |
| `PQL-Web/src/main/java/com/passql/web/scheduler/MemberSuspendScheduler.java` | 생성 | @Scheduled 자동 해제 배치 |
| `PQL-Web/src/main/resources/templates/admin/members/list.html` | 생성 | 회원 목록 페이지 |
| `PQL-Web/src/main/resources/templates/admin/members/detail.html` | 생성 | 회원 상세 페이지 |
| `PQL-Web/src/main/resources/templates/admin/layout.html` | 수정 | 사이드바에 "회원 관리" 메뉴 추가 |
| `PQL-Domain-Member/src/test/java/com/passql/member/service/MemberAdminServiceTest.java` | 생성 | 통합 테스트 |

---

## Task 1: Flyway 마이그레이션 작성

**Files:**
- Create: `PQL-Web/src/main/resources/db/migration/V0_0_24__add_member_suspend.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

```sql
-- =============================================================================
-- V0_0_24: 회원 제재 기능 스키마 추가
-- member 테이블에 suspend_until 컬럼 추가
-- member_suspend_history 테이블 신규 생성
-- =============================================================================

ALTER TABLE member
    ADD COLUMN suspend_until DATETIME(6) NULL COMMENT '제재 만료 시각 (NULL = 제재 없음 또는 영구 제재)';

CREATE TABLE IF NOT EXISTS member_suspend_history (
    member_suspend_history_uuid CHAR(36)     NOT NULL,
    member_uuid                 CHAR(36)     NOT NULL,
    action                      VARCHAR(20)  NOT NULL COMMENT 'SUSPENDED | UNSUSPENDED',
    reason                      VARCHAR(500) NULL,
    suspend_until               DATETIME(6)  NULL     COMMENT '제재 시 설정된 만료 시각',
    acted_at                    DATETIME(6)  NOT NULL,
    created_at                  DATETIME(6)  NULL,
    updated_at                  DATETIME(6)  NULL,
    PRIMARY KEY (member_suspend_history_uuid),
    INDEX idx_suspend_history_member (member_uuid)
) COMMENT = '회원 제재/해제 이력';
```

- [ ] **Step 2: 애플리케이션 기동해서 마이그레이션 적용 확인**

```bash
cd server
./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```

기동 로그에서 `Successfully applied 1 migration to schema` 확인 후 종료.

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/resources/db/migration/V0_0_24__add_member_suspend.sql
git commit -m "feat(db): member suspend 스키마 추가 (suspend_until, member_suspend_history)"
```

---

## Task 2: `SuspendAction` enum 생성

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/constant/SuspendAction.java`

- [ ] **Step 1: enum 생성**

```java
package com.passql.member.constant;

public enum SuspendAction {
    SUSPENDED,
    UNSUSPENDED
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/constant/SuspendAction.java
git commit -m "feat(member): SuspendAction enum 추가"
```

---

## Task 3: `Member` 엔티티에 `suspendUntil` 필드 추가

**Files:**
- Modify: `PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java`

- [ ] **Step 1: `Member.java`에 필드 추가**

`// === 라이프사이클 ===` 섹션의 `withdrawnAt` 아래에 추가:

```java
    /** 제재 만료 시각. null이면 제재 없음. */
    private LocalDateTime suspendUntil;
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/entity/Member.java
git commit -m "feat(member): Member 엔티티에 suspendUntil 필드 추가"
```

---

## Task 4: `MemberSuspendHistory` 엔티티 생성

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/entity/MemberSuspendHistory.java`

- [ ] **Step 1: 엔티티 생성**

```java
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
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/entity/MemberSuspendHistory.java
git commit -m "feat(member): MemberSuspendHistory 엔티티 생성"
```

---

## Task 5: Repository 생성 및 수정

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSuspendHistoryRepository.java`
- Modify: `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberRepository.java`

- [ ] **Step 1: `MemberSuspendHistoryRepository` 생성**

```java
package com.passql.member.repository;

import com.passql.member.entity.MemberSuspendHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MemberSuspendHistoryRepository extends JpaRepository<MemberSuspendHistory, UUID> {

    List<MemberSuspendHistory> findAllByMemberUuidOrderByActedAtDesc(UUID memberUuid);
}
```

- [ ] **Step 2: `MemberRepository`에 스케줄러용 쿼리 추가**

기존 `MemberRepository.java`에 아래 두 메서드를 추가한다:

```java
    import com.passql.member.constant.MemberStatus;
    import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
    import java.time.LocalDateTime;
    import java.util.List;

    // 인터페이스 선언 변경:
    // public interface MemberRepository extends JpaRepository<Member, UUID>, JpaSpecificationExecutor<Member> {

    /** 스케줄러용: 제재 만료 회원 배치 조회 */
    List<Member> findAllByStatusAndSuspendUntilBeforeAndIsDeletedFalse(
        MemberStatus status, LocalDateTime now);
```

전체 수정 후 `MemberRepository.java`:

```java
package com.passql.member.repository;

import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.passql.member.constant.AuthProvider;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID>, JpaSpecificationExecutor<Member> {

    Optional<Member> findByMemberUuidAndIsDeletedFalse(UUID memberUuid);

    boolean existsByMemberUuidAndIsDeletedFalse(UUID memberUuid);

    boolean existsByNicknameAndIsDeletedFalse(String nickname);

    Optional<Member> findByAuthProviderAndProviderUserIdAndIsDeletedFalse(
        AuthProvider authProvider, String providerUserId);

    List<Member> findAllByStatusAndSuspendUntilBeforeAndIsDeletedFalse(
        MemberStatus status, LocalDateTime now);
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSuspendHistoryRepository.java
git add server/PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberRepository.java
git commit -m "feat(member): MemberSuspendHistoryRepository 생성 및 MemberRepository JpaSpecificationExecutor 확장"
```

---

## Task 6: `MemberSpecification` 생성 (동적 검색)

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSpecification.java`

- [ ] **Step 1: Specification 클래스 생성**

```java
package com.passql.member.repository;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class MemberSpecification {

    public static Specification<Member> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("isDeleted"), false);
    }

    public static Specification<Member> nicknameContains(String nickname) {
        return (root, query, cb) ->
            nickname == null || nickname.isBlank()
                ? cb.conjunction()
                : cb.like(cb.lower(root.get("nickname")), "%" + nickname.toLowerCase() + "%");
    }

    public static Specification<Member> statusEquals(MemberStatus status) {
        return (root, query, cb) ->
            status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Member> roleEquals(MemberRole role) {
        return (root, query, cb) ->
            role == null ? cb.conjunction() : cb.equal(root.get("role"), role);
    }

    public static Specification<Member> joinedAfter(LocalDate from) {
        return (root, query, cb) ->
            from == null ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<Member> joinedBefore(LocalDate to) {
        return (root, query, cb) ->
            to == null ? cb.conjunction()
                : cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay());
    }

    public static Specification<Member> lastSeenAfter(LocalDate from) {
        return (root, query, cb) ->
            from == null ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("lastSeenAt"), from.atStartOfDay());
    }

    public static Specification<Member> lastSeenBefore(LocalDate to) {
        return (root, query, cb) ->
            to == null ? cb.conjunction()
                : cb.lessThan(root.get("lastSeenAt"), to.plusDays(1).atStartOfDay());
    }

    public static Specification<Member> excludeTest() {
        return (root, query, cb) -> cb.equal(root.get("isTestAccount"), false);
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/repository/MemberSpecification.java
git commit -m "feat(member): MemberSpecification 동적 검색 조건 추가"
```

---

## Task 7: DTO 생성

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSearchCondition.java`
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberAdminListResponse.java`
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSuspendHistoryResponse.java`
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberAdminDetailResponse.java`
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/dto/MemberSuspendRequest.java`

- [ ] **Step 1: `MemberSearchCondition.java` 생성**

```java
package com.passql.member.dto;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class MemberSearchCondition {
    private String nickname;
    private MemberStatus status;
    private MemberRole role;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedTo;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate lastSeenFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate lastSeenTo;

    private boolean includeTest = false;
}
```

- [ ] **Step 2: `MemberAdminListResponse.java` 생성**

```java
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
```

- [ ] **Step 3: `MemberSuspendHistoryResponse.java` 생성**

```java
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
```

- [ ] **Step 4: `MemberAdminDetailResponse.java` 생성**

```java
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
```

- [ ] **Step 5: `MemberSuspendRequest.java` 생성**

```java
package com.passql.member.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Getter
@Setter
public class MemberSuspendRequest {
    private String reason;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime suspendUntil;
}
```

- [ ] **Step 6: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 7: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/dto/
git commit -m "feat(member): 어드민 회원 관리 DTO 추가 (검색조건, 목록/상세 응답, 제재 요청)"
```

---

## Task 8: `MemberAdminService` 생성

**Files:**
- Create: `PQL-Domain-Member/src/main/java/com/passql/member/service/MemberAdminService.java`

- [ ] **Step 1: 서비스 생성**

```java
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
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

        if (!cond.isIncludeTest()) {
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

    /** 회원 제재 */
    @Transactional
    public void suspendMember(UUID memberUuid, String reason, LocalDateTime suspendUntil) {
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

    /** 만료된 제재 자동 해제 (스케줄러에서 호출) */
    @Transactional
    public void autoUnsuspendExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<Member> expired = memberRepository
            .findAllByStatusAndSuspendUntilBeforeAndIsDeletedFalse(MemberStatus.SUSPENDED, now);

        for (Member member : expired) {
            member.setStatus(MemberStatus.ACTIVE);
            member.setSuspendUntil(null);
            suspendHistoryRepository.save(MemberSuspendHistory.ofUnsuspend(member.getMemberUuid()));
            log.info("Member auto-unsuspended: uuid={}", member.getMemberUuid());
        }

        if (!expired.isEmpty()) {
            log.info("Auto-unsuspend batch: {}명 해제", expired.size());
        }
    }
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberAdminService.java
git commit -m "feat(member): MemberAdminService 구현 (검색/제재/해제/자동해제)"
```

---

## Task 9: `MemberService.getMe()`에 접속 시 자동 해제 연동

**Files:**
- Modify: `PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java`

- [ ] **Step 1: `MemberService`에 생성자 주입 및 `getMe` 수정**

`MemberService`에 `MemberAdminService` 의존성을 추가하면 순환 참조가 생기므로, 해제 로직을 `MemberService` 내부에 직접 작성한다.

`MemberSuspendHistoryRepository`를 `MemberService`에 추가로 주입하고, `getMe()` 내부에서 만료 체크 후 처리:

```java
    // 기존 필드 아래에 추가
    private final MemberSuspendHistoryRepository memberSuspendHistoryRepository;

    // getMe() 메서드 수정
    @Transactional
    public MemberMeResponse getMe(UUID memberUuid) {
        Member member = findActiveMember(memberUuid);
        touchLastSeenIfStale(member);
        checkAndAutoUnsuspendIfExpired(member);
        return MemberMeResponse.from(member);
    }

    // 내부 헬퍼 추가
    private void checkAndAutoUnsuspendIfExpired(Member member) {
        if (member.getStatus() == MemberStatus.SUSPENDED
                && member.getSuspendUntil() != null
                && member.getSuspendUntil().isBefore(LocalDateTime.now())) {
            member.setStatus(MemberStatus.ACTIVE);
            member.setSuspendUntil(null);
            memberSuspendHistoryRepository.save(MemberSuspendHistory.ofUnsuspend(member.getMemberUuid()));
            log.info("Member auto-unsuspended on getMe: uuid={}", member.getMemberUuid());
        }
    }
```

import 추가 필요:
```java
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.MemberSuspendHistory;
import com.passql.member.repository.MemberSuspendHistoryRepository;
```

- [ ] **Step 2: 빌드 확인**

```bash
cd server
./gradlew :PQL-Domain-Member:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/main/java/com/passql/member/service/MemberService.java
git commit -m "feat(member): MemberService.getMe()에 제재 만료 자동 해제 연동"
```

---

## Task 10: `AdminMemberController` 생성

**Files:**
- Create: `PQL-Web/src/main/java/com/passql/web/controller/admin/AdminMemberController.java`

- [ ] **Step 1: 컨트롤러 생성**

```java
package com.passql.web.controller.admin;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.dto.MemberSearchCondition;
import com.passql.member.dto.MemberSuspendRequest;
import com.passql.member.service.MemberAdminService;
import com.passql.submission.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberAdminService memberAdminService;
    private final SubmissionService submissionService;

    @GetMapping
    public String list(MemberSearchCondition condition, Model model,
                       @RequestParam(defaultValue = "0") int page,
                       @RequestParam(defaultValue = "20") int size) {
        int clampedSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, clampedSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        model.addAttribute("members", memberAdminService.searchMembers(condition, pageable));
        model.addAttribute("condition", condition);
        model.addAttribute("statuses", MemberStatus.values());
        model.addAttribute("roles", MemberRole.values());
        model.addAttribute("pageTitle", "회원 관리");
        model.addAttribute("currentMenu", "members");
        return "admin/members/list";
    }

    @GetMapping("/{memberUuid}")
    public String detail(@PathVariable UUID memberUuid, Model model) {
        model.addAttribute("member", memberAdminService.getMemberDetail(memberUuid));
        model.addAttribute("submissions", submissionService.getSubmissionsByMember(memberUuid));
        model.addAttribute("pageTitle", "회원 상세");
        model.addAttribute("currentMenu", "members");
        return "admin/members/detail";
    }

    @PostMapping("/{memberUuid}/suspend")
    @ResponseBody
    public ResponseEntity<Void> suspend(@PathVariable UUID memberUuid,
                                        @RequestBody MemberSuspendRequest request) {
        memberAdminService.suspendMember(memberUuid, request.getReason(), request.getSuspendUntil());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{memberUuid}/unsuspend")
    @ResponseBody
    public ResponseEntity<Void> unsuspend(@PathVariable UUID memberUuid) {
        memberAdminService.unsuspendMember(memberUuid);
        return ResponseEntity.ok().build();
    }
}
```

- [ ] **Step 2: `SubmissionService`에 `getSubmissionsByMember` 메서드 추가**

`PQL-Domain-Submission/src/main/java/com/passql/submission/service/SubmissionService.java`에 추가:

```java
    @Transactional(readOnly = true)
    public List<Submission> getSubmissionsByMember(UUID memberUuid) {
        return submissionRepository.findByMemberUuidOrderBySubmittedAtDesc(memberUuid);
    }
```

import 추가:
```java
import com.passql.submission.entity.Submission;
import java.util.List;
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server
./gradlew :PQL-Web:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminMemberController.java
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/SubmissionService.java
git commit -m "feat(web): AdminMemberController 구현 및 SubmissionService.getSubmissionsByMember 추가"
```

---

## Task 11: `MemberSuspendScheduler` 생성

**Files:**
- Create: `PQL-Web/src/main/java/com/passql/web/scheduler/MemberSuspendScheduler.java`

- [ ] **Step 1: 스케줄러 생성**

```java
package com.passql.web.scheduler;

import com.passql.member.service.MemberAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberSuspendScheduler {

    private final MemberAdminService memberAdminService;

    /** 1분마다 만료된 제재 자동 해제 */
    @Scheduled(fixedDelay = 60_000)
    public void autoUnsuspendExpired() {
        memberAdminService.autoUnsuspendExpired();
    }
}
```

- [ ] **Step 2: `@EnableScheduling` 확인 — PassqlApplication에 있는지 확인**

```bash
grep -r "EnableScheduling" server/PQL-Web/src/main/java/
```

없으면 `PassqlApplication.java`에 `@EnableScheduling` 추가:

```java
@SpringBootApplication
@EnableScheduling  // 추가
public class PassqlApplication { ... }
```

- [ ] **Step 3: 빌드 확인**

```bash
cd server
./gradlew :PQL-Web:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/scheduler/MemberSuspendScheduler.java
git add server/PQL-Web/src/main/java/com/passql/web/PassqlApplication.java
git commit -m "feat(web): MemberSuspendScheduler 구현 (1분 주기 제재 자동 해제)"
```

---

## Task 12: 어드민 사이드바에 "회원 관리" 메뉴 추가

**Files:**
- Modify: `PQL-Web/src/main/resources/templates/admin/layout.html`

- [ ] **Step 1: 사이드바 메뉴 추가**

`layout.html`에서 `"문제 관리"` 메뉴 항목 바로 위에 아래 항목을 추가한다:

```html
                <li>
                    <a th:href="@{/admin/members}" th:classappend="${currentMenu == 'members'} ? 'active'">
                        <i data-lucide="users" class="size-5"></i>
                        회원 관리
                    </a>
                </li>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/layout.html
git commit -m "feat(web): 어드민 사이드바에 회원 관리 메뉴 추가"
```

---

## Task 13: 회원 목록 템플릿 생성

**Files:**
- Create: `PQL-Web/src/main/resources/templates/admin/members/list.html`

- [ ] **Step 1: 디렉토리 생성 및 템플릿 작성**

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{admin/layout}">

<th:block layout:fragment="title">회원 관리</th:block>

<th:block layout:fragment="content">

    <!-- 필터 바 -->
    <div class="card bg-base-100 shadow mb-4">
        <div class="card-body p-4">
            <form th:action="@{/admin/members}" method="get" class="flex flex-wrap gap-3 items-end">

                <!-- 닉네임 검색 -->
                <div class="form-control">
                    <label class="label label-text text-xs">닉네임</label>
                    <input type="text" name="nickname" class="input input-sm input-bordered w-36"
                           th:value="${condition.nickname}" placeholder="닉네임 검색"/>
                </div>

                <!-- 상태 필터 -->
                <div class="form-control">
                    <label class="label label-text text-xs">상태</label>
                    <select name="status" class="select select-sm select-bordered w-36">
                        <option value="">전체</option>
                        <option th:each="s : ${statuses}"
                                th:value="${s.name()}"
                                th:text="${s.name()}"
                                th:selected="${condition.status != null and condition.status.name() == s.name()}">
                            ACTIVE
                        </option>
                    </select>
                </div>

                <!-- 역할 필터 -->
                <div class="form-control">
                    <label class="label label-text text-xs">역할</label>
                    <select name="role" class="select select-sm select-bordered w-36">
                        <option value="">전체</option>
                        <option th:each="r : ${roles}"
                                th:value="${r.name()}"
                                th:text="${r.name()}"
                                th:selected="${condition.role != null and condition.role.name() == r.name()}">
                            USER
                        </option>
                    </select>
                </div>

                <!-- 가입일 범위 -->
                <div class="form-control">
                    <label class="label label-text text-xs">가입일 시작</label>
                    <input type="date" name="joinedFrom" class="input input-sm input-bordered w-36"
                           th:value="${condition.joinedFrom}"/>
                </div>
                <div class="form-control">
                    <label class="label label-text text-xs">가입일 종료</label>
                    <input type="date" name="joinedTo" class="input input-sm input-bordered w-36"
                           th:value="${condition.joinedTo}"/>
                </div>

                <!-- 마지막 접속일 범위 -->
                <div class="form-control">
                    <label class="label label-text text-xs">마지막 접속 시작</label>
                    <input type="date" name="lastSeenFrom" class="input input-sm input-bordered w-36"
                           th:value="${condition.lastSeenFrom}"/>
                </div>
                <div class="form-control">
                    <label class="label label-text text-xs">마지막 접속 종료</label>
                    <input type="date" name="lastSeenTo" class="input input-sm input-bordered w-36"
                           th:value="${condition.lastSeenTo}"/>
                </div>

                <!-- 테스트 계정 포함 체크박스 -->
                <div class="form-control justify-end">
                    <label class="label cursor-pointer gap-2">
                        <input type="checkbox" name="includeTest" value="true" class="checkbox checkbox-sm"
                               th:checked="${condition.includeTest}"/>
                        <span class="label-text text-xs">테스트 계정 포함</span>
                    </label>
                </div>

                <button type="submit" class="btn btn-sm btn-primary">
                    <i data-lucide="search" class="size-4"></i>검색
                </button>
                <a th:href="@{/admin/members}" class="btn btn-sm btn-ghost">초기화</a>
            </form>
        </div>
    </div>

    <!-- 회원 목록 테이블 -->
    <div class="card bg-base-100 shadow">
        <div class="card-body p-0">
            <div class="overflow-x-auto">
                <table class="table table-sm">
                    <thead>
                    <tr>
                        <th>닉네임</th>
                        <th class="w-28">상태</th>
                        <th class="w-28">역할</th>
                        <th class="w-24">인증</th>
                        <th class="w-32">가입일</th>
                        <th class="w-32">마지막 접속</th>
                        <th class="w-16">상세</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr th:each="m : ${members}" th:if="${members != null and !members.isEmpty()}">
                        <td class="font-medium text-sm" th:text="${m.nickname}">닉네임</td>
                        <td>
                            <span class="badge badge-sm"
                                  th:classappend="${m.status.name() == 'ACTIVE'} ? 'badge-success' :
                                                  ${m.status.name() == 'SUSPENDED'} ? 'badge-error' :
                                                  ${m.status.name() == 'WITHDRAWN'} ? 'badge-ghost' : 'badge-warning'"
                                  th:text="${m.status.name()}">ACTIVE</span>
                        </td>
                        <td>
                            <span class="badge badge-outline badge-sm" th:text="${m.role.name()}">USER</span>
                        </td>
                        <td class="text-xs" th:text="${m.authProvider.name()}">ANONYMOUS</td>
                        <td class="text-xs"
                            th:text="${m.createdAt != null ? #temporals.format(m.createdAt, 'yyyy-MM-dd') : '-'}">
                            2026-01-01
                        </td>
                        <td class="text-xs"
                            th:text="${m.lastSeenAt != null ? #temporals.format(m.lastSeenAt, 'yyyy-MM-dd') : '-'}">
                            2026-04-01
                        </td>
                        <td>
                            <a th:href="@{/admin/members/{uuid}(uuid=${m.memberUuid})}"
                               class="btn btn-xs btn-ghost" title="상세">
                                <i data-lucide="eye" class="size-3"></i>
                            </a>
                        </td>
                    </tr>

                    <!-- Empty state -->
                    <tr th:if="${members == null or members.isEmpty()}">
                        <td colspan="7" class="text-center text-base-content/50 py-12">
                            <i data-lucide="users" class="size-10 mx-auto mb-2 opacity-40"></i>
                            <p>회원이 없습니다.</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <!-- 페이지네이션 -->
            <div class="flex justify-center p-4" th:if="${members != null and members.totalPages > 1}">
                <div class="join">
                    <a th:href="@{/admin/members(page=${members.number - 1}, nickname=${condition.nickname}, status=${condition.status}, role=${condition.role})}"
                       class="join-item btn btn-sm"
                       th:classappend="${members.first} ? 'btn-disabled'">«</a>
                    <button class="join-item btn btn-sm btn-active"
                            th:text="${members.number + 1} + ' / ' + ${members.totalPages}">1 / 10</button>
                    <a th:href="@{/admin/members(page=${members.number + 1}, nickname=${condition.nickname}, status=${condition.status}, role=${condition.role})}"
                       class="join-item btn btn-sm"
                       th:classappend="${members.last} ? 'btn-disabled'">»</a>
                </div>
            </div>
        </div>
    </div>

</th:block>

<th:block layout:fragment="js">
    <script>lucide.createIcons();</script>
</th:block>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/members/list.html
git commit -m "feat(web): 어드민 회원 목록 페이지 템플릿 추가"
```

---

## Task 14: 회원 상세 템플릿 생성

**Files:**
- Create: `PQL-Web/src/main/resources/templates/admin/members/detail.html`

- [ ] **Step 1: 상세 템플릿 작성**

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{admin/layout}">

<th:block layout:fragment="title">회원 상세</th:block>

<th:block layout:fragment="content">

    <!-- 뒤로가기 -->
    <div class="mb-4">
        <a th:href="@{/admin/members}" class="btn btn-sm btn-ghost">
            <i data-lucide="arrow-left" class="size-4"></i>목록으로
        </a>
    </div>

    <!-- 기본 정보 -->
    <div class="card bg-base-100 shadow mb-4">
        <div class="card-body">
            <h2 class="card-title text-base">기본 정보</h2>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-base-content/60">닉네임</span>
                    <p class="font-semibold" th:text="${member.nickname}">닉네임</p>
                </div>
                <div>
                    <span class="text-base-content/60">UUID</span>
                    <p class="font-mono text-xs" th:text="${member.memberUuid}">uuid</p>
                </div>
                <div>
                    <span class="text-base-content/60">상태</span>
                    <p>
                        <span class="badge badge-sm"
                              th:classappend="${member.status.name() == 'ACTIVE'} ? 'badge-success' :
                                              ${member.status.name() == 'SUSPENDED'} ? 'badge-error' :
                                              ${member.status.name() == 'WITHDRAWN'} ? 'badge-ghost' : 'badge-warning'"
                              th:text="${member.status.name()}">ACTIVE</span>
                    </p>
                </div>
                <div>
                    <span class="text-base-content/60">역할</span>
                    <p><span class="badge badge-outline badge-sm" th:text="${member.role.name()}">USER</span></p>
                </div>
                <div>
                    <span class="text-base-content/60">인증 방식</span>
                    <p th:text="${member.authProvider.name()}">ANONYMOUS</p>
                </div>
                <div>
                    <span class="text-base-content/60">이메일</span>
                    <p th:text="${member.email != null ? member.email : '-'}">-</p>
                </div>
                <div>
                    <span class="text-base-content/60">가입일</span>
                    <p th:text="${member.createdAt != null ? #temporals.format(member.createdAt, 'yyyy-MM-dd HH:mm') : '-'}">-</p>
                </div>
                <div>
                    <span class="text-base-content/60">마지막 접속</span>
                    <p th:text="${member.lastSeenAt != null ? #temporals.format(member.lastSeenAt, 'yyyy-MM-dd HH:mm') : '-'}">-</p>
                </div>
                <div>
                    <span class="text-base-content/60">마지막 IP</span>
                    <p class="font-mono text-xs" th:text="${member.lastLoginIp != null ? member.lastLoginIp : '-'}">-</p>
                </div>
                <div>
                    <span class="text-base-content/60">테스트 계정</span>
                    <p th:text="${member.isTestAccount ? '예' : '아니오'}">아니오</p>
                </div>
                <div th:if="${member.suspendUntil != null}">
                    <span class="text-base-content/60">제재 만료</span>
                    <p class="text-error" th:text="${#temporals.format(member.suspendUntil, 'yyyy-MM-dd HH:mm')}">-</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 제재 액션 -->
    <div class="card bg-base-100 shadow mb-4" th:if="${member.status.name() != 'WITHDRAWN'}">
        <div class="card-body">
            <h2 class="card-title text-base">제재 관리</h2>
            <div class="flex gap-2">
                <!-- 제재 중이면 해제 버튼 -->
                <button th:if="${member.status.name() == 'SUSPENDED'}"
                        class="btn btn-sm btn-success"
                        onclick="unsuspendMember()">
                    <i data-lucide="shield-check" class="size-4"></i>제재 해제
                </button>
                <!-- 제재 중이 아니면 제재 버튼 -->
                <button th:if="${member.status.name() != 'SUSPENDED'}"
                        class="btn btn-sm btn-error"
                        onclick="document.getElementById('suspendModal').showModal()">
                    <i data-lucide="shield-ban" class="size-4"></i>제재
                </button>
            </div>
        </div>
    </div>

    <!-- 제재 모달 -->
    <dialog id="suspendModal" class="modal">
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">회원 제재</h3>
            <div class="form-control mb-4">
                <label class="label label-text">제재 사유</label>
                <textarea id="suspendReason" class="textarea textarea-bordered w-full" rows="3"
                          placeholder="제재 사유를 입력하세요"></textarea>
            </div>
            <div class="form-control mb-4">
                <label class="label label-text">제재 만료 일시</label>
                <input type="datetime-local" id="suspendUntil" class="input input-bordered w-full"/>
            </div>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn btn-ghost">취소</button>
                </form>
                <button class="btn btn-error" onclick="suspendMember()">제재 적용</button>
            </div>
        </div>
    </dialog>

    <!-- 제재 이력 -->
    <div class="card bg-base-100 shadow mb-4">
        <div class="card-body">
            <h2 class="card-title text-base">제재 이력</h2>
            <div class="overflow-x-auto">
                <table class="table table-sm">
                    <thead>
                    <tr>
                        <th>일시</th>
                        <th>액션</th>
                        <th>사유</th>
                        <th>만료일</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr th:each="h : ${member.suspendHistories}" th:if="${!member.suspendHistories.isEmpty()}">
                        <td class="text-xs" th:text="${#temporals.format(h.actedAt, 'yyyy-MM-dd HH:mm')}">-</td>
                        <td>
                            <span class="badge badge-sm"
                                  th:classappend="${h.action.name() == 'SUSPENDED'} ? 'badge-error' : 'badge-success'"
                                  th:text="${h.action.name()}">SUSPENDED</span>
                        </td>
                        <td class="text-xs" th:text="${h.reason != null ? h.reason : '-'}">-</td>
                        <td class="text-xs"
                            th:text="${h.suspendUntil != null ? #temporals.format(h.suspendUntil, 'yyyy-MM-dd HH:mm') : '-'}">-</td>
                    </tr>
                    <tr th:if="${member.suspendHistories.isEmpty()}">
                        <td colspan="4" class="text-center text-base-content/50 py-6">제재 이력이 없습니다.</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 제출 이력 -->
    <div class="card bg-base-100 shadow mb-4">
        <div class="card-body">
            <h2 class="card-title text-base">제출 이력</h2>
            <div class="stats stats-horizontal shadow mb-4" th:if="${submissions != null}">
                <div class="stat">
                    <div class="stat-title">총 제출</div>
                    <div class="stat-value text-lg" th:text="${submissions.size()}">0</div>
                </div>
                <div class="stat">
                    <div class="stat-title">정답</div>
                    <div class="stat-value text-lg text-success"
                         th:text="${#lists.size(submissions.?[isCorrect == true])}">0</div>
                </div>
                <div class="stat">
                    <div class="stat-title">정답률</div>
                    <div class="stat-value text-lg"
                         th:text="${submissions.size() > 0 ? (#numbers.formatDecimal(#lists.size(submissions.?[isCorrect == true]) * 100.0 / submissions.size(), 1, 1) + '%') : '-'}">-</div>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="table table-sm">
                    <thead>
                    <tr>
                        <th>문제 UUID</th>
                        <th class="w-20">결과</th>
                        <th class="w-36">제출일</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr th:each="s : ${submissions}" th:if="${submissions != null and !submissions.isEmpty()}">
                        <td class="font-mono text-xs" th:text="${s.questionUuid}">uuid</td>
                        <td>
                            <span class="badge badge-sm"
                                  th:classappend="${s.isCorrect} ? 'badge-success' : 'badge-error'"
                                  th:text="${s.isCorrect ? '정답' : '오답'}">정답</span>
                        </td>
                        <td class="text-xs"
                            th:text="${s.submittedAt != null ? #temporals.format(s.submittedAt, 'yyyy-MM-dd HH:mm') : '-'}">-</td>
                    </tr>
                    <tr th:if="${submissions == null or submissions.isEmpty()}">
                        <td colspan="3" class="text-center text-base-content/50 py-6">제출 이력이 없습니다.</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</th:block>

<th:block layout:fragment="js">
    <script>
        lucide.createIcons();

        const memberUuid = '[[${member.memberUuid}]]';

        function suspendMember() {
            const reason = document.getElementById('suspendReason').value;
            const suspendUntil = document.getElementById('suspendUntil').value;
            if (!suspendUntil) {
                alert('제재 만료 일시를 입력해주세요.');
                return;
            }
            fetch(`/admin/members/${memberUuid}/suspend`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    reason: reason,
                    suspendUntil: suspendUntil + ':00'
                })
            }).then(res => {
                if (res.ok) location.reload();
                else alert('제재 처리 중 오류가 발생했습니다.');
            });
        }

        function unsuspendMember() {
            if (!confirm('제재를 해제하시겠습니까?')) return;
            fetch(`/admin/members/${memberUuid}/unsuspend`, {
                method: 'POST'
            }).then(res => {
                if (res.ok) location.reload();
                else alert('해제 처리 중 오류가 발생했습니다.');
            });
        }
    </script>
</th:block>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/members/detail.html
git commit -m "feat(web): 어드민 회원 상세 페이지 템플릿 추가 (제재/해제 모달 포함)"
```

---

## Task 15: 통합 테스트 작성

**Files:**
- Create: `PQL-Domain-Member/src/test/java/com/passql/member/service/MemberAdminServiceTest.java`

- [ ] **Step 1: 테스트 디렉토리 생성 및 테스트 파일 작성**

```java
package com.passql.member.service;

import com.passql.member.constant.MemberStatus;
import com.passql.member.dto.MemberAdminDetailResponse;
import com.passql.member.dto.MemberAdminListResponse;
import com.passql.member.dto.MemberSearchCondition;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class MemberAdminServiceTest {

    @Autowired
    MemberAdminService memberAdminService;

    @Autowired
    MemberRepository memberRepository;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("MemberAdminService 테스트 시작");

        lineLog(null);
        searchMembers_전체_조회_테스트();
        lineLog(null);

        lineLog(null);
        searchMembers_닉네임_필터_테스트();
        lineLog(null);

        lineLog(null);
        suspendAndUnsuspend_제재_및_해제_테스트();
        lineLog(null);

        lineLog("MemberAdminService 테스트 종료");
    }

    public void searchMembers_전체_조회_테스트() {
        lineLog("회원 전체 조회 테스트");

        MemberSearchCondition cond = new MemberSearchCondition();
        cond.setIncludeTest(true);
        Page<MemberAdminListResponse> result = memberAdminService.searchMembers(
            cond, PageRequest.of(0, 20));

        superLog("전체 회원 수: " + result.getTotalElements());
        lineLog("조회 성공 — 총 " + result.getTotalElements() + "명");
    }

    public void searchMembers_닉네임_필터_테스트() {
        lineLog("닉네임 필터 테스트");

        MemberSearchCondition cond = new MemberSearchCondition();
        cond.setNickname("테스트");
        Page<MemberAdminListResponse> result = memberAdminService.searchMembers(
            cond, PageRequest.of(0, 10));

        superLog("닉네임 '테스트' 포함 회원 수: " + result.getTotalElements());
        lineLog("닉네임 필터 테스트 완료");
    }

    @Transactional
    public void suspendAndUnsuspend_제재_및_해제_테스트() {
        lineLog("제재 및 해제 테스트");

        // 첫 번째 회원 조회
        Member member = memberRepository.findAll().stream()
            .filter(m -> !m.isDeleted())
            .findFirst()
            .orElse(null);

        if (member == null) {
            lineLog("테스트할 회원이 없습니다. SKIP");
            return;
        }

        UUID uuid = member.getMemberUuid();
        lineLog("대상 회원 UUID: " + uuid);

        // 제재
        LocalDateTime suspendUntil = LocalDateTime.now().plusDays(1);
        memberAdminService.suspendMember(uuid, "테스트 제재", suspendUntil);
        superLog("제재 후 상태: " + memberRepository.findByMemberUuidAndIsDeletedFalse(uuid)
            .map(m -> m.getStatus().name()).orElse("NOT FOUND"));

        // 상세 조회로 이력 확인
        MemberAdminDetailResponse detail = memberAdminService.getMemberDetail(uuid);
        superLog("제재 이력 수: " + detail.suspendHistories().size());

        // 해제
        memberAdminService.unsuspendMember(uuid);
        superLog("해제 후 상태: " + memberRepository.findByMemberUuidAndIsDeletedFalse(uuid)
            .map(m -> m.getStatus().name()).orElse("NOT FOUND"));

        lineLog("제재/해제 테스트 완료");
    }
}
```

- [ ] **Step 2: 테스트 실행**

```bash
cd server
./gradlew :PQL-Domain-Member:test --tests "com.passql.member.service.MemberAdminServiceTest" --info
```

Expected: 테스트 통과 및 로그 출력 확인

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Member/src/test/java/com/passql/member/service/MemberAdminServiceTest.java
git commit -m "test(member): MemberAdminService 통합 테스트 추가"
```

---

## Task 16: 전체 빌드 및 동작 확인

- [ ] **Step 1: 전체 빌드**

```bash
cd server
./gradlew build -x test
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: 애플리케이션 기동 및 수동 확인**

```bash
cd server
./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```

브라우저에서:
1. `http://localhost:8080/admin/members` — 회원 목록 확인
2. 필터 작동 확인 (닉네임 검색, 상태 필터)
3. 특정 회원 클릭 → 상세 페이지 확인
4. 제재 버튼 → 모달 → 제재 적용 → 상태 변경 확인
5. 제재 해제 버튼 → 해제 확인
6. 사이드바 "회원 관리" 메뉴 활성화 확인

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat(web): 어드민 회원 관리 기능 전체 구현 완료"
```
