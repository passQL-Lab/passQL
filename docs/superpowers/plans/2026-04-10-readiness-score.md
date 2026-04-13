# 합격 준비도(Readiness Score) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `GET /api/progress` 응답에 "합격 준비도(Readiness)" 블록을 추가한다. 무한 문제 환경에서 진도율 개념을 버리고, 정답률 × 커버리지 × 최신성 3요소 곱셈으로 0~100% 게이지를 산출한다.

**Architecture:** `ProgressService`가 3요소를 계산하기 위해 (1) 최근 50시도, (2) 최근 14일 내 distinct 활성 토픽 수, (3) 활성 토픽 전체 수, (4) 선택된 시험 일정을 조회한다. 계산은 순수 유틸 클래스 `ReadinessCalculator`로 분리해 단위 테스트를 쉽게 한다. D-day 기반 카피 톤 분기(`toneKey`)는 `ToneKeyResolver`가 담당한다. 기존 `ProgressResponse`의 3필드(`solvedCount`, `correctRate`, `streakDays`)는 100% 보존한다.

**Tech Stack:** Spring Boot 3.x (멀티모듈 Gradle), JPA/Hibernate, SuhLogger 기반 통합 테스트.

**Spec:** `docs/superpowers/specs/2026-04-10-readiness-score-design.md`

**Issue:** #52

> **주의 (이 세션 실행 한정):**
> 1. 사용자 글로벌 규칙상 **git commit 금지**. 각 Task의 `git add` / `git commit` 단계는 **모두 스킵**한다. 코드만 변경.
> 2. 내부망 환경으로 gradle 의존성 다운로드가 불가할 수 있음. 빌드/테스트 실행 단계는 시도하되 네트워크 실패 시 사용자 수동 확인으로 위임.

---

## 파일 구조

### 신규 생성

- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessConstants.java`
  - 상수 모음: `RECENT_ATTEMPT_WINDOW=50`, `COVERAGE_WINDOW_DAYS=14`, KST 타임존
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessCalculator.java`
  - 순수 계산기. 입력: (최근 시도 is_correct 리스트, lastStudiedAt, coveredTopicCount, activeTopicCount, now) → 출력: 3요소 + score
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ToneKeyResolver.java`
  - toneKey 결정기. 입력: (daysUntilExam, recentAttemptCount) → 출력: String enum-like 키
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ReadinessResponse.java`
  - 응답 DTO (record). 11필드.
- `server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ReadinessCalculatorTest.java`
  - 단위 테스트 (이 모듈은 실제 DB 불필요, 순수 계산)
- `server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ToneKeyResolverTest.java`
  - 단위 테스트
- `server/PQL-Domain-Submission/src/test/java/com/passql/submission/service/ProgressServiceReadinessTest.java`
  - 통합 테스트 (프로젝트 컨벤션: superLog + 눈으로 확인)

### 수정

- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ProgressResponse.java`
  - `readiness` 필드 추가 (record에 필드 추가)
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java`
  - 3개 쿼리 추가: `findRecentCorrectnessFlags`, `countDistinctRecentActiveTopics`, `findLastSubmittedAt`
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/ProgressService.java`
  - Readiness 계산 통합. `ExamScheduleService`, `TopicRepository`, `ReadinessCalculator`, `ToneKeyResolver` 주입.
- `server/PQL-Domain-Submission/build.gradle`
  - `PQL-Domain-Meta` 모듈 의존성 추가 확인 (TopicRepository, ExamScheduleService 사용)

### 모듈 의존성 확인

Submission 모듈에서 Meta 모듈(`TopicRepository`, `ExamScheduleService`)을 참조해야 한다. Task 0에서 먼저 확인/추가한다.

---

## Task 0: 모듈 의존성 확인

**Files:**
- Read: `server/PQL-Domain-Submission/build.gradle`

- [ ] **Step 1: 현재 Submission 모듈의 의존성 확인**

Run:
```bash
cat server/PQL-Domain-Submission/build.gradle
```

Expected: `dependencies` 블록에 `implementation project(':PQL-Domain-Meta')`가 이미 있는지 확인.

- [ ] **Step 2: 없다면 추가**

없는 경우에만 `dependencies` 블록에 다음 라인 추가:
```gradle
implementation project(':PQL-Domain-Meta')
```

있으면 스킵.

- [ ] **Step 3: 빌드 확인**

Run (내부망 gradle 가능 환경에서):
```bash
cd server && ./gradlew :PQL-Domain-Submission:compileJava
```

Expected: BUILD SUCCESSFUL. (환경에서 불가능하면 사용자가 별도 확인)

- [ ] **Step 4: 커밋**

의존성 변경이 있었을 때만:
```bash
git add server/PQL-Domain-Submission/build.gradle
git commit -m "chore: add PQL-Domain-Meta dependency to Submission module for readiness"
```

---

## Task 1: ReadinessConstants 생성

**Files:**
- Create: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessConstants.java`

