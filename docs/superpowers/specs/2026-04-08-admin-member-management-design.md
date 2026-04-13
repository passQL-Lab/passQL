# 어드민 회원 관리 기능 설계

**작성일:** 2026-04-08  
**관련 이슈:** `.issue/20260408_#001_어드민_회원_관리_기능_구현.md`

---

## 1. 개요

관리자 페이지에 회원 관리 기능을 추가한다. 회원 목록 조회, 상태별 필터링, 기간 제재(사유+기간), 자동 해제, 제재 이력 조회, 제출/챌린지 이력 조회를 포함한다.

---

## 2. DB 스키마 변경

### 2-1. `member` 테이블 컬럼 추가

```sql
ALTER TABLE member ADD COLUMN suspend_until DATETIME(6) NULL;
```

- 현재 활성 제재의 만료 시각 저장
- NULL이면 제재 없음 (또는 영구 제재)
- 스케줄러가 이 컬럼만 보고 배치 해제 처리

### 2-2. `member_suspend_history` 테이블 신규 생성

```sql
CREATE TABLE member_suspend_history (
    member_suspend_history_uuid  CHAR(36)     NOT NULL,
    member_uuid                  CHAR(36)     NOT NULL,
    action                       VARCHAR(20)  NOT NULL,  -- SUSPENDED / UNSUSPENDED
    reason                       VARCHAR(500) NULL,
    suspend_until                DATETIME(6)  NULL,
    acted_at                     DATETIME(6)  NOT NULL,
    created_at                   DATETIME(6)  NULL,
    updated_at                   DATETIME(6)  NULL,
    PRIMARY KEY (member_suspend_history_uuid),
    INDEX idx_suspend_history_member (member_uuid)
);
```

**Flyway 파일:** `V0_0_24__add_member_suspend.sql`

---

## 3. 모듈 배치

| 레이어 | 파일 | 모듈 |
|--------|------|------|
| Entity | `MemberSuspendHistory` | `PQL-Domain-Member` |
| Enum | `SuspendAction` (SUSPENDED / UNSUSPENDED) | `PQL-Domain-Member` |
| Repository | `MemberSuspendHistoryRepository` | `PQL-Domain-Member` |
| Repository | `MemberRepository` 쿼리 메서드 추가 | `PQL-Domain-Member` |
| Service | `MemberAdminService` (조회/제재/해제 로직) | `PQL-Domain-Member` |
| Scheduler | `MemberSuspendScheduler` (@Scheduled 배치 해제) | `PQL-Web` |
| DTO | `MemberAdminListResponse`, `MemberAdminDetailResponse`, `MemberSuspendRequest` 등 | `PQL-Domain-Member` |
| Controller | `AdminMemberController` | `PQL-Web` |
| Template | `admin/members/list.html` | `PQL-Web` |
| Template | `admin/members/detail.html` | `PQL-Web` |
| Migration | `V0_0_24__add_member_suspend.sql` | `PQL-Web` |

---

## 4. 엔티티 설계

### `MemberSuspendHistory`

- 패키지: `com.passql.member.entity`
- 상속: `BaseEntity` (auditing only, soft delete 불필요)
- PK: `UUID memberSuspendHistoryUuid` (`@GeneratedValue(strategy = GenerationType.UUID)`)
- 필드:
  - `UUID memberUuid` — member FK (단순 UUID 저장, 조인 없음)
  - `SuspendAction action` — `@Enumerated(EnumType.STRING)`
  - `String reason` — 제재 사유 (nullable)
  - `LocalDateTime suspendUntil` — 만료 시각 (nullable, UNSUSPENDED일 때는 null)
  - `LocalDateTime actedAt` — 액션 발생 시각

### `SuspendAction` enum

```java
public enum SuspendAction {
    SUSPENDED,
    UNSUSPENDED
}
```

---

## 5. 서비스 설계 (`MemberAdminService`)

### 주요 메서드

```
searchMembers(MemberSearchCondition, Pageable) → Page<MemberAdminListResponse>
getMemberDetail(UUID memberUuid)               → MemberAdminDetailResponse
suspendMember(UUID memberUuid, String reason, LocalDateTime suspendUntil)
unsuspendMember(UUID memberUuid)
autoUnsuspendExpired()                         → @Scheduled(fixedDelay = 60_000)
```

### 트랜잭션 전략

- 클래스 레벨: `@Transactional(readOnly = true)`
- 쓰기 메서드: `@Transactional` 개별 오버라이드

### 제재 로직

1. `member.status` → `SUSPENDED`로 변경
2. `member.suspendUntil` 설정
3. `MemberSuspendHistory` 레코드 저장 (action=SUSPENDED)

