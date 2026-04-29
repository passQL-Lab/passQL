# Daily Set + Leaderboard 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 1문제 DailyChallenge를 10문제 데일리 세트로 완전 대체하고, 완료 후 오늘의 리더보드를 확인할 수 있게 한다.

**Architecture:** `daily_challenge` 테이블에 `sort_order` 컬럼을 추가해 날짜당 10문제를 관리하고, `daily_set_submission` 신규 테이블로 완료자 집계를 분리한다. 프론트엔드는 기존 `PracticeSet` 플로우를 재활용한 `DailySet` 페이지를 신설하고, 결과 화면에서 리더보드를 바로 확인할 수 있도록 한다.

**Tech Stack:** Spring Boot (JPA, Flyway), React (TanStack Query, Zustand, React Router), TypeScript, Tailwind CSS / daisyUI (관리자)

---

## 파일 맵

### 서버 — 변경
- `PQL-Domain-Question/entity/DailyChallenge.java` — `sortOrder` 컬럼 추가, 유니크 제약 변경
- `PQL-Domain-Question/repository/DailyChallengeRepository.java` — `findByChallengeDateOrderBySortOrderAsc` 추가, `deleteByQuestionUuid` 유지
- `PQL-Domain-Question/dto/DailyChallengeItem.java` — `sortOrder` 필드 추가
- `PQL-Domain-Question/dto/DailyChallengeAssignRequest.java` — `List<UUID> questionUuids`로 변경
- `PQL-Domain-Question/service/AdminDailyChallengeService.java` — `assign` → 10문제 일괄, `confirmFallback` → 10문제 선정
- `PQL-Application/service/HomeService.java` — `getToday()` → `alreadyCompletedDailySet` 기준으로 변경
- `PQL-Common/exception/constant/ErrorCode.java` — `DAILY_SET_ALREADY_COMPLETED` 추가
- `PQL-Web/controller/admin/AdminDailyChallengeController.java` — `assign` API 시그니처 변경
- `PQL-Web/resources/templates/admin/daily-challenges.html` — 날짜 클릭 시 10문제 자동 배정 UI로 변경
- `PQL-Web/resources/db/migration/V0_0_184__daily_set.sql` — 마이그레이션

### 서버 — 신규
- `PQL-Domain-Question/entity/DailySetSubmission.java` — 세트 완료 집계 엔티티
- `PQL-Domain-Question/repository/DailySetSubmissionRepository.java`
- `PQL-Domain-Question/dto/DailySetTodayResponse.java` — `GET /daily-set/today` 응답
- `PQL-Domain-Question/dto/DailySetCompleteRequest.java` — `POST /daily-set/complete` 요청
- `PQL-Domain-Question/dto/DailySetCompleteResponse.java` — 완료 후 순위 응답
- `PQL-Domain-Question/dto/LeaderboardEntry.java`
- `PQL-Domain-Question/dto/LeaderboardResponse.java`
- `PQL-Application/service/DailySetService.java` — today/complete/leaderboard 비즈니스 로직
- `PQL-Web/controller/DailySetController.java` — REST API 엔드포인트

### 클라이언트 — 변경
- `client/src/App.tsx` — 라우트 추가 (`/daily-set`, `/daily-set/result`, `/leaderboard`), `/daily-challenge` redirect
- `client/src/pages/Home.tsx` — 데일리 세트 카드로 교체
- `client/src/hooks/useHome.ts` — `useTodayQuestion` → `useDailySet`으로 대체
- `client/src/types/api.ts` — `DailySetTodayResponse`, `DailySetCompleteResponse`, `LeaderboardResponse` 타입 추가
- `client/src/api/questions.ts` — `fetchTodayQuestion` 삭제 대신 `fetchDailySet`, `completeDailySet`, `fetchLeaderboard` 추가

### 클라이언트 — 신규
- `client/src/stores/dailySetStore.ts`
- `client/src/pages/DailySet.tsx`
- `client/src/pages/DailySetResult.tsx`
- `client/src/pages/Leaderboard.tsx`
- `client/src/api/dailySet.ts`

---

## Task 1: DB 마이그레이션 + 서버 엔티티

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_184__daily_set.sql`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailyChallenge.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailySetSubmission.java`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- V0_0_184__daily_set.sql

-- daily_challenge: 날짜 단독 유니크 제거 → (date, sort_order) 복합 유니크
ALTER TABLE daily_challenge
  DROP INDEX IF EXISTS uk_daily_challenge_date,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0 AFTER challenge_date,
  ADD CONSTRAINT IF NOT EXISTS uk_daily_challenge_date_order UNIQUE (challenge_date, sort_order);

-- daily_set_submission: 세트 완료 집계 테이블
CREATE TABLE IF NOT EXISTS daily_set_submission (
  daily_set_submission_uuid  CHAR(36)     NOT NULL,
  member_uuid                CHAR(36)     NOT NULL,
  challenge_date             DATE         NOT NULL,
  correct_count              INT          NOT NULL,
  completed_at               DATETIME(6)  NOT NULL,
  created_at                 DATETIME(6)  NOT NULL,
  updated_at                 DATETIME(6)  NOT NULL,
  created_by                 VARCHAR(255),
  updated_by                 VARCHAR(255),
  PRIMARY KEY (daily_set_submission_uuid),
  UNIQUE KEY uk_daily_set_submission_member_date (member_uuid, challenge_date),
  INDEX idx_daily_set_submission_date_score (challenge_date, correct_count DESC)
);
```

- [ ] **Step 2: `DailyChallenge` 엔티티에 `sortOrder` 추가**

`server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailyChallenge.java`의 `@Table` 어노테이션과 필드를 아래로 교체:

```java
@Entity
@Table(
    name = "daily_challenge",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_challenge_date_order", columnNames = {"challenge_date", "sort_order"})
    },
    indexes = {
        @Index(name = "idx_daily_challenge_question", columnList = "question_uuid")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailyChallenge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID dailyChallengeUuid;

    @Column(nullable = false)
    private LocalDate challengeDate;

    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private UUID questionUuid;
}
```

- [ ] **Step 3: `DailySetSubmission` 엔티티 작성**

```java
package com.passql.question.entity;