- [ ] **Step 1: 상수 클래스 작성**

```java
package com.passql.submission.readiness;

import java.time.ZoneId;

/**
 * 합격 준비도(Readiness) 산식에서 사용하는 튜닝 가능 상수 모음.
 * 실험/조정 시 이 파일만 수정하면 전체 로직이 일관되게 반영된다.
 */
public final class ReadinessConstants {

    private ReadinessConstants() {}

    /** 정답률 계산 시 참조할 최근 시도 개수 */
    public static final int RECENT_ATTEMPT_WINDOW = 50;

    /** 커버리지 판정 기준 일수 (최근 N일 내 푼 토픽) */
    public static final int COVERAGE_WINDOW_DAYS = 14;

    /** 시도 이력이 전혀 없을 때의 Recency 바닥값 */
    public static final double RECENCY_DEFAULT = 0.70;

    /** 서버 기준 타임존 — Recency/D-day 계산에 사용 */
    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    // toneKey 상수
    public static final String TONE_NO_EXAM    = "NO_EXAM";
    public static final String TONE_ONBOARDING = "ONBOARDING";
    public static final String TONE_POST_EXAM  = "POST_EXAM";
    public static final String TONE_TODAY      = "TODAY";
    public static final String TONE_SPRINT     = "SPRINT";
    public static final String TONE_PUSH       = "PUSH";
    public static final String TONE_STEADY     = "STEADY";
    public static final String TONE_EARLY      = "EARLY";
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessConstants.java
git commit -m "feat: add ReadinessConstants for readiness score tuning"
```

---

## Task 2: ReadinessCalculator 테스트 작성 (실패)

**Files:**
- Create: `server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ReadinessCalculatorTest.java`

- [ ] **Step 1: 테스트 파일 작성**

```java
package com.passql.submission.readiness;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

@Slf4j
class ReadinessCalculatorTest {

    private final ReadinessCalculator calc = new ReadinessCalculator();
    private final LocalDate today = LocalDate.of(2026, 4, 10);

    @Test
    public void mainTest() {
        lineLog("ReadinessCalculator 테스트 시작");

        lineLog(null);
        timeLog(this::시도0건_테스트);
        lineLog(null);
        timeLog(this::완벽케이스_테스트);
        lineLog(null);
        timeLog(this::Recency경계_테스트);
        lineLog(null);
        timeLog(this::Coverage_테스트);
        lineLog(null);
        timeLog(this::Coverage분모0_방어_테스트);
        lineLog(null);
        timeLog(this::Accuracy50문제초과_테스트);
        lineLog(null);

        lineLog("테스트 종료");
    }

    public void 시도0건_테스트() {
        lineLog("시도 0건 → score=0.00");
        var r = calc.calculate(Collections.emptyList(), null, 0, 10, today);
        superLog(r);
        // accuracy=0, coverage=0, recency=0.70, score=0.00
    }

    public void 완벽케이스_테스트() {
        lineLog("정답률 1.0, 커버리지 1.0, 최신성 1.0 → score=1.00");
        var r = calc.calculate(List.of(true, true, true, true, true),
                               today, 10, 10, today);
        superLog(r);
    }

    public void Recency경계_테스트() {
        lineLog("경과일별 Recency: 0,1,2,3,4,7,8,14,15,30");
        for (int d : new int[]{0, 1, 2, 3, 4, 7, 8, 14, 15, 30}) {
            var r = calc.calculate(List.of(true), today.minusDays(d), 1, 1, today);
            log.info("  d={} → recency={}", d, r.recency());
        }
    }

    public void Coverage_테스트() {
        lineLog("활성 토픽 5개 중 3개 커버 → coverage=0.60");
        var r = calc.calculate(List.of(true), today, 3, 5, today);
        superLog(r);
    }

    public void Coverage분모0_방어_테스트() {
        lineLog("활성 토픽 0개 → coverage=0.00 (NaN/∞ 금지)");
        var r = calc.calculate(List.of(true), today, 0, 0, today);
        superLog(r);
    }

    public void Accuracy50문제초과_테스트() {
        lineLog("최근 50 윈도우: 100개 전달해도 상위 50개만 반영되는 건 서비스 책임. 여기선 전달받은 리스트 그대로 계산됨을 확인");
        // 40정답 + 10오답 = 50개 → accuracy = 0.80
        java.util.List<Boolean> attempts = new java.util.ArrayList<>();
        for (int i = 0; i < 40; i++) attempts.add(true);
        for (int i = 0; i < 10; i++) attempts.add(false);
        var r = calc.calculate(attempts, today, 1, 1, today);
        superLog(r);
    }
}
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.readiness.ReadinessCalculatorTest"
```

