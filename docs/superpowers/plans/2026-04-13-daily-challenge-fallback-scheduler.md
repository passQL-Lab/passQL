# Daily Challenge 폴백 자동 저장 스케줄러 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 배정하지 않은 날짜의 폴백 오늘의 문제를 `daily_challenge` 테이블에 자동 저장하여 관리자 달력에서 모든 날짜의 문제가 보이도록 한다.

**Architecture:** 매일 자정 `@Scheduled` 스케줄러가 당일 배정이 없으면 폴백 결과를 DB에 저장한다. 스케줄러 실패 시 `resolveTodayQuestion()` 최초 조회 시점에 백업으로 저장한다. `AdminDailyChallengeService`에 공통 `confirmFallback()` 메서드를 추가하여 두 경로에서 재사용한다.

**Tech Stack:** Spring Boot, `@Scheduled`, JPA, `DailyChallengeRepository`

---

### Task 1: AdminDailyChallengeService에 confirmFallback() 메서드 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/AdminDailyChallengeService.java`

- [ ] **Step 1: `confirmFallback(LocalDate)` 메서드 작성**

`AdminDailyChallengeService.java`의 `unassign()` 메서드 아래에 추가한다:

```java
/**
 * 폴백 결과를 daily_challenge 테이블에 확정 저장한다.
 * 이미 배정된 날짜는 스킵한다. 활성 문제가 없으면 저장하지 않는다.
 * 스케줄러와 resolveTodayQuestion() 백업 경로에서 공통으로 사용한다.
 */
@Transactional
public void confirmFallback(LocalDate date) {
    // 이미 배정된 날짜면 스킵
    if (dailyChallengeRepository.findByChallengeDate(date).isPresent()) {
        return;
    }

    List<UUID> active = questionRepository.findActiveUuidsOrderedByCreatedAt();
    if (active.isEmpty()) {
        return;
    }

    long seed = date.toEpochDay();
    UUID pick = active.get((int) Math.floorMod(seed, active.size()));

    DailyChallenge dc = DailyChallenge.builder()
            .challengeDate(date)
            .questionUuid(pick)
            .build();
    dailyChallengeRepository.save(dc);
}
```

import 추가 (파일 상단에 없는 것만):
```java
import java.util.List;
```
(`List`는 이미 있으므로 확인 후 추가 생략 가능)

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

커밋 메시지 형식을 사용자에게 먼저 받을 것 (memory: 커밋 전 반드시 메시지 형식을 사용자에게 받기)

---

### Task 2: QuestionService.resolveTodayQuestion() 백업 저장 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionService.java`

- [ ] **Step 1: `AdminDailyChallengeService` 의존성 주입 추가**

`QuestionService`에 순환 참조 가능성 확인: `AdminDailyChallengeService`가 이미 `QuestionService`를 주입하고 있으므로 직접 주입하면 순환 참조 발생. 대신 `DailyChallengeRepository`와 `QuestionRepository`를 그대로 활용한다.

`resolveTodayQuestion()` 메서드를 아래와 같이 수정한다:

```java
/**
 * Resolve today's question (from DailyChallenge or deterministic fallback).
 * 폴백으로 선택된 경우 daily_challenge 테이블에 즉시 저장한다 (스케줄러 실패 백업).
 * Returns null if no active questions exist.
 */
@Transactional
public Question resolveTodayQuestion() {
    DailyChallenge dc = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).orElse(null);
    if (dc != null) {
        return questionRepository.findById(dc.getQuestionUuid()).orElse(null);
    }

    List<UUID> active = questionRepository.findActiveUuidsOrderedByCreatedAt();
    if (active.isEmpty()) {
        return null;
    }

    long seed = LocalDate.now().toEpochDay();
    UUID pick = active.get((int) Math.floorMod(seed, active.size()));

    // 폴백 결과를 DB에 저장 (스케줄러 실패 시 백업)
    DailyChallenge fallback = DailyChallenge.builder()
            .challengeDate(LocalDate.now())
            .questionUuid(pick)
            .build();
    dailyChallengeRepository.save(fallback);

    return questionRepository.findById(pick).orElse(null);
}
```

기존 클래스 레벨 `@Transactional(readOnly = true)`가 있으므로 메서드에 `@Transactional` 재선언 필수 (쓰기 트랜잭션).

- [ ] **Step 2: 컴파일 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Domain-Question:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: 커밋**

커밋 메시지 형식을 사용자에게 먼저 받을 것

---

### Task 3: DailyChallengeScheduler 신규 생성

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/scheduler/DailyChallengeScheduler.java`

- [ ] **Step 1: 스케줄러 클래스 생성**

```java
package com.passql.web.scheduler;