### 해제 로직 (수동/자동 공통)

1. `member.status` → `ACTIVE`로 변경
2. `member.suspendUntil` → null
3. `MemberSuspendHistory` 레코드 저장 (action=UNSUSPENDED, reason=null)

### 자동 해제 스케줄러 (`PQL-Web` — `MemberSuspendScheduler`)

```java
@Scheduled(fixedDelay = 60_000)
public void autoUnsuspendExpired() {
    // MemberAdminService.autoUnsuspendExpired() 위임 호출
    // suspend_until < now() AND status = SUSPENDED 인 회원 배치 조회 후 해제
}
```

스케줄러 자체는 `PQL-Web`에 두고, 비즈니스 로직(조회·상태변경·이력저장)은 `MemberAdminService`에 위임한다.

### 접속 시 해제 (`MemberService.getMe` 연동)

- `getMe()` 호출 시 `member.suspendUntil != null && suspendUntil.isBefore(now())` 체크
- 만료됐으면 즉시 해제 처리

---

## 6. Repository 추가 쿼리

### `MemberRepository` 추가

```java
// 검색 필터용 (동적 쿼리 — JPA Specification 사용, QueryDSL 미도입)
Page<Member> findAll(Specification<Member> spec, Pageable pageable);

// 스케줄러용
List<Member> findAllByStatusAndSuspendUntilBefore(MemberStatus status, LocalDateTime now);
```

### `MemberSuspendHistoryRepository` 신규

```java
List<MemberSuspendHistory> findAllByMemberUuidOrderByActedAtDesc(UUID memberUuid);
```

---

## 7. 검색 조건 (`MemberSearchCondition`)

```
String nickname          — 닉네임 부분 일치 (LIKE)
MemberStatus status      — 상태 필터 (nullable = 전체)
MemberRole role          — 역할 필터 (nullable = 전체)
LocalDate joinedFrom     — 가입일 시작
LocalDate joinedTo       — 가입일 종료
LocalDate lastSeenFrom   — 마지막 접속일 시작
LocalDate lastSeenTo     — 마지막 접속일 종료
Boolean includeTest      — 테스트 계정 포함 여부 (기본 false)
```

---

## 8. 화면 구성

### 8-1. 목록 페이지 `/admin/members`

- **필터 영역**: 닉네임 검색, 상태 드롭다운, 역할 드롭다운, 가입일 범위, 마지막 접속일 범위, `[✓] 테스트 계정 포함` 체크박스
- **테이블 컬럼**: 닉네임 / 상태 뱃지 / 역할 / 인증방식 / 가입일 / 마지막 접속 / 상세 버튼
- **페이지네이션**: 20건씩
- **currentMenu**: `"members"`

### 8-2. 상세 페이지 `/admin/members/{memberUuid}`

**섹션 1 — 기본 정보**
- 닉네임, UUID, 상태 뱃지, 역할, 인증 방식, 가입일, 마지막 접속일, 마지막 로그인 IP

**섹션 2 — 액션**
- 상태가 SUSPENDED일 때: "제재 해제" 버튼 (POST `/admin/members/{uuid}/unsuspend`)
- 상태가 ACTIVE/DORMANT일 때: "제재" 버튼 → 모달 (사유 텍스트, 제재 기간 날짜 선택, 확인)
- WITHDRAWN 회원은 액션 버튼 비활성화

**섹션 3 — 제재 이력**
- 테이블: 일시 / 액션(뱃지) / 사유 / 만료일

**섹션 4 — 제출 이력**
- 요약: 총 제출 수, 정답 수, 정답률
- 최근 제출 목록: 문제명 / 결과 / 제출일

**섹션 5 — 일일 챌린지 참여 이력**
- 목록: 챌린지 날짜 / 문제명 / 결과

---

## 9. 어드민 사이드바 추가

`admin/layout.html` 사이드바에 "회원 관리" 메뉴 항목 추가:
- URL: `/admin/members`
- currentMenu key: `members`
- 아이콘: `users` (Lucide)

---

## 10. 자동 해제 메커니즘 요약

| 경로 | 조건 | 처리 |
|------|------|------|
| 스케줄러 | `suspend_until < now()` AND `status = SUSPENDED` | 배치 해제 (1분 주기) |
| 접속 시 | `getMe()` 호출 시 `suspendUntil` 만료 확인 | 즉시 해제 |

---

## 11. 제외 항목 (향후 추가)

- 역할 변경 기능 (로그인/권한 체계 구현 후 추가)
- 회원 강제 탈퇴 기능
- IP 기반 차단