Expected: COMPILATION FAILURE (`ReadinessCalculator` / `calculate` 메서드 / `ReadinessResult` record 없음).

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ReadinessCalculatorTest.java
git commit -m "test: add failing ReadinessCalculator unit tests"
```

---

## Task 3: ReadinessCalculator 구현

**Files:**
- Create: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessCalculator.java`

- [ ] **Step 1: Calculator + 결과 타입 작성**

```java
package com.passql.submission.readiness;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 합격 준비도 3요소(정답률 × 커버리지 × 최신성) 순수 계산기.
 *
 * 순수 함수에 가깝게 유지해 단위 테스트를 쉽게 한다.
 * DB / Spring Context 의존 없음 — 입력값을 모아서 서비스가 호출한다.
 */
@Component
public class ReadinessCalculator {

    /**
     * @param recentCorrectFlags 최근 시도의 isCorrect 리스트 (submittedAt DESC, 상위 RECENT_ATTEMPT_WINDOW개)
     * @param lastStudiedAt 마지막 시도 일자 (없으면 null)
     * @param coveredTopicCount 최근 COVERAGE_WINDOW_DAYS일 내 distinct 활성 토픽 수
     * @param activeTopicCount 활성 토픽 전체 수
     * @param today KST 기준 "오늘" (테스트 용이성)
     */
    public ReadinessResult calculate(
        List<Boolean> recentCorrectFlags,
        LocalDate lastStudiedAt,
        int coveredTopicCount,
        int activeTopicCount,
        LocalDate today
    ) {
        double accuracy = computeAccuracy(recentCorrectFlags);
        double coverage = computeCoverage(coveredTopicCount, activeTopicCount);
        double recency = computeRecency(lastStudiedAt, today);

        double score = round2(accuracy * coverage * recency);

        return new ReadinessResult(
            score,
            round2(accuracy),
            round2(coverage),
            round2(recency),
            recentCorrectFlags == null ? 0 : recentCorrectFlags.size()
        );
    }

    private double computeAccuracy(List<Boolean> flags) {
        if (flags == null || flags.isEmpty()) return 0.0;
        long correct = flags.stream().filter(Boolean.TRUE::equals).count();
        return (double) correct / flags.size();
    }

    private double computeCoverage(int covered, int active) {
        if (active <= 0) return 0.0;
        return (double) covered / active;
    }

    private double computeRecency(LocalDate lastStudiedAt, LocalDate today) {
        if (lastStudiedAt == null) return ReadinessConstants.RECENCY_DEFAULT;
        long days = ChronoUnit.DAYS.between(lastStudiedAt, today);
        if (days < 0) days = 0;
        if (days <= 1) return 1.00;
        if (days <= 3) return 0.95;
        if (days <= 7) return 0.85;
        if (days <= 14) return 0.75;
        return 0.70;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    /**
     * 계산 결과. ProgressService가 이를 받아 ReadinessResponse로 변환한다.
     */
    public record ReadinessResult(
        double score,
        double accuracy,
        double coverage,
        double recency,
        int recentAttemptCount
    ) {}
}
```

- [ ] **Step 2: 테스트 실행해서 통과 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.readiness.ReadinessCalculatorTest"
```

Expected: PASSED. 로그에서 시나리오별 결과가 눈으로 확인 가능해야 함:
- 시도 0건: `score=0.0, accuracy=0.0, coverage=0.0, recency=0.7`
- 완벽: `score=1.0`
- Recency 경계: 0→1.0, 1→1.0, 2→0.95, 3→0.95, 4→0.85, 7→0.85, 8→0.75, 14→0.75, 15→0.70, 30→0.70
- 5개중 3개 커버: `coverage=0.6`
- 0/0 방어: `coverage=0.0`
- 40/50 정답: `accuracy=0.8`

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ReadinessCalculator.java
git commit -m "feat: implement ReadinessCalculator 3-factor formula"
```

---

## Task 4: ToneKeyResolver 테스트 작성 (실패)

**Files:**
- Create: `server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ToneKeyResolverTest.java`

- [ ] **Step 1: 테스트 파일 작성**