import com.passql.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "daily_set_submission",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_set_submission_member_date",
            columnNames = {"member_uuid", "challenge_date"})
    },
    indexes = {
        @Index(name = "idx_daily_set_submission_date_score",
            columnList = "challenge_date, correct_count")
    }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailySetSubmission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID dailySetSubmissionUuid;

    @Column(nullable = false)
    private UUID memberUuid;

    @Column(nullable = false)
    private LocalDate challengeDate;

    @Column(nullable = false)
    private Integer correctCount;

    @Column(nullable = false)
    private LocalDateTime completedAt;
}
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/resources/db/migration/V0_0_184__daily_set.sql \
        server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailyChallenge.java \
        server/PQL-Domain-Question/src/main/java/com/passql/question/entity/DailySetSubmission.java
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : DB 마이그레이션 및 엔티티 변경 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 2: Repository + DTO 변경

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/DailyChallengeRepository.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/DailySetSubmissionRepository.java`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/DailyChallengeItem.java`
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/DailyChallengeAssignRequest.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/DailySetTodayResponse.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/DailySetCompleteRequest.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/DailySetCompleteResponse.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/LeaderboardEntry.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/LeaderboardResponse.java`
- Modify: `server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java`

- [ ] **Step 1: `DailyChallengeRepository` 변경**

기존 `findByChallengeDate(LocalDate)` 제거하고 아래로 교체:

```java
package com.passql.question.repository;

import com.passql.question.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, UUID> {

    List<DailyChallenge> findByChallengeDateOrderBySortOrderAsc(LocalDate challengeDate);

    List<DailyChallenge> findByChallengeDateBetweenOrderByChallengeDateAscSortOrderAsc(LocalDate from, LocalDate to);

    boolean existsByChallengeDateAndSortOrder(LocalDate challengeDate, int sortOrder);

    @Modifying
    @Transactional
    void deleteByChallengeDateAndSortOrder(LocalDate challengeDate, int sortOrder);

    @Modifying
    @Transactional
    void deleteByChallengeDate(LocalDate challengeDate);

    @Modifying
    @Transactional
    void deleteByQuestionUuid(UUID questionUuid);
}
```

- [ ] **Step 2: `DailySetSubmissionRepository` 작성**

```java
package com.passql.question.repository;

import com.passql.question.entity.DailySetSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailySetSubmissionRepository extends JpaRepository<DailySetSubmission, UUID> {

    Optional<DailySetSubmission> findByMemberUuidAndChallengeDate(UUID memberUuid, LocalDate challengeDate);

    boolean existsByMemberUuidAndChallengeDate(UUID memberUuid, LocalDate challengeDate);

    /** 오늘 날짜 기준 정답 수 내림차순, 완료 시각 오름차순으로 상위 N명 조회 */
    @Query("SELECT s FROM DailySetSubmission s WHERE s.challengeDate = :date " +
           "ORDER BY s.correctCount DESC, s.completedAt ASC")
    List<DailySetSubmission> findByChallengeDateOrderByScore(@Param("date") LocalDate date);
}
```

- [ ] **Step 3: `DailyChallengeItem` DTO에 `sortOrder` 추가**

```java
package com.passql.question.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DailyChallengeItem(
    LocalDate challengeDate,
    int sortOrder,
    UUID questionUuid,
    String topicName,
    Integer difficulty,
    String stemPreview
) {}
```

- [ ] **Step 4: `DailyChallengeAssignRequest` 변경 (10문제 리스트)**

```java
package com.passql.question.dto;

import java.util.List;
import java.util.UUID;

public record DailyChallengeAssignRequest(List<UUID> questionUuids) {}
```

- [ ] **Step 5: 신규 DTO 파일 작성**

`DailySetTodayResponse.java`:
```java
package com.passql.question.dto;

import java.util.List;

public record DailySetTodayResponse(
    List<QuestionSummary> questions,
    boolean alreadyCompleted,
    Integer correctCount
) {}
```

`DailySetCompleteRequest.java`:
```java
package com.passql.question.dto;

import java.util.UUID;

public record DailySetCompleteRequest(int correctCount, UUID sessionUuid) {}
```

`DailySetCompleteResponse.java`:
```java
package com.passql.question.dto;

public record DailySetCompleteResponse(int correctCount, int rank, int totalParticipants) {}
```

`LeaderboardEntry.java`:
```java
package com.passql.question.dto;

public record LeaderboardEntry(int rank, String nickname, int correctCount) {}
```

`LeaderboardResponse.java`:
```java
package com.passql.question.dto;

import java.time.LocalDate;
import java.util.List;

public record LeaderboardResponse(
    LocalDate date,
    List<LeaderboardEntry> entries,
    LeaderboardEntry myEntry
) {}
```

- [ ] **Step 6: `ErrorCode`에 에러 코드 추가**

`DAILY_CHALLENGE_QUESTION_INACTIVE` 항목 아래에 추가:
```java
DAILY_SET_ALREADY_COMPLETED(HttpStatus.CONFLICT, "오늘의 데일리 세트를 이미 완료했습니다."),
DAILY_SET_NOT_FOUND(HttpStatus.NOT_FOUND, "오늘의 데일리 세트가 준비되지 않았습니다."),
```

- [ ] **Step 7: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/repository/ \
        server/PQL-Domain-Question/src/main/java/com/passql/question/dto/ \
        server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : Repository 및 DTO 추가 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 3: 서버 서비스 레이어

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/AdminDailyChallengeService.java`
- Modify: `server/PQL-Application/src/main/java/com/passql/application/service/HomeService.java`
- Create: `server/PQL-Application/src/main/java/com/passql/application/service/DailySetService.java`

- [ ] **Step 1: `AdminDailyChallengeService` 전면 교체**