import com.passql.question.service.AdminDailyChallengeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyChallengeScheduler {

    private final AdminDailyChallengeService adminDailyChallengeService;

    /**
     * 매일 자정에 당일 daily_challenge 배정이 없으면 폴백 결과를 저장한다.
     * 활성 문제가 없는 경우 저장을 건너뛴다.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void confirmTodayChallenge() {
        LocalDate today = LocalDate.now();
        log.info("[DailyChallengeScheduler] 오늘의 챌린지 폴백 저장 시작: date={}", today);
        try {
            adminDailyChallengeService.confirmFallback(today);
            log.info("[DailyChallengeScheduler] 완료: date={}", today);
        } catch (Exception e) {
            // 스케줄러 실패 시 resolveTodayQuestion() 백업이 동작하므로 예외 삼킴
            log.error("[DailyChallengeScheduler] 폴백 저장 실패: date={}, error={}", today, e.getMessage(), e);
        }
    }
}
```

- [ ] **Step 2: `@EnableScheduling` 확인**

`PassqlApplication.java`에 이미 `@EnableScheduling`이 선언되어 있으므로 추가 작업 불필요.

```bash
grep -n "EnableScheduling" /Users/suhsaechan/Desktop/Programming/project/passQL/server/PQL-Web/src/main/java/com/passql/web/PassqlApplication.java
```

Expected: `@EnableScheduling` 라인 출력

- [ ] **Step 3: 전체 빌드 확인**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Web:compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

커밋 메시지 형식을 사용자에게 먼저 받을 것

---

### Task 4: 동작 검증 (통합 테스트)

**Files:**
- Create: `server/PQL-Domain-Question/src/test/java/com/passql/question/service/DailyChallengeSchedulerTest.java`

- [ ] **Step 1: 테스트 클래스 작성**

```java
package com.passql.question.service;

import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static kr.suhsaechan.suhlogger.util.SuhLogger.*;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class DailyChallengeSchedulerTest {

    @Autowired AdminDailyChallengeService adminDailyChallengeService;
    @Autowired QuestionService questionService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("DailyChallenge 폴백 저장 테스트 시작");

        lineLog(null);
        timeLog(this::폴백_저장_테스트);
        lineLog(null);

        timeLog(this::중복호출_스킵_테스트);

        lineLog(null);
        timeLog(this::resolveTodayQuestion_저장_테스트);

        lineLog("테스트 종료");
    }

    public void 폴백_저장_테스트() {
        lineLog("폴백 저장 — 오늘 날짜 배정 없는 상태에서 confirmFallback 호출");
        // 주의: @Transactional로 롤백되므로 실 DB 영향 없음
        adminDailyChallengeService.confirmFallback(LocalDate.now());
        var result = adminDailyChallengeService.getChallenges(LocalDate.now(), LocalDate.now());
        superLog(result);
    }

    public void 중복호출_스킵_테스트() {
        lineLog("이미 배정된 날짜 재호출 시 스킵 확인");
        adminDailyChallengeService.confirmFallback(LocalDate.now());
        adminDailyChallengeService.confirmFallback(LocalDate.now()); // 두 번 호출해도 오류 없어야 함
        var result = adminDailyChallengeService.getChallenges(LocalDate.now(), LocalDate.now());
        superLog(result);
    }

    public void resolveTodayQuestion_저장_테스트() {
        lineLog("resolveTodayQuestion 호출 후 daily_challenge 저장 확인");
        var question = questionService.resolveTodayQuestion();
        superLog(question);
        var challenges = adminDailyChallengeService.getChallenges(LocalDate.now(), LocalDate.now());
        superLog(challenges);
    }
}
```

- [ ] **Step 2: 테스트 실행**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Domain-Question:test --tests "com.passql.question.service.DailyChallengeSchedulerTest" --info 2>&1 | tail -30
```

Expected: 테스트 통과, 각 케이스 결과 출력

- [ ] **Step 3: 커밋**

커밋 메시지 형식을 사용자에게 먼저 받을 것

---

### Task 5: 관리자 달력 수동 검증

- [ ] **Step 1: 서버 로컬 실행**

```bash
cd /Users/suhsaechan/Desktop/Programming/project/passQL/server
./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```

- [ ] **Step 2: 달력 화면 확인**

브라우저에서 `http://localhost:8080/admin/daily-challenges` 접속 후:
- 오늘 날짜에 문제가 이벤트로 표시되는지 확인
- 날짜 클릭 시 배정된 문제가 모달에 표시되는지 확인

- [ ] **Step 3: API 직접 확인**

```bash
curl "http://localhost:8080/admin/daily-challenges/api?from=$(date +%Y-%m-%d)&to=$(date +%Y-%m-%d)"
```

Expected: 오늘 날짜의 `DailyChallengeItem` JSON 반환