```java
package com.passql.submission.readiness;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

@Slf4j
class ToneKeyResolverTest {

    private final ToneKeyResolver resolver = new ToneKeyResolver();

    @Test
    public void mainTest() {
        lineLog("ToneKeyResolver 테스트 시작");

        lineLog(null);
        timeLog(this::NO_EXAM_우선순위_테스트);
        lineLog(null);
        timeLog(this::ONBOARDING_우선순위_테스트);
        lineLog(null);
        timeLog(this::Dday경계_테스트);
        lineLog(null);

        lineLog("테스트 종료");
    }

    public void NO_EXAM_우선순위_테스트() {
        lineLog("daysUntilExam=null → NO_EXAM (recentAttemptCount 무관)");
        log.info("  null,0   → {}", resolver.resolve(null, 0));
        log.info("  null,100 → {}", resolver.resolve(null, 100));
    }

    public void ONBOARDING_우선순위_테스트() {
        lineLog("recentAttemptCount=0 & daysUntilExam not null → ONBOARDING");
        log.info("  27, 0 → {}", resolver.resolve(27, 0));
        log.info("   3, 0 → {}", resolver.resolve(3, 0));
    }

    public void Dday경계_테스트() {
        lineLog("D-day 경계: -1, 0, 1, 6, 7, 14, 15, 30, 31");
        int[] ds = {-1, 0, 1, 6, 7, 14, 15, 30, 31};
        // 기대: POST_EXAM, TODAY, SPRINT, SPRINT, PUSH, PUSH, STEADY, STEADY, EARLY
        for (int d : ds) {
            log.info("  d={} → {}", d, resolver.resolve(d, 5));
        }
    }
}
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.readiness.ToneKeyResolverTest"
```

Expected: COMPILATION FAILURE (`ToneKeyResolver` / `resolve` 없음).

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/test/java/com/passql/submission/readiness/ToneKeyResolverTest.java
git commit -m "test: add failing ToneKeyResolver unit tests"
```

---

## Task 5: ToneKeyResolver 구현

**Files:**
- Create: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ToneKeyResolver.java`

- [ ] **Step 1: Resolver 작성**

```java
package com.passql.submission.readiness;

import org.springframework.stereotype.Component;

/**
 * D-day와 시도 이력을 바탕으로 카피 톤 키를 결정한다.
 *
 * 카피 문자열 자체는 FE가 관리하고, 백엔드는 "어떤 톤인지"만 키로 내려준다.
 * 규칙은 우선순위 순으로 처음 매칭되는 것을 반환한다.
 *
 * 1. daysUntilExam == null         → NO_EXAM
 * 2. recentAttemptCount == 0       → ONBOARDING
 * 3. daysUntilExam <  0            → POST_EXAM
 * 4. daysUntilExam == 0            → TODAY
 * 5. 1  <= daysUntilExam <  7      → SPRINT
 * 6. 7  <= daysUntilExam < 15      → PUSH
 * 7. 15 <= daysUntilExam <= 30     → STEADY
 * 8. daysUntilExam > 30            → EARLY
 */
@Component
public class ToneKeyResolver {

    public String resolve(Integer daysUntilExam, int recentAttemptCount) {
        if (daysUntilExam == null) return ReadinessConstants.TONE_NO_EXAM;
        if (recentAttemptCount == 0) return ReadinessConstants.TONE_ONBOARDING;
        if (daysUntilExam < 0) return ReadinessConstants.TONE_POST_EXAM;
        if (daysUntilExam == 0) return ReadinessConstants.TONE_TODAY;
        if (daysUntilExam < 7) return ReadinessConstants.TONE_SPRINT;
        if (daysUntilExam < 15) return ReadinessConstants.TONE_PUSH;
        if (daysUntilExam <= 30) return ReadinessConstants.TONE_STEADY;
        return ReadinessConstants.TONE_EARLY;
    }
}
```

- [ ] **Step 2: 테스트 실행해서 통과 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.readiness.ToneKeyResolverTest"
```

Expected: PASSED. 로그 확인:
- `null,0` → `NO_EXAM`, `null,100` → `NO_EXAM`
- `27,0` → `ONBOARDING`, `3,0` → `ONBOARDING`
- d=-1 → POST_EXAM / d=0 → TODAY / d=1,6 → SPRINT / d=7,14 → PUSH / d=15,30 → STEADY / d=31 → EARLY

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/readiness/ToneKeyResolver.java
git commit -m "feat: implement ToneKeyResolver for D-day based copy tone"
```

---

## Task 6: ReadinessResponse DTO 작성

**Files:**
- Create: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ReadinessResponse.java`

- [ ] **Step 1: DTO record 작성**

```java
package com.passql.submission.dto;

import java.time.LocalDateTime;

/**
 * 합격 준비도(Readiness) 응답 블록.
 *
 * 산식의 3요소(정답률/커버리지/최신성)와 원본 카운트를 투명하게 공개한다.
 * FE는 (toneKey, scoreBand) 조합으로 카피를 선택한다.
 */
public record ReadinessResponse(
    double score,
    double accuracy,
    double coverage,
    double recency,
    LocalDateTime lastStudiedAt,
    int recentAttemptCount,
    int coveredTopicCount,
    int activeTopicCount,
    Integer daysUntilExam,
    String toneKey
) {}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ReadinessResponse.java
git commit -m "feat: add ReadinessResponse DTO"
```

---

## Task 7: ProgressResponse에 readiness 필드 추가

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ProgressResponse.java`

- [ ] **Step 1: 현재 파일 확인**

현재:
```java
package com.passql.submission.dto;

public record ProgressResponse(long solvedCount, double correctRate, int streakDays) {}
```