```java
package com.passql.question.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.question.dto.DailyChallengeItem;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.entity.Question;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDailyChallengeService {

    private final DailyChallengeRepository dailyChallengeRepository;
    private final QuestionRepository questionRepository;
    private final QuestionService questionService;

    public List<DailyChallengeItem> getChallenges(LocalDate from, LocalDate to) {
        List<DailyChallenge> challenges = dailyChallengeRepository
                .findByChallengeDateBetweenOrderByChallengeDateAscSortOrderAsc(from, to);

        List<UUID> uuids = challenges.stream().map(DailyChallenge::getQuestionUuid).toList();
        Map<UUID, Question> questionMap = questionRepository.findAllById(uuids)
                .stream().collect(Collectors.toMap(Question::getQuestionUuid, q -> q));

        return challenges.stream()
                .map(dc -> {
                    Question q = questionMap.get(dc.getQuestionUuid());
                    if (q == null) return null;
                    return new DailyChallengeItem(
                            dc.getChallengeDate(),
                            dc.getSortOrder(),
                            q.getQuestionUuid(),
                            questionService.toSummary(q).topicName(),
                            q.getDifficulty(),
                            q.getStem() == null ? "" : (q.getStem().length() > 80 ? q.getStem().substring(0, 80) : q.getStem())
                    );
                })
                .filter(Objects::nonNull)
                .toList();
    }

    /** 날짜에 10문제 일괄 배정 (기존 배정 전부 삭제 후 재삽입) */
    @Transactional
    public List<DailyChallengeItem> assign(LocalDate date, List<UUID> questionUuids) {
        if (questionUuids == null || questionUuids.isEmpty()) {
            throw new CustomException(ErrorCode.QUESTION_NOT_FOUND);
        }

        List<Question> questions = questionUuids.stream()
                .map(uuid -> questionRepository.findById(uuid)
                        .orElseThrow(() -> new CustomException(ErrorCode.QUESTION_NOT_FOUND)))
                .toList();

        questions.forEach(q -> {
            if (!Boolean.TRUE.equals(q.getIsActive())) {
                throw new CustomException(ErrorCode.DAILY_CHALLENGE_QUESTION_INACTIVE);
            }
        });

        // 기존 배정 전부 삭제 후 재삽입
        dailyChallengeRepository.deleteByChallengeDate(date);

        List<DailyChallenge> saved = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            saved.add(dailyChallengeRepository.save(
                    DailyChallenge.builder()
                            .challengeDate(date)
                            .sortOrder(i)
                            .questionUuid(questions.get(i).getQuestionUuid())
                            .build()));
        }

        return saved.stream().map(dc -> {
            Question q = questions.get(dc.getSortOrder());
            return new DailyChallengeItem(
                    date, dc.getSortOrder(), q.getQuestionUuid(),
                    questionService.toSummary(q).topicName(),
                    q.getDifficulty(),
                    q.getStem() == null ? "" : (q.getStem().length() > 80 ? q.getStem().substring(0, 80) : q.getStem())
            );
        }).toList();
    }

    @Transactional
    public void unassign(LocalDate date) {
        dailyChallengeRepository.deleteByChallengeDate(date);
    }

    /**
     * 자정 스케줄러 폴백. 이미 배정된 날짜 스킵.
     * 토픽 round-robin으로 10문제 선정.
     */
    @Transactional
    public void confirmFallback(LocalDate date) {
        List<DailyChallenge> existing = dailyChallengeRepository
                .findByChallengeDateOrderBySortOrderAsc(date);
        if (!existing.isEmpty()) return;

        List<Question> active = questionRepository.findByIsActiveTrue();
        if (active.isEmpty()) return;

        // 토픽별 그룹핑 후 round-robin으로 10개 선택
        Map<UUID, List<Question>> byTopic = active.stream()
                .collect(Collectors.groupingBy(Question::getTopicUuid));
        List<List<Question>> groups = new ArrayList<>(byTopic.values());

        long seed = date.toEpochDay();
        // 각 그룹 내 순서를 날짜 시드로 셔플 → 매일 다른 문제 선택
        groups.forEach(g -> Collections.shuffle(g, new Random(seed)));
        Collections.shuffle(groups, new Random(seed + 1));

        List<UUID> picks = new ArrayList<>();
        int groupIdx = 0;
        int target = Math.min(10, active.size());
        // 중복 없이 round-robin
        Set<UUID> seen = new HashSet<>();
        while (picks.size() < target) {
            List<Question> group = groups.get(groupIdx % groups.size());
            for (Question q : group) {
                if (!seen.contains(q.getQuestionUuid())) {
                    picks.add(q.getQuestionUuid());
                    seen.add(q.getQuestionUuid());
                    break;
                }
            }
            groupIdx++;
            // 모든 그룹을 한 바퀴 돌았는데 picks가 부족하면 중복 허용 중단 (문제 수 부족)
            if (groupIdx > groups.size() * target) break;
        }

        try {
            for (int i = 0; i < picks.size(); i++) {
                dailyChallengeRepository.saveAndFlush(
                        DailyChallenge.builder()
                                .challengeDate(date)
                                .sortOrder(i)
                                .questionUuid(picks.get(i))
                                .build());
            }
        } catch (DataIntegrityViolationException ignored) {
            // 동시 호출로 다른 스레드가 먼저 저장 완료
        }
    }
}
```

- [ ] **Step 2: `HomeService.getToday()` 변경**

`alreadySolvedToday` 판단 로직을 `DailySetSubmissionRepository` 기반으로 교체:

```java
package com.passql.application.service;

import com.passql.question.dto.DailySetTodayResponse;
import com.passql.question.entity.DailyChallenge;
import com.passql.question.repository.DailyChallengeRepository;
import com.passql.question.repository.DailySetSubmissionRepository;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomeService {

    private final QuestionService questionService;
    private final DailyChallengeRepository dailyChallengeRepository;
    private final DailySetSubmissionRepository dailySetSubmissionRepository;

    public DailySetTodayResponse getToday(UUID memberUuid) {
        LocalDate today = LocalDate.now();
        List<DailyChallenge> challenges = dailyChallengeRepository
                .findByChallengeDateOrderBySortOrderAsc(today);

        if (challenges.isEmpty()) {
            return new DailySetTodayResponse(List.of(), false, null);
        }

        boolean alreadyCompleted = memberUuid != null &&
                dailySetSubmissionRepository.existsByMemberUuidAndChallengeDate(memberUuid, today);

        Integer correctCount = null;
        if (alreadyCompleted) {
            correctCount = dailySetSubmissionRepository
                    .findByMemberUuidAndChallengeDate(memberUuid, today)
                    .map(s -> s.getCorrectCount())
                    .orElse(null);
        }

        // memberUuid 기반 결정론적 셔플 — 새로고침해도 순서 유지
        var questions = challenges.stream()
                .map(dc -> questionService.toSummary(
                        questionService.getQuestionEntityOrNull(dc.getQuestionUuid())))
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        if (memberUuid != null) {
            long seed = (memberUuid.toString() + today.toString()).hashCode();
            java.util.Collections.shuffle(questions, new java.util.Random(seed));
        }

        return new DailySetTodayResponse(questions, alreadyCompleted, correctCount);
    }
}
```