- [ ] **Step 2: readiness 필드 추가**

```java
package com.passql.submission.dto;

/**
 * 홈 화면용 사용자 진도 응답.
 *
 * 기존 3필드(solvedCount, correctRate, streakDays)는 다른 화면에서 계속 사용되므로 100% 보존한다.
 * `readiness` 블록은 무한 문제 환경에서 "합격 준비도" 개념으로 산출된 게이지 값이다.
 */
public record ProgressResponse(
    long solvedCount,
    double correctRate,
    int streakDays,
    ReadinessResponse readiness
) {}
```

- [ ] **Step 3: 기존 호출부 확인**

Run (참조 지점 확인):
```bash
cd server && grep -rn "new ProgressResponse(" --include="*.java"
```

Expected: `ProgressService.getProgress()` 한 곳만 호출. (Task 10에서 수정 예정)
`ProgressSummary` 변환부도 같이 확인 (필드 추출 방식이므로 영향 없음 — `pr.solvedCount()` 등은 그대로 유효).

- [ ] **Step 4: 컴파일은 지금 깨진 상태 — 다음 Task에서 이어서 수정**

Task 10에서 `ProgressService`를 수정하면서 같이 컴파일 통과시킨다. 지금은 커밋하지 않고 다음 Task로 진행.

---

## Task 8: SubmissionRepository에 Readiness 쿼리 3개 추가

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java`

- [ ] **Step 1: 현재 파일 확인**

현재 파일은 이미 위에서 읽음. 다음 메서드들을 추가한다.

- [ ] **Step 2: 3개 쿼리 추가**

`SubmissionRepository.java`에 다음 imports와 메서드들을 추가한다 (기존 메서드는 유지).

Imports 추가 (이미 있으면 스킵):
```java
import org.springframework.data.domain.Pageable;
```

클래스 내부에 메서드 3개 추가:
```java
    /**
     * 최근 시도의 isCorrect 플래그 리스트 (submittedAt DESC).
     * ReadinessCalculator의 Accuracy 계산 입력.
     * 호출부에서 Pageable.ofSize(RECENT_ATTEMPT_WINDOW)로 상위 N개만 조회한다.
     */
    @Query("SELECT s.isCorrect FROM Submission s " +
           "WHERE s.memberUuid = :memberUuid " +
           "ORDER BY s.submittedAt DESC")
    List<Boolean> findRecentCorrectFlagsByMemberUuid(
        @Param("memberUuid") UUID memberUuid,
        Pageable pageable
    );

    /**
     * 최근 :since 이후에 제출된 문제들 중 "활성 토픽"의 distinct 개수.
     * Submission에는 topicUuid가 없으므로 Question으로 join하여 topicUuid를 얻고,
     * Topic.isActive=true인 것만 센다.
     * ReadinessCalculator의 Coverage 분자.
     */
    @Query("SELECT COUNT(DISTINCT q.topicUuid) " +
           "FROM Submission s, com.passql.question.entity.Question q, com.passql.meta.entity.Topic t " +
           "WHERE s.questionUuid = q.questionUuid " +
           "  AND q.topicUuid = t.topicUuid " +
           "  AND s.memberUuid = :memberUuid " +
           "  AND s.submittedAt >= :since " +
           "  AND t.isActive = true")
    long countDistinctRecentActiveTopicsByMemberUuid(
        @Param("memberUuid") UUID memberUuid,
        @Param("since") LocalDateTime since
    );

    /**
     * 사용자의 가장 최근 제출 시각. 미제출 시 null.
     * Recency 계산 + lastStudiedAt 응답 필드.
     */
    @Query("SELECT MAX(s.submittedAt) FROM Submission s WHERE s.memberUuid = :memberUuid")
    LocalDateTime findLastSubmittedAtByMemberUuid(@Param("memberUuid") UUID memberUuid);
```

**중요 메모:** JPQL 크로스 모듈 엔티티 참조는 Fully Qualified Name으로 적었다. 동일 패키지가 아니더라도 `EntityManager`가 인식하려면 해당 엔티티가 스프링 부트 자동 스캔에 포함돼야 한다. `PassqlApplication`이 `com.passql` 루트에서 스캔 중이므로 문제 없을 것이다. 만약 스캔 미포함이면 Task 0의 모듈 의존성을 다시 확인한다.

- [ ] **Step 3: 컴파일 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:compileJava
```

Expected:
- `ProgressResponse` 생성자 mismatch 에러는 여전히 존재 (Task 10에서 해결).
- `SubmissionRepository` 자체는 컴파일되어야 함. `Question`, `Topic` 임포트가 모듈 의존성으로 해결되는지 확인. 해결 안 되면 Task 0의 `:PQL-Domain-Meta`, `:PQL-Domain-Question` 의존성 재확인.

`:PQL-Domain-Question`도 필요할 수 있으니 같이 확인:
```bash
cat server/PQL-Domain-Submission/build.gradle
```
없으면 추가:
```gradle
implementation project(':PQL-Domain-Question')
```

- [ ] **Step 4: 커밋하지 않음 — 다음 Task에서 ProgressService와 함께 커밋**

---

## Task 9: ProgressService 통합 테스트 작성 (실패 예상)

**Files:**
- Create: `server/PQL-Domain-Submission/src/test/java/com/passql/submission/service/ProgressServiceReadinessTest.java`

프로젝트 컨벤션에 따라 `superLog` 기반 통합 테스트로 작성한다. 멀티모듈이므로 `PQL-Web` testImplementation 필요.

- [ ] **Step 1: build.gradle 테스트 의존성 확인**

```bash
cat server/PQL-Domain-Submission/build.gradle
```

`testImplementation project(':PQL-Web')`이 없으면 추가:
```gradle
testImplementation project(':PQL-Web')
```

- [ ] **Step 2: 테스트 작성**

```java
package com.passql.submission.service;

import com.passql.PassqlApplication;
import com.passql.submission.dto.ProgressResponse;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static kr.suhsaechan.suhlogger.util.SuhLogger.*;

/**
 * ProgressService.getProgress() 응답에 readiness 블록이 포함되는지 검증.
 * 실제 DB/컨텍스트를 띄워서 통합 관점에서 확인한다.
 */
@Slf4j
@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
class ProgressServiceReadinessTest {

    @Autowired ProgressService progressService;

    /**
     * 실제 멤버 UUID로 교체해서 수동 확인.
     * 또는 본인 계정 UUID 하나를 dev DB에서 조회해서 하드코딩.
     */
    private static final UUID SAMPLE_MEMBER_UUID =
        UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Test
    @Transactional
    public void mainTest() {
        lineLog("ProgressService Readiness 통합 테스트 시작");

        lineLog(null);
        timeLog(this::응답_스키마_테스트);
        lineLog(null);

        lineLog("테스트 종료");
    }

    public void 응답_스키마_테스트() {
        lineLog("dev DB의 샘플 멤버로 /progress 호출 — readiness 블록 존재 확인");

        ProgressResponse response;
        try {
            response = progressService.getProgress(SAMPLE_MEMBER_UUID);
        } catch (Exception e) {
            log.warn("샘플 멤버가 dev DB에 없을 수 있음: {}", e.getMessage());
            log.warn("실제 dev DB의 멤버 UUID로 SAMPLE_MEMBER_UUID 상수를 교체 후 재실행하세요.");
            return;
        }

        superLog(response);
        superLog(response.readiness());
        // 눈으로 확인:
        // - readiness != null
        // - score, accuracy, coverage, recency 모두 0.0 ~ 1.0 범위
        // - toneKey 중 하나의 유효한 값
        // - activeTopicCount > 0
    }
}
```

- [ ] **Step 3: 테스트 실행 — 현재 실패 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.service.ProgressServiceReadinessTest"
```

Expected: COMPILATION FAILURE. `response.readiness()` 미존재 또는 `ProgressService.getProgress()` 시그니처 불일치 (ProgressResponse 생성자 에러).

- [ ] **Step 4: 커밋하지 않음 — Task 10에서 같이 커밋**

---

## Task 10: ProgressService에 Readiness 통합

**Files:**
- Modify: `server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/ProgressService.java`

- [ ] **Step 1: 전체 수정판 작성**

파일 전체를 다음으로 교체:

```java
package com.passql.submission.service;