> **주의:** `QuestionService`에 `getQuestionEntityOrNull(UUID)` 메서드가 없으면 추가해야 한다.  
> `QuestionService.java`에 아래 메서드 추가:
> ```java
> public Question getQuestionEntityOrNull(UUID questionUuid) {
>     return questionRepository.findById(questionUuid).orElse(null);
> }
> ```

- [ ] **Step 3: `DailySetService` 작성**

```java
package com.passql.application.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.question.dto.DailySetCompleteRequest;
import com.passql.question.dto.DailySetCompleteResponse;
import com.passql.question.dto.LeaderboardEntry;
import com.passql.question.dto.LeaderboardResponse;
import com.passql.question.entity.DailySetSubmission;
import com.passql.question.repository.DailySetSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DailySetService {

    private final DailySetSubmissionRepository dailySetSubmissionRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public DailySetCompleteResponse complete(UUID memberUuid, DailySetCompleteRequest request) {
        LocalDate today = LocalDate.now();

        if (dailySetSubmissionRepository.existsByMemberUuidAndChallengeDate(memberUuid, today)) {
            throw new CustomException(ErrorCode.DAILY_SET_ALREADY_COMPLETED);
        }

        try {
            dailySetSubmissionRepository.saveAndFlush(
                    DailySetSubmission.builder()
                            .memberUuid(memberUuid)
                            .challengeDate(today)
                            .correctCount(request.correctCount())
                            .completedAt(LocalDateTime.now())
                            .build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.DAILY_SET_ALREADY_COMPLETED);
        }

        List<DailySetSubmission> board = dailySetSubmissionRepository
                .findByChallengeDateOrderByScore(today);

        int rank = 1;
        for (DailySetSubmission s : board) {
            if (s.getMemberUuid().equals(memberUuid)) break;
            rank++;
        }

        return new DailySetCompleteResponse(request.correctCount(), rank, board.size());
    }

    public LeaderboardResponse getLeaderboard(UUID memberUuid) {
        LocalDate today = LocalDate.now();
        List<DailySetSubmission> board = dailySetSubmissionRepository
                .findByChallengeDateOrderByScore(today);

        // memberUuid 목록 일괄 조회 → 닉네임 매핑
        List<UUID> memberUuids = board.stream().map(DailySetSubmission::getMemberUuid).toList();
        Map<UUID, String> nicknameMap = memberRepository.findAllById(memberUuids).stream()
                .collect(Collectors.toMap(Member::getMemberUuid, Member::getNickname));

        List<LeaderboardEntry> entries = new ArrayList<>();
        LeaderboardEntry myEntry = null;

        for (int i = 0; i < board.size(); i++) {
            DailySetSubmission s = board.get(i);
            String nickname = nicknameMap.getOrDefault(s.getMemberUuid(), "알 수 없음");
            LeaderboardEntry entry = new LeaderboardEntry(i + 1, nickname, s.getCorrectCount());
            entries.add(entry);
            if (s.getMemberUuid().equals(memberUuid)) {
                myEntry = entry;
            }
        }

        return new LeaderboardResponse(today, entries, myEntry);
    }
}
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/service/AdminDailyChallengeService.java \
        server/PQL-Application/src/main/java/com/passql/application/service/HomeService.java \
        server/PQL-Application/src/main/java/com/passql/application/service/DailySetService.java \
        server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : 서비스 레이어 구현 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 4: 서버 컨트롤러 + 관리자 템플릿

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/DailySetController.java`
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminDailyChallengeController.java`
- Modify: `server/PQL-Web/src/main/resources/templates/admin/daily-challenges.html`
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java` — `/questions/today` 엔드포인트 제거

- [ ] **Step 1: `DailySetController` 작성**

```java
package com.passql.web.controller;

import com.passql.application.service.DailySetService;
import com.passql.application.service.HomeService;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.question.dto.DailySetCompleteRequest;
import com.passql.question.dto.DailySetCompleteResponse;
import com.passql.question.dto.DailySetTodayResponse;
import com.passql.question.dto.LeaderboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/daily-set")
@RequiredArgsConstructor
public class DailySetController {

    private final HomeService homeService;
    private final DailySetService dailySetService;

    @GetMapping("/today")
    public ResponseEntity<DailySetTodayResponse> getToday(
            @AuthMember LoginMember loginMember) {
        return ResponseEntity.ok(homeService.getToday(loginMember.memberUuid()));
    }

    @PostMapping("/complete")
    public ResponseEntity<DailySetCompleteResponse> complete(
            @AuthMember LoginMember loginMember,
            @RequestBody DailySetCompleteRequest request) {
        return ResponseEntity.ok(dailySetService.complete(loginMember.memberUuid(), request));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<LeaderboardResponse> getLeaderboard(
            @AuthMember LoginMember loginMember) {
        return ResponseEntity.ok(dailySetService.getLeaderboard(loginMember.memberUuid()));
    }
}
```

- [ ] **Step 2: `AdminDailyChallengeController` - assign API 변경**

`assign` 메서드만 교체 (나머지 유지):

```java
/** 날짜에 10문제 자동 배정 (questionUuids 없으면 폴백 로직으로 자동 선정) */
@PutMapping("/{date}")
@ResponseBody
public ResponseEntity<?> assign(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestBody DailyChallengeAssignRequest request) {
    if (request.questionUuids() == null || request.questionUuids().isEmpty()) {
        // 자동 배정: 폴백 로직 트리거
        adminDailyChallengeService.confirmFallback(date);
        return ResponseEntity.ok(adminDailyChallengeService.getChallenges(date, date));
    }
    return ResponseEntity.ok(adminDailyChallengeService.assign(date, request.questionUuids()));
}
```

- [ ] **Step 3: `QuestionController`에서 `/questions/today` 엔드포인트 제거**

`QuestionController.java`에서 `getToday` 메서드 및 관련 import(`HomeService`) 제거.  
`QuestionControllerDocs.java`에서도 대응 메서드 제거.

- [ ] **Step 4: 관리자 템플릿 JS 수정**

`daily-challenges.html`의 `selectQuestion` 함수와 `eventClick`, `dateClick` 핸들러를 아래로 교체:

```javascript
// 날짜 클릭 → 자동 배정 (questionUuids 없이 PUT 호출 → 서버 폴백)
function openModal(dateStr, challenges) {
    selectedDate = dateStr;
    document.getElementById('modalDate').textContent = dateStr;
    
    const listEl = document.getElementById('assignedList');
    listEl.innerHTML = '';
    if (challenges && challenges.length > 0) {
        challenges.forEach((c, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${i + 1}</td><td><span class="badge badge-outline badge-sm">${c.topicName}</span></td><td class="text-xs">${c.stemPreview ? c.stemPreview.substring(0, 50) : ''}</td>`;
            listEl.appendChild(row);
        });
        document.getElementById('unassignBtn').classList.remove('hidden');
    } else {
        listEl.innerHTML = '<tr><td colspan="3" class="text-center text-base-content/50">배정 없음 (저장 시 자동 선정)</td></tr>';
        document.getElementById('unassignBtn').classList.add('hidden');
    }
    document.getElementById('assignModal').showModal();
    lucide.createIcons();
}

// 날짜 클릭 → 해당 날짜 배정 조회 후 모달 열기
calendar = new FullCalendar.Calendar(el, {
    // ... 기존 설정 유지 ...
    dateClick: function (info) {
        const from = info.dateStr;
        fetch(`/admin/daily-challenges/api?from=${from}&to=${from}`)
            .then(r => r.json())
            .then(items => openModal(info.dateStr, items));
    },
    eventClick: function (info) {
        const from = info.event.startStr;
        fetch(`/admin/daily-challenges/api?from=${from}&to=${from}`)
            .then(r => r.json())
            .then(items => openModal(info.event.startStr, items));
    }
});
```

모달 HTML도 문제 목록 표시용으로 교체:

```html
<dialog id="assignModal" class="modal">
    <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-1">데일리 세트 배정</h3>
        <p class="text-base-content/60 text-sm mb-4">
            날짜: <span id="modalDate" class="font-mono font-bold"></span>
        </p>

        <!-- 현재 배정된 문제 목록 -->
        <div class="overflow-y-auto max-h-64 border border-base-300 rounded-lg mb-4">
            <table class="table table-sm">
                <thead class="sticky top-0 bg-base-100">
                    <tr><th>#</th><th>토픽</th><th>지문 미리보기</th></tr>
                </thead>
                <tbody id="assignedList"></tbody>
            </table>
        </div>

        <div class="flex justify-between items-center">
            <button id="unassignBtn" class="btn btn-sm btn-outline btn-error hidden"
                    onclick="unassignChallenge()">
                <i data-lucide="trash-2" class="size-4"></i>
                배정 해제
            </button>
            <button class="btn btn-sm btn-primary ml-auto" onclick="autoAssign()">
                자동 배정
            </button>
            <button class="btn btn-sm ml-2" onclick="closeModal()">닫기</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

자동 배정 JS 함수 추가:

```javascript
function autoAssign() {
    fetch(`/admin/daily-challenges/${selectedDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionUuids: [] })
    })
    .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.message || '배정 실패'); });
        return r.json();
    })
    .then(items => {
        calendar.refetchEvents();
        // 모달 내 목록 갱신
        openModal(selectedDate, items);
    })
    .catch(err => alert(err.message));
}
```

이벤트 표시도 10문제 중 첫 번째만 표시하도록 변경 (날짜에 1개 이벤트):

```javascript
.then(items => {
    // 날짜별로 그룹핑: 같은 날짜 10문제를 1개 이벤트로 표시
    const byDate = {};
    items.forEach(item => {
        if (!byDate[item.challengeDate]) byDate[item.challengeDate] = [];
        byDate[item.challengeDate].push(item);
    });
    successCallback(Object.entries(byDate).map(([date, challenges]) => ({
        title: `${challenges.length}문제 배정`,
        start: date,
        extendedProps: { challenges },
        color: '#6366f1'
    })));
})
```

- [ ] **Step 5: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/DailySetController.java \
        server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminDailyChallengeController.java \
        server/PQL-Web/src/main/java/com/passql/web/controller/QuestionController.java \
        server/PQL-Web/src/main/resources/templates/admin/daily-challenges.html
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : 컨트롤러 및 관리자 UI 변경 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 5: 클라이언트 타입 + API 레이어

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/api/dailySet.ts`
- Modify: `client/src/hooks/useHome.ts`

- [ ] **Step 1: `types/api.ts`에 타입 추가**

기존 `TodayQuestionResponse` 아래에 추가:

```typescript
export interface DailySetTodayResponse {
  readonly questions: readonly QuestionSummary[];
  readonly alreadyCompleted: boolean;
  readonly correctCount: number | null;
}

export interface DailySetCompleteResponse {
  readonly correctCount: number;
  readonly rank: number;
  readonly totalParticipants: number;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly correctCount: number;
}

export interface LeaderboardResponse {
  readonly date: string;
  readonly entries: readonly LeaderboardEntry[];
  readonly myEntry: LeaderboardEntry | null;
}
```

- [ ] **Step 2: `api/dailySet.ts` 작성**

```typescript
import { apiFetch } from "./client";
import type {
  DailySetTodayResponse,
  DailySetCompleteResponse,
  LeaderboardResponse,
} from "../types/api";

export function fetchDailySet(): Promise<DailySetTodayResponse> {
  return apiFetch("/daily-set/today");
}

export function completeDailySet(
  correctCount: number,
  sessionUuid: string,
): Promise<DailySetCompleteResponse> {
  return apiFetch("/daily-set/complete", {
    method: "POST",
    body: JSON.stringify({ correctCount, sessionUuid }),
  });
}

export function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return apiFetch("/daily-set/leaderboard");
}
```

- [ ] **Step 3: `hooks/useHome.ts`에 훅 추가**

기존 `useTodayQuestion` 아래에 추가 (기존 훅은 제거하거나 유지):

```typescript
import { fetchDailySet, fetchLeaderboard } from "../api/dailySet";
import type { DailySetTodayResponse, LeaderboardResponse } from "../types/api";

export function useDailySet() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<DailySetTodayResponse>({
    queryKey: ["dailySet", accessToken],
    queryFn: fetchDailySet,
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useLeaderboard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", accessToken],
    queryFn: fetchLeaderboard,
    enabled: !!accessToken,
    staleTime: 1000 * 60,
    retry: false,
  });
}
```

`useTodayQuestion`는 `useHome.ts`에서 삭제하고 `fetchTodayQuestion` import도 제거.

- [ ] **Step 4: 커밋**

```bash
git add client/src/types/api.ts \
        client/src/api/dailySet.ts \
        client/src/hooks/useHome.ts
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : 클라이언트 타입 및 API 레이어 추가 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 6: `dailySetStore` + `DailySet.tsx` 페이지

**Files:**
- Create: `client/src/stores/dailySetStore.ts`
- Create: `client/src/pages/DailySet.tsx`

- [ ] **Step 1: `dailySetStore.ts` 작성**

```typescript
import { create } from "zustand";
import type { QuestionSummary } from "../types/api";