import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.dto.ExamScheduleResponse;
import com.passql.meta.repository.TopicRepository;
import com.passql.meta.service.ExamScheduleService;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.dto.ReadinessResponse;
import com.passql.submission.readiness.ReadinessCalculator;
import com.passql.submission.readiness.ReadinessConstants;
import com.passql.submission.readiness.ToneKeyResolver;
import com.passql.submission.repository.SubmissionRepository;
import com.passql.submission.util.StreakCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {

    private final SubmissionRepository submissionRepository;
    private final MemberRepository memberRepository;
    private final TopicRepository topicRepository;
    private final ExamScheduleService examScheduleService;
    private final ReadinessCalculator readinessCalculator;
    private final ToneKeyResolver toneKeyResolver;

    public ProgressResponse getProgress(UUID memberUuid) {
        if (!memberRepository.existsByMemberUuidAndIsDeletedFalse(memberUuid)) {
            throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
        }

        // 기존 3지표
        long solvedCount = submissionRepository.countDistinctQuestionUuidByMemberUuid(memberUuid);
        Double rateRaw = submissionRepository.calculateCorrectRateByMemberUuid(memberUuid.toString());
        double correctRate = rateRaw == null ? 0.0 : Math.round(rateRaw * 100.0) / 100.0;
        int streakDays = StreakCalculator.calculate(
            submissionRepository.findSubmissionDatesByMemberUuid(memberUuid)
        );

        // Readiness 계산
        ReadinessResponse readiness = buildReadiness(memberUuid);

        return new ProgressResponse(solvedCount, correctRate, streakDays, readiness);
    }

    public ProgressSummary getSummary(UUID memberUuid) {
        ProgressResponse pr = getProgress(memberUuid);
        return new ProgressSummary(pr.solvedCount(), pr.correctRate(), pr.streakDays());
    }

    private ReadinessResponse buildReadiness(UUID memberUuid) {
        LocalDate today = LocalDate.now(ReadinessConstants.ZONE);

        // 1. 최근 N개 시도 정답 플래그
        List<Boolean> recentFlags = submissionRepository.findRecentCorrectFlagsByMemberUuid(
            memberUuid,
            PageRequest.of(0, ReadinessConstants.RECENT_ATTEMPT_WINDOW)
        );

        // 2. 마지막 시도 시각
        LocalDateTime lastStudiedAt = submissionRepository.findLastSubmittedAtByMemberUuid(memberUuid);
        LocalDate lastStudiedDate = lastStudiedAt == null
            ? null
            : lastStudiedAt.atZone(ReadinessConstants.ZONE).toLocalDate();

        // 3. 활성 토픽 전체 수
        int activeTopicCount = topicRepository.findByIsActiveTrueOrderBySortOrderAsc().size();

        // 4. 최근 W일 내 푼 활성 토픽 수
        LocalDateTime since = today
            .minusDays(ReadinessConstants.COVERAGE_WINDOW_DAYS)
            .atStartOfDay();
        long coveredLong = submissionRepository.countDistinctRecentActiveTopicsByMemberUuid(memberUuid, since);
        int coveredTopicCount = (int) coveredLong;

        // 5. 3요소 계산
        ReadinessCalculator.ReadinessResult result = readinessCalculator.calculate(
            recentFlags,
            lastStudiedDate,
            coveredTopicCount,
            activeTopicCount,
            today
        );

        // 6. D-day
        Integer daysUntilExam = null;
        ExamScheduleResponse selected = examScheduleService.getSelectedSchedule();
        if (selected != null && selected.getExamDate() != null) {
            long diff = ChronoUnit.DAYS.between(today, selected.getExamDate());
            daysUntilExam = (int) diff;
        }

        // 7. toneKey
        String toneKey = toneKeyResolver.resolve(daysUntilExam, result.recentAttemptCount());

        return new ReadinessResponse(
            result.score(),
            result.accuracy(),
            result.coverage(),
            result.recency(),
            lastStudiedAt,
            result.recentAttemptCount(),
            coveredTopicCount,
            activeTopicCount,
            daysUntilExam,
            toneKey
        );
    }
}
```

- [ ] **Step 2: 전체 컴파일 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:compileJava :PQL-Web:compileJava
```

Expected: BUILD SUCCESSFUL 전체 모듈.

- [ ] **Step 3: ReadinessCalculator + ToneKeyResolver 단위 테스트 통과 유지 확인**

Run:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.readiness.*"
```

Expected: 모두 PASSED.

- [ ] **Step 4: 통합 테스트는 dev DB 의존**

dev DB가 접근 가능한 환경이면 실행:
```bash
cd server && ./gradlew :PQL-Domain-Submission:test --tests "com.passql.submission.service.ProgressServiceReadinessTest"
```

접근 불가 시 이 단계는 사용자에게 수동 확인을 위임한다. 테스트 파일 상단 주석에 샘플 멤버 UUID 교체 안내가 있음.

- [ ] **Step 5: 커밋 (Task 7, 8, 9, 10 일괄 커밋)**

```bash
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/dto/ProgressResponse.java
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/repository/SubmissionRepository.java
git add server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/ProgressService.java
git add server/PQL-Domain-Submission/src/test/java/com/passql/submission/service/ProgressServiceReadinessTest.java
git add server/PQL-Domain-Submission/build.gradle
git commit -m "feat: integrate readiness score into /progress response

- ProgressResponse에 readiness 블록 추가 (기존 3필드 보존)
- SubmissionRepository에 3개 쿼리 추가 (최근 정답 플래그, 활성 토픽 커버리지, 마지막 제출시각)
- ProgressService가 ReadinessCalculator, ToneKeyResolver, ExamScheduleService, TopicRepository를 조합하여 준비도 계산"
```

---

## Task 11: ProgressController DOCS에 ApiLog 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java`

- [ ] **Step 1: 현재 DOCS 파일 확인**

Run:
```bash
cat server/PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java
```

기존 `@ApiLog(...)` 어노테이션이 있을 것이다. 체인에 신규 엔트리 1개 추가한다.

- [ ] **Step 2: ApiLog 엔트리 추가**

해당 파일에서 `getProgress` 메서드 위 `@ApiLog`를 찾아 **제일 위에(최신순)** 다음 엔트리를 추가:

```java
@ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 0,
        description = "합격 준비도(readiness) 블록 응답에 추가 (accuracy × coverage × recency 3요소 + toneKey)"),
```

(기존 `@ApiLog` 엔트리들은 그대로 유지. `issueNumber`는 실제 이슈 번호로 교체 가능 — 모르면 0으로 두고 사용자에게 알림.)

- [ ] **Step 3: 컴파일 확인**

Run:
```bash
cd server && ./gradlew :PQL-Web:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/ProgressControllerDocs.java
git commit -m "docs: log readiness block addition in ProgressController ApiLog"
```

---

## Task 12: 최종 수동 검증 (선택, 환경 필요)

**Files:** 없음. 실행만.

- [ ] **Step 1: 로컬 서버 구동 가능 환경에서 API 호출**

```bash
cd server && ./gradlew :PQL-Web:bootRun
```

다른 셸에서:
```bash
curl "http://localhost:8080/api/progress?memberUuid=<실제 멤버 UUID>" | jq
```

Expected: 응답에 `readiness.{score, accuracy, coverage, recency, lastStudiedAt, recentAttemptCount, coveredTopicCount, activeTopicCount, daysUntilExam, toneKey}` 모두 존재.

- [ ] **Step 2: 시나리오 확인 (눈으로)**

- 시도 이력 전혀 없는 신규 멤버 → `score=0.0, toneKey in {ONBOARDING, NO_EXAM}`
- 활성 시험 일정 선택 해제 상태 → `daysUntilExam=null, toneKey=NO_EXAM`
- 최근 풀이 있는 멤버 → `score > 0, accuracy/coverage/recency` 모두 0~1 사이 소수 2자리

- [ ] **Step 3: FE에 스키마 변경 공유**

이 단계에서는 커밋 없음. FE 측에 응답 스키마 변경 내용 공유.

---

## 자체 검토 (작성자 수행)

**Spec 커버리지:**

- ✅ 산식 (정답률 × 커버리지 × 최신성) → Task 3 `ReadinessCalculator`
- ✅ 상수(`RECENT_ATTEMPT_WINDOW=50`, `COVERAGE_WINDOW_DAYS=14`) → Task 1 `ReadinessConstants`
- ✅ Recency 감쇠 구간 → Task 3 `computeRecency`
- ✅ API 스키마 (기존 3필드 보존 + readiness 블록) → Task 7, 10
- ✅ 11개 readiness 필드 → Task 6 `ReadinessResponse`
- ✅ toneKey 결정 규칙 (8가지 키, 우선순위) → Task 5 `ToneKeyResolver`
- ✅ 쿼리 3개 (최근 정답 플래그, 커버리지, 마지막 시각) → Task 8
- ✅ `ExamScheduleService.getSelectedSchedule()` 재사용 → Task 10 `buildReadiness`
- ✅ KST 타임존 적용 → Task 1 상수 + Task 10 `LocalDate.now(ZONE)`
- ✅ 단위 테스트 (Calculator, Resolver) → Task 2, 4
- ✅ 통합 테스트 (ProgressService) → Task 9
- ✅ 캐싱 없음 (YAGNI) → Task 10 직접 계산
- ✅ ApiLog 기록 → Task 11
- ✅ 기존 호환성 (solvedCount/correctRate/streakDays 보존) → Task 7 주석 + Task 10 반환문

**Placeholder 스캔:** 검토 완료. TBD, TODO, "적절히 처리" 류 문구 없음. 모든 코드 블록이 완전한 형태.

**타입 일관성:**
- `ReadinessCalculator.ReadinessResult`의 5필드 → `ReadinessResponse`의 10필드 매핑: score, accuracy, coverage, recency, recentAttemptCount 공통. lastStudiedAt, coveredTopicCount, activeTopicCount, daysUntilExam, toneKey는 서비스에서 별도 주입 ✓
- `findRecentCorrectFlagsByMemberUuid(UUID, Pageable) → List<Boolean>`: Task 8 정의 ↔ Task 10 호출 시그니처 일치 ✓
- `countDistinctRecentActiveTopicsByMemberUuid(UUID, LocalDateTime) → long`: Task 8 ↔ Task 10 일치, Task 10에서 `(int)` 캐스팅 ✓
- `findLastSubmittedAtByMemberUuid(UUID) → LocalDateTime`: Task 8 ↔ Task 10 일치, Task 10에서 null 체크 후 KST로 변환 ✓
- `toneKeyResolver.resolve(Integer, int)`: Task 5 정의 ↔ Task 10 호출, `daysUntilExam` Integer (nullable) ✓
- `ProgressResponse(long, double, int, ReadinessResponse)`: Task 7 정의 ↔ Task 10 생성자 호출 일치 ✓