interface DailySetQuestionResult {
  readonly questionUuid: string;
  readonly isCorrect: boolean;
  readonly selectedChoiceKey: string;
  readonly selectedChoiceBody: string;
  readonly durationMs: number;
  readonly submissionUuid?: string;
  readonly choiceSetUuid?: string;
}

interface DailySetState {
  readonly sessionUuid: string | null;
  readonly questions: readonly QuestionSummary[];
  readonly currentIndex: number;
  readonly results: readonly DailySetQuestionResult[];
  readonly startedAt: number | null;
  readonly correctCount: number | null;
}

interface DailySetActions {
  readonly startSession: (sessionUuid: string, questions: readonly QuestionSummary[]) => void;
  readonly submitAndAdvance: (
    questionUuid: string,
    isCorrect: boolean,
    selectedChoiceKey: string,
    selectedChoiceBody: string,
    submissionUuid?: string,
    choiceSetUuid?: string,
  ) => void;
  readonly setCorrectCount: (count: number) => void;
  readonly reset: () => void;
}

const INITIAL_STATE: DailySetState = {
  sessionUuid: null,
  questions: [],
  currentIndex: 0,
  results: [],
  startedAt: null,
  correctCount: null,
};

export const useDailySetStore = create<DailySetState & DailySetActions>()((set, get) => ({
  ...INITIAL_STATE,

  startSession: (sessionUuid, questions) =>
    set({ ...INITIAL_STATE, sessionUuid, questions, startedAt: Date.now() }),

  submitAndAdvance: (questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody, submissionUuid, choiceSetUuid) => {
    const { startedAt } = get();
    const durationMs = startedAt ? Date.now() - startedAt : 0;
    const newResult: DailySetQuestionResult = {
      questionUuid, isCorrect, selectedChoiceKey, selectedChoiceBody, durationMs, submissionUuid, choiceSetUuid,
    };
    set((s) => ({
      results: [...s.results, newResult],
      currentIndex: s.currentIndex + 1,
      startedAt: Date.now(),
    }));
  },

  setCorrectCount: (count) => set({ correctCount: count }),

  reset: () => set(INITIAL_STATE),
}));
```

- [ ] **Step 2: `DailySet.tsx` 작성**

`PracticeSet.tsx` 구조를 참고해 작성. 핵심 차이:
- `usePracticeStore` 대신 `useDailySetStore`
- 마지막 문제 완료 시 `completeDailySet` 호출 후 `/daily-set/result`로 이동
- 헤더에 "오늘의 데일리 세트" 표시 + 진행 프로그레스바 (N/10)

```typescript
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Navigate, useBlocker } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useDailySet } from "../hooks/useHome";
import { useDailySetStore } from "../stores/dailySetStore";
import { useAuthStore } from "../stores/authStore";
import { submitAnswer } from "../api/questions";
import { completeDailySet } from "../api/dailySet";
import QuestionDetail from "./QuestionDetail";
import PracticeFeedbackBar from "../components/PracticeFeedbackBar";
import ConfirmModal from "../components/ConfirmModal";
import LoadingOverlay from "../components/LoadingOverlay";
import type { ChoiceItem, SubmitResult } from "../types/api";

export default function DailySet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const memberUuid = useAuthStore((s) => s.memberUuid ?? "");
  const { data: dailySet, isLoading } = useDailySet();

  const store = useDailySetStore();
  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isProcessingRef = useRef(false);
  const [sessionUuid] = useState(() => crypto.randomUUID());

  // 세션 초기화 — dailySet 로드 완료 후 1회
  const initialized = useRef(false);
  useEffect(() => {
    if (dailySet?.questions && !initialized.current) {
      store.startSession(sessionUuid, dailySet.questions);
      initialized.current = true;
    }
  }, [dailySet?.questions, sessionUuid, store]);

  const totalQuestions = store.questions.length;
  const displayIndex = feedback ? store.currentIndex - 1 : store.currentIndex;
  const displayQuestion = store.questions[displayIndex];

  const shouldNavigateToResult = !feedback && store.currentIndex >= totalQuestions && totalQuestions > 0;

  // 마지막 문제 완료 → complete API 호출 후 결과 화면으로
  useEffect(() => {
    if (!shouldNavigateToResult) return;
    const correctCount = store.results.filter((r) => r.isCorrect).length;
    store.setCorrectCount(correctCount);
    completeDailySet(correctCount, sessionUuid)
      .then(() => {
        queryClient.refetchQueries({ queryKey: ["dailySet"] });
        queryClient.refetchQueries({ queryKey: ["heatmap"] });
        queryClient.refetchQueries({ queryKey: ["progress"] });
      })
      .catch(() => {})
      .finally(() => {
        navigate("/daily-set/result", { replace: true });
      });
  }, [shouldNavigateToResult, store, sessionUuid, navigate, queryClient]);

  const blocker = useBlocker(!shouldNavigateToResult && feedback === null && !submitting && totalQuestions > 0);

  const handleSubmit = useCallback(
    async (selectedChoiceKey: string, choiceSetId: string, choices: readonly ChoiceItem[]) => {
      if (!displayQuestion) return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const selectedChoice = choices.find((c) => c.key === selectedChoiceKey);
      const correctChoice = choices.find((c) => c.isCorrect);

      setSubmitting(true);
      try {
        const result = await submitAnswer(
          displayQuestion.questionUuid, choiceSetId, selectedChoiceKey, sessionUuid,
        );
        store.submitAndAdvance(
          displayQuestion.questionUuid,
          result.isCorrect,
          selectedChoiceKey,
          selectedChoice?.body ?? "",
          result.submissionUuid,
          choiceSetId,
        );
        setFeedback(result);
      } catch {
        navigate("/", { replace: true });
      } finally {
        isProcessingRef.current = false;
        setSubmitting(false);
      }
    },
    [displayQuestion, sessionUuid, store, navigate],
  );

  if (!isLoading && dailySet?.alreadyCompleted) {
    return <Navigate to="/daily-set/result" replace />;
  }

  if (!isLoading && (!dailySet?.questions || dailySet.questions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4">
        <p className="text-body text-text-secondary">오늘의 세트가 아직 준비 중이에요</p>
        <button type="button" className="btn-primary px-6" onClick={() => navigate("/", { replace: true })}>
          홈으로 가기
        </button>
      </div>
    );
  }

  const progressPct = totalQuestions > 0 ? (store.currentIndex / totalQuestions) * 100 : 0;

  return (
    <div className="flex flex-col h-screen max-w-120 mx-auto w-full">
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 items-center mb-2">
          <div className="justify-self-start">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
              onClick={() => navigate("/")}
            >
              <Home size={18} className="text-text-secondary" />
            </button>
          </div>
          <span className="text-sm font-semibold text-text-secondary text-center">
            오늘의 데일리 세트 {store.currentIndex}/{totalQuestions}
          </span>
          <div />
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 transition-[padding] duration-300 ${feedback ? "pb-52" : "pb-4"}`}>
        {displayQuestion && (
          <QuestionDetail
            key={`${displayQuestion.questionUuid}-${store.currentIndex}`}
            questionUuid={displayQuestion.questionUuid}
            practiceMode
            practiceSubmitLabel="확인"
            onPracticeSubmit={handleSubmit}
            showExecution={!!feedback}
          />
        )}
      </div>

      {feedback && (
        <PracticeFeedbackBar
          result={feedback}
          nextLabel={store.currentIndex >= totalQuestions ? "결과 보기" : "다음 문제"}
          onNext={() => setFeedback(null)}
        />
      )}

      {submitting && (
        <LoadingOverlay topicName="데일리 세트" staticMessage="채점 중이에요" subMessage="잠시만 기다려주세요" />
      )}

      <ConfirmModal
        isOpen={blocker.state === "blocked"}
        title="세트를 그만할까요?"
        description="지금 나가면 현재 진행 기록이 저장되지 않아요."
        cancelLabel="계속 풀기"
        confirmLabel="나가기"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/stores/dailySetStore.ts \
        client/src/pages/DailySet.tsx
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : DailySet 스토어 및 페이지 구현 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 7: `DailySetResult.tsx` + `Leaderboard.tsx`

**Files:**
- Create: `client/src/pages/DailySetResult.tsx`
- Create: `client/src/pages/Leaderboard.tsx`

- [ ] **Step 1: `DailySetResult.tsx` 작성**

```typescript
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { useDailySetStore } from "../stores/dailySetStore";
import { useLeaderboard } from "../hooks/useHome";

export default function DailySetResult() {
  const navigate = useNavigate();
  const store = useDailySetStore();
  const { data: leaderboard } = useLeaderboard();

  const correctCount = store.correctCount ?? store.results.filter((r) => r.isCorrect).length;
  const totalCount = store.results.length;

  return (
    <div className="flex flex-col min-h-screen max-w-120 mx-auto w-full px-4 py-8 gap-6">
      {/* 결과 헤더 */}
      <div className="text-center">
        <p className="text-sm text-text-secondary mb-1">오늘의 데일리 세트 완료</p>
        <p className="text-4xl font-bold text-brand">
          {correctCount} <span className="text-2xl text-text-secondary font-normal">/ {totalCount}</span>
        </p>
        <p className="text-sm text-text-secondary mt-1">정답</p>
      </div>

      {/* 문제별 O/X */}
      <div className="bg-surface-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-text-secondary mb-3">문제별 결과</p>
        <div className="flex flex-col gap-2">
          {store.results.map((r, i) => (
            <div key={r.questionUuid} className="flex items-center gap-3">
              <span className="text-xs text-text-caption w-6">{i + 1}</span>
              {r.isCorrect
                ? <CheckCircle size={16} className="text-sem-success-text flex-shrink-0" />
                : <XCircle size={16} className="text-sem-error-text flex-shrink-0" />}
              <span className={`text-sm ${r.isCorrect ? "text-text-primary" : "text-text-secondary"}`}>
                {r.isCorrect ? "정답" : "오답"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 리더보드 미니 카드 */}
      {leaderboard && (
        <div className="bg-surface-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-secondary flex items-center gap-1">
              <Trophy size={14} />
              오늘의 순위
            </p>
            {leaderboard.myEntry && (
              <span className="text-xs text-brand font-semibold">내 순위 {leaderboard.myEntry.rank}위</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {leaderboard.entries.slice(0, 3).map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between text-sm">
                <span className="text-text-caption w-6">{entry.rank}</span>
                <span className="flex-1 text-text-primary">{entry.nickname}</span>
                <span className="text-brand font-semibold">{entry.correctCount}점</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full mt-3 btn-outline text-sm py-2 rounded-xl"
            onClick={() => navigate("/leaderboard")}
          >
            전체 순위 보기
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn-primary py-3 rounded-2xl"
        onClick={() => navigate("/", { replace: true })}
      >
        홈으로 가기
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `Leaderboard.tsx` 작성**

```typescript
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { useLeaderboard } from "../hooks/useHome";
import { useAuthStore } from "../stores/authStore";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { data: leaderboard, isLoading } = useLeaderboard();
  const nickname = useAuthStore((s) => s.nickname);

  return (
    <div className="flex flex-col min-h-screen max-w-120 mx-auto w-full">
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 items-center">
          <button
            type="button"
            className="justify-self-start w-8 h-8 flex items-center justify-center rounded-xl hover:bg-border transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} className="text-text-secondary" />
          </button>
          <span className="text-sm font-semibold text-text-secondary text-center">오늘의 순위</span>
          <div />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading && (
          <div className="flex justify-center mt-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {leaderboard && (
          <>
            <p className="text-xs text-text-caption text-center mt-2 mb-4">
              {leaderboard.date} 기준 · 정답 수 순
            </p>

            {leaderboard.myEntry && (
              <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand">내 순위</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary">{leaderboard.myEntry.correctCount}점</span>
                  <span className="text-lg font-bold text-brand">{leaderboard.myEntry.rank}위</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {leaderboard.entries.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    entry.nickname === nickname
                      ? "bg-brand/5 border-brand/20"
                      : "bg-surface-card border-border"
                  }`}
                >
                  <span className={`w-8 text-center font-bold text-sm ${
                    entry.rank === 1 ? "text-yellow-500" :
                    entry.rank === 2 ? "text-gray-400" :
                    entry.rank === 3 ? "text-amber-600" : "text-text-caption"
                  }`}>
                    {entry.rank <= 3 ? <Trophy size={16} className="mx-auto" /> : entry.rank}
                  </span>
                  <span className="flex-1 text-sm text-text-primary">{entry.nickname}</span>
                  <span className="text-sm font-semibold text-brand">{entry.correctCount}점</span>
                </div>
              ))}
            </div>

            {leaderboard.entries.length === 0 && (
              <p className="text-center text-text-secondary text-sm mt-20">
                아직 완료한 사람이 없어요
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/pages/DailySetResult.tsx \
        client/src/pages/Leaderboard.tsx
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : 결과 화면 및 리더보드 페이지 구현 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 8: `Home.tsx` + `App.tsx` 라우팅 연결

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `App.tsx` 라우트 추가**

기존 `daily-challenge` 라우트를 아래로 교체하고 신규 라우트 추가:

```typescript
import DailySet from "./pages/DailySet";
import DailySetResult from "./pages/DailySetResult";
import Leaderboard from "./pages/Leaderboard";

// 라우트 배열에서 daily-challenge → daily-set redirect + 신규 라우트 추가
{
  path: "daily-challenge",
  element: <Navigate to="/daily-set" replace />,
},
{
  path: "daily-set",
  element: <DailySet />,
},
{
  path: "daily-set/result",
  element: <DailySetResult />,
},
{
  path: "leaderboard",
  element: <Leaderboard />,
},
```

- [ ] **Step 2: `Home.tsx` 데일리 세트 카드 교체**

`useTodayQuestion` import를 `useDailySet`으로 교체:

```typescript
const { data: dailySet } = useDailySet();
```

기존 `today?.question` 블록을 아래로 교체:

```typescript
{dailySet?.questions && dailySet.questions.length > 0 ? (
  dailySet.alreadyCompleted ? (
    // 완료 상태
    <div className="h-full flex flex-col gap-2 rounded-xl p-5 cursor-default bg-[#F3F4F6] border border-border">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">오늘의 데일리 세트</p>
        <span className="flex items-center gap-1 text-xs font-semibold text-sem-success-text">
          <Check size={11} strokeWidth={3} />
          완료
        </span>
      </div>
      <p className="text-xs text-text-caption">
        {dailySet.correctCount !== null ? `${dailySet.correctCount} / ${dailySet.questions.length} 정답` : ""}
      </p>
      <Link to="/leaderboard" className="mt-auto">
        <span className="text-xs text-brand font-semibold">순위 확인하기 →</span>
      </Link>
    </div>
  ) : (
    // 미완료 상태
    <Link to="/daily-set" className="block">
      <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col gap-2 cursor-pointer hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
        <p className="text-sm text-text-secondary">오늘의 데일리 세트</p>
        <p className="text-sm text-text-primary">{dailySet.questions.length}문제 도전하기</p>
        <div className="flex items-center gap-2 mt-auto">
          <span className="badge-topic">{dailySet.questions[0]?.topicName}</span>
          <span className="text-xs text-text-caption">외 {dailySet.questions.length - 1}개 토픽</span>
        </div>
      </div>
    </Link>
  )
) : (
  <Link to="/questions" className="block">
    <div className="bg-surface-card border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col justify-center cursor-pointer hover:-translate-y-0.5 hover:border-brand transition-all duration-200">
      <p className="text-sm text-text-secondary">오늘의 데일리 세트</p>
      <p className="text-sm text-text-primary mt-1">오늘은 준비 중이에요</p>
    </div>
  </Link>
)}
```

`useHome.ts`에서 `useTodayQuestion` import도 제거.

- [ ] **Step 3: `useHome.ts`에서 `queryKey: ["todayQuestion"]` 관련 `refetchQueries` 호출을 `["dailySet"]`으로 변경**

프로젝트 전체에서 `todayQuestion` queryKey 참조를 검색:

```bash
grep -rn "todayQuestion" client/src/
```

발견된 모든 위치에서 `"dailySet"`으로 교체.

- [ ] **Step 4: 커밋**

```bash
git add client/src/App.tsx \
        client/src/pages/Home.tsx \
        client/src/hooks/useHome.ts
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : feat : 홈 화면 카드 및 라우팅 연결 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## Task 9: 빌드 검증

**Files:** (변경 없음, 빌드 및 타입 체크만)

- [ ] **Step 1: 서버 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:build -x test
```

Expected: `BUILD SUCCESSFUL`

오류 발생 시 컴파일 에러 메시지 기준으로 수정.

- [ ] **Step 2: 클라이언트 타입 체크**

```bash
cd client && npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 3: `TodayQuestionResponse` 타입 참조 정리**

```bash
grep -rn "TodayQuestionResponse\|alreadySolvedToday\|todayQuestion\|fetchTodayQuestion" client/src/
```

남은 참조가 있으면 제거하거나 새 타입으로 교체.

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "AI 문제 풀기 — 오늘의 데일리 세트 기능 추가 : fix : 빌드 오류 수정 및 레거시 참조 정리 https://github.com/passQL-Lab/passQL/issues/304"
```

---

## 자체 검토

**Spec 커버리지 체크:**
- ✅ `daily_challenge` 테이블 `sort_order` 추가 + 유니크 변경 → Task 1
- ✅ `daily_set_submission` 테이블 신규 → Task 1
- ✅ 10문제 폴백 선정 (토픽 round-robin) → Task 3
- ✅ 회원별 결정론적 셔플 → Task 3 (`HomeService`)
- ✅ `GET /daily-set/today` → Task 4
- ✅ `POST /daily-set/complete` → Task 4
- ✅ `GET /daily-set/leaderboard` → Task 4
- ✅ 홈 카드 교체 → Task 8
- ✅ `/daily-challenge` → `/daily-set` redirect → Task 8
- ✅ `DailySet.tsx` PracticeSet 방식 → Task 6
- ✅ `DailySetResult.tsx` 결과 + 리더보드 미니카드 → Task 7
- ✅ `Leaderboard.tsx` 전체 순위 → Task 7
- ✅ 관리자 UI 자동 배정 → Task 4
- ✅ 완료 후 `/daily-set` 접근 시 result redirect → Task 6

**타입 일관성:**
- `DailySetTodayResponse` — Task 5에서 정의, Task 6/8에서 사용 ✅
- `DailySetCompleteResponse` — Task 5에서 정의, Task 4에서 반환 ✅
- `LeaderboardResponse` — Task 5에서 정의, Task 7에서 사용 ✅
- `useDailySet()` — Task 5에서 정의, Task 6/8에서 사용 ✅
- `useLeaderboard()` — Task 5에서 정의, Task 7에서 사용 ✅
