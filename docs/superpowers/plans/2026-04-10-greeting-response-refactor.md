# Greeting API 응답 스키마 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Greeting API 응답에서 닉네임을 분리하고 이모지를 제거하며, D-day 구간에서도 일반 메시지가 가중치 기반으로 섞여 나오도록 `GreetingService`를 리팩터링한다.

**Architecture:** `GreetingResponse` record를 `{nickname, message, messageType}` 3필드로 확장하고, 새로운 `GreetingMessageType` enum(`GENERAL`, `COUNTDOWN`, `URGENT`, `EXAM_DAY`)을 도입한다. 서비스는 회원 조회 실패/비로그인/닉네임 공백에 대해 예외 대신 `"회원"` 폴백을 사용하고, D-day 구간별로 D-day 풀과 일반 풀을 가중치 기반으로 섞어서 뽑는다. 메시지 풀은 `{nickname}` 플레이스홀더 템플릿으로 바꾸고 이모지는 전부 제거한다.

**Tech Stack:** Spring Boot 3.x, Java 17 record, JUnit 5, `kr.suhsaechan.suhlogger.SuhLogger`, `kr.suhsaechan.suhapilog.ApiLog`, AssertJ.

**Spec:** `docs/superpowers/specs/2026-04-10-greeting-response-refactor-design.md`
**Issue:** passQL-Lab/passQL#53

---

## File Structure

**신규 생성**
- `server/PQL-Application/src/main/java/com/passql/application/constant/GreetingMessageType.java` — 인사말 타입 enum

**수정**
- `server/PQL-Application/src/main/java/com/passql/application/dto/GreetingResponse.java` — record 필드 3개로 확장
- `server/PQL-Application/src/main/java/com/passql/application/service/GreetingService.java` — 전체 로직 리팩터링
- `server/PQL-Application/src/test/java/com/passql/application/service/GreetingServiceTest.java` — 테스트 케이스 확장
- `server/PQL-Web/src/main/java/com/passql/web/controller/HomeControllerDocs.java` — `@ApiLog` 추가, 설명 업데이트

---

## Task 1: `GreetingMessageType` enum 생성

**Files:**
- Create: `server/PQL-Application/src/main/java/com/passql/application/constant/GreetingMessageType.java`

- [ ] **Step 1: enum 파일 생성**

```java
package com.passql.application.constant;

/**
 * 홈 화면 인사말 메시지 타입.
 * 프론트엔드는 이 값에 따라 아이콘/톤을 분기할 수 있다.
 */
public enum GreetingMessageType {
    /** 일반 인사 (시험 선택 없음 / D-30 초과 / 시험 종료 / 예외 케이스) */
    GENERAL,
    /** 카운트다운 (D-8 ~ D-30) */
    COUNTDOWN,
    /** 긴급 (D-1 ~ D-7) */
    URGENT,
    /** 시험 당일 (D-0) */
    EXAM_DAY
}
```

- [ ] **Step 2: 컴파일 확인**

프로젝트 IDE가 자동 빌드하거나, 사용자가 원하는 시점에 빌드해 컴파일이 통과하는지 확인한다 (내부망 제약상 gradle 명령은 사용자가 직접 실행).

- [ ] **Step 3: Commit (사용자가 수동 커밋)**

커밋 메시지 제안:
```
feat: GreetingMessageType enum 추가 #53
```
(Claude는 커밋하지 않음 — 사용자가 직접 커밋)

---

## Task 2: `GreetingResponse` record 필드 확장

**Files:**
- Modify: `server/PQL-Application/src/main/java/com/passql/application/dto/GreetingResponse.java`

- [ ] **Step 1: record 수정**

Before:
```java
package com.passql.application.dto;

public record GreetingResponse(String message) {}
```

After:
```java
package com.passql.application.dto;

import com.passql.application.constant.GreetingMessageType;

public record GreetingResponse(
    String nickname,
    String message,
    GreetingMessageType messageType
) {}
```

- [ ] **Step 2: 기존 호출부 컴파일 에러 확인**

`GreetingService`와 `GreetingServiceTest`에서 `new GreetingResponse(message)` 1-인자 생성자를 쓰고 있으므로 컴파일 에러가 발생할 것이다. 이는 Task 3, Task 5에서 함께 해소된다.

- [ ] **Step 3: Commit (사용자 수동)**

커밋 메시지 제안:
```
feat: GreetingResponse에 nickname, messageType 필드 추가 #53
```

---

## Task 3: `GreetingService` 전면 리팩터링 (로직 & 메시지 풀)

**Files:**
- Modify: `server/PQL-Application/src/main/java/com/passql/application/service/GreetingService.java`

- [ ] **Step 1: GreetingService 전체 교체**

파일 전체를 아래 내용으로 교체한다.

```java
package com.passql.application.service;

import com.passql.application.constant.GreetingMessageType;
import com.passql.application.dto.GreetingResponse;
import com.passql.member.entity.Member;
import com.passql.member.repository.MemberRepository;
import com.passql.meta.entity.ExamSchedule;
import com.passql.meta.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GreetingService {

    private static final String FALLBACK_NICKNAME = "회원";

    private final MemberRepository memberRepository;
    private final ExamScheduleRepository examScheduleRepository;

    public GreetingResponse getGreeting(UUID memberUuid) {
        Member member = (memberUuid != null)
                ? memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid).orElse(null)
                : null;

        String nickname = (member != null && StringUtils.hasText(member.getNickname()))
                ? member.getNickname()
                : FALLBACK_NICKNAME;

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 예외 케이스: 회원 없음 → GENERAL
        if (member == null) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }

        Optional<ExamSchedule> selectedExam = examScheduleRepository.findFirstByIsSelectedTrue();
        if (selectedExam.isEmpty()) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }

        ExamSchedule exam = selectedExam.get();
        long dDay = ChronoUnit.DAYS.between(today, exam.getExamDate());
        String certType = exam.getCertType().name();

        if (dDay == 0) {
            return new GreetingResponse(
                    nickname,
                    randomFrom(examDayMessages(certType)),
                    GreetingMessageType.EXAM_DAY
            );
        } else if (dDay >= 1 && dDay <= 3) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(urgentMessages(certType, dDay), 70, generalMessages(now), 30),
                    GreetingMessageType.URGENT
            );
        } else if (dDay >= 4 && dDay <= 7) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(urgentMessages(certType, dDay), 50, generalMessages(now), 50),
                    GreetingMessageType.URGENT
            );
        } else if (dDay >= 8 && dDay <= 30) {
            return new GreetingResponse(
                    nickname,
                    weightedPick(countdownMessages(certType, dDay), 40, generalMessages(now), 60),
                    GreetingMessageType.COUNTDOWN
            );
        } else {
            // dDay > 30 또는 dDay < 0 (시험 종료)
            return new GreetingResponse(
                    nickname,
                    randomFrom(generalMessages(now)),
                    GreetingMessageType.GENERAL
            );
        }
    }

    // ---------- 메시지 풀 ----------

    private List<String> examDayMessages(String certType) {
        return List.of(
                "오늘이 바로 " + certType + " 시험 날이에요, {nickname}님! 화이팅!",
                "{nickname}님, 오늘은 " + certType + " 시험 날! 지금까지 해온 것만 믿고 달려가세요",
                "드디어 " + certType + " 시험 날! {nickname}님 할 수 있어요",
                "{nickname}님 오늘 " + certType + " 시험! 준비한 것들 믿고 침착하게 풀어내세요"
        );
    }

    private List<String> urgentMessages(String certType, long dDay) {
        return List.of(
                certType + " D-" + dDay + ", 마지막 스퍼트! {nickname}님 파이팅!",
                "{nickname}님, " + certType + " D-" + dDay + "! 지금이 골든타임이에요",
                "D-" + dDay + "! {nickname}님 " + certType + " 마무리 잘 하고 계시죠?",
                certType + " D-" + dDay + "! {nickname}님 오늘도 한 문제씩 착착",
                "{nickname}님, " + certType + " D-" + dDay + "! 오답노트 한 번 더 보고 가세요"
        );
    }

    private List<String> countdownMessages(String certType, long dDay) {
        return List.of(
                "{nickname}님, " + certType + " 시험까지 " + dDay + "일 남았어요! 꾸준히 가봐요",
                certType + " D-" + dDay + ", {nickname}님 오늘도 한 걸음씩 나아가고 있어요",
                "{nickname}님! " + certType + " 시험 " + dDay + "일 전, 지금 페이스 유지가 중요해요",
                "D-" + dDay + " " + certType + " 시험! {nickname}님 매일 조금씩이 쌓여요",
                "{nickname}님, " + certType + " 시험 " + dDay + "일 남았네요. 오늘도 화이팅!",
                certType + " 준비 중인 {nickname}님, D-" + dDay + "! 포기하지 말고 달려봐요"
        );
    }

    private List<String> generalMessages(LocalTime now) {
        int hour = now.getHour();
        String timeGreet;
        if (hour >= 5 && hour < 11) {
            timeGreet = "좋은 아침이에요";
        } else if (hour >= 11 && hour < 17) {
            timeGreet = "좋은 오후예요";
        } else if (hour >= 17 && hour < 22) {
            timeGreet = "좋은 저녁이에요";
        } else {
            timeGreet = "늦은 시간에도 공부 중이시네요";
        }

        return List.of(
                "{nickname}님, " + timeGreet + "! 오늘도 SQL 한 문제 풀어볼까요?",
                timeGreet + ", {nickname}님! 오늘 하루도 파이팅이에요",
                "{nickname}님! 오늘도 꾸준하게 성장 중이시네요",
                "안녕하세요, {nickname}님! 오늘은 어떤 문제에 도전해볼까요?",
                "{nickname}님, " + timeGreet + "! 매일 조금씩 성장하고 있어요",
                "{nickname}님, 오늘도 SQL 실력 키우러 오셨군요! 반가워요",
                "환영해요, {nickname}님! 오늘 목표를 하나씩 이뤄가봐요",
                "{nickname}님, 꾸준함이 실력이 돼요. 오늘도 화이팅!"
        );
    }

    // ---------- 랜덤 유틸 ----------

    private String randomFrom(List<String> pool) {
        return pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
    }

    /**
     * 두 풀 중 하나를 가중치 기반으로 먼저 선택한 뒤, 해당 풀 내에서 균등 랜덤으로 메시지를 뽑는다.
     * 풀을 물리적으로 합치지 않으므로 각 풀의 크기 차이에 영향받지 않고 의도한 비율이 정확히 유지된다.
     */
    private String weightedPick(List<String> primary, int primaryWeight,
                                 List<String> fallback, int fallbackWeight) {
        int total = primaryWeight + fallbackWeight;
        int roll = ThreadLocalRandom.current().nextInt(total);
        List<String> chosen = (roll < primaryWeight) ? primary : fallback;
        return chosen.get(ThreadLocalRandom.current().nextInt(chosen.size()));
    }
}
```

**주요 변경 포인트 요약:**
- `CustomException` / `ErrorCode` import 삭제 (더 이상 예외 안 던짐)
- 상수 `FALLBACK_NICKNAME = "회원"` 추가
- 회원 조회 결과가 null이거나 닉네임이 공백이면 `"회원"` + GENERAL 폴백
- `buildMessage` 메서드 제거 → `getGreeting` 본문에서 바로 분기 + `GreetingResponse` 생성
- 모든 메시지 풀에서 이모지 제거 + 닉네임을 `{nickname}` 리터럴 플레이스홀더로 교체
- `generalMessages`는 `nickname` 파라미터를 더 이상 받지 않음 (`LocalTime now`만)
- `weightedPick` 헬퍼 추가

- [ ] **Step 2: 컴파일 확인**

`GreetingServiceTest`는 아직 구 생성자(`new GreetingResponse(message)`)를 가리킬 수 있으나, 이 task에서 test 파일은 수정하지 않는다. 컴파일 에러가 있으면 Task 5에서 테스트 파일을 고치면서 해소된다.

- [ ] **Step 3: Commit (사용자 수동)**

커밋 메시지 제안:
```
refactor: GreetingService 닉네임 분리, 이모지 제거, D-day 가중치 혼합 #53
```

---

## Task 4: 플레이스홀더 치환 규칙 검증 — 서비스 레벨 단위 체크

**Files:**
- Modify: `server/PQL-Application/src/main/java/com/passql/application/service/GreetingService.java` (검증 로직은 메시지 풀 자체에 이미 포함됨 — 별도 assertion 없음)

이 작업은 "플레이스홀더가 빠진 메시지가 섞이지 않았는지" 를 개발자가 **메시지 풀 코드를 눈으로 확인**하는 것으로 충족한다. 모든 메시지에 `{nickname}` 이 최소 1회 등장해야 한다.

- [ ] **Step 1: 메시지 풀 셀프 리뷰**

`GreetingService` 안의 4개 풀(`examDayMessages`, `urgentMessages`, `countdownMessages`, `generalMessages`)을 훑으면서 다음을 확인한다.

1. 각 풀의 모든 메시지에 `{nickname}` 이 최소 1회 등장하는가?
2. 어떤 메시지에도 이모지가 남아있지 않은가? (유니코드 pictograph 검색: 📚 💪 🔥 ✨ 🎯 🧠 📝 🚶 💡 🏃 🚀 😊 🏆)
3. `nickname + "님"` 같은 변수 결합 패턴이 남아있지 않은가?

문제가 있으면 그 자리에서 수정한다. 변경이 발생하면 다시 커밋한다 (사용자 수동).

- [ ] **Step 2: 필요 시 Commit (사용자 수동)**

변경이 없으면 스킵.

---

## Task 5: `GreetingServiceTest` 확장

**Files:**
- Modify: `server/PQL-Application/src/test/java/com/passql/application/service/GreetingServiceTest.java`

기존 테스트 중 `존재하지않는_uuid_404예외_테스트`는 **더 이상 예외가 던져지지 않으므로 삭제**하고, fallback 동작을 확인하는 테스트로 교체한다.

- [ ] **Step 1: 테스트 파일 전체 교체**

```java
package com.passql.application.service;

import static kr.suhsaechan.suhlogger.util.SuhLogger.lineLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.superLog;
import static kr.suhsaechan.suhlogger.util.SuhLogger.timeLog;

import com.passql.application.constant.GreetingMessageType;
import com.passql.application.dto.GreetingResponse;
import com.passql.member.dto.MemberRegisterResponse;
import com.passql.member.service.MemberService;
import com.passql.web.PassqlApplication;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@SpringBootTest(classes = PassqlApplication.class)
@ActiveProfiles("dev")
@Slf4j
class GreetingServiceTest {

    @Autowired GreetingService greetingService;
    @Autowired MemberService memberService;

    @Test
    @Transactional
    public void mainTest() {
        lineLog("테스트시작");

        lineLog(null);
        timeLog(this::존재하지않는_uuid_폴백_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::null_uuid_폴백_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::정상_회원_인사말_반환_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::정상_회원_반복호출_다양성_확인_테스트);
        lineLog(null);

        lineLog(null);
        timeLog(this::메시지_이모지_및_플레이스홀더_검증_테스트);
        lineLog(null);

        lineLog("테스트종료");
    }

    public void 존재하지않는_uuid_폴백_테스트() {
        lineLog("존재하지 않는 memberUuid → 예외 없이 '회원' + GENERAL 폴백");
        UUID fakeUuid = UUID.randomUUID();
        lineLog("fakeUuid: " + fakeUuid);

        GreetingResponse response = greetingService.getGreeting(fakeUuid);
        superLog(response);

        lineLog("nickname: " + response.nickname());
        lineLog("messageType: " + response.messageType());
        lineLog("message: " + response.message());

        if (!"회원".equals(response.nickname())) {
            throw new AssertionError("fallback nickname이 '회원'이 아님: " + response.nickname());
        }
        if (response.messageType() != GreetingMessageType.GENERAL) {
            throw new AssertionError("fallback messageType이 GENERAL이 아님: " + response.messageType());
        }
    }

    public void null_uuid_폴백_테스트() {
        lineLog("memberUuid == null → 예외 없이 '회원' + GENERAL 폴백");

        GreetingResponse response = greetingService.getGreeting(null);
        superLog(response);

        if (!"회원".equals(response.nickname())) {
            throw new AssertionError("fallback nickname이 '회원'이 아님: " + response.nickname());
        }
        if (response.messageType() != GreetingMessageType.GENERAL) {
            throw new AssertionError("fallback messageType이 GENERAL이 아님: " + response.messageType());
        }
    }

    public void 정상_회원_인사말_반환_테스트() {
        lineLog("정상 회원 등록 후 인사말 조회 → 전체 응답 눈으로 확인");
        MemberRegisterResponse registered = memberService.register();
        lineLog("등록된 회원 UUID: " + registered.getMemberUuid());
        lineLog("등록된 닉네임: " + registered.getNickname());

        GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
        superLog(response);

        lineLog("nickname: " + response.nickname());
        lineLog("messageType: " + response.messageType());
        lineLog("message: " + response.message());
    }

    public void 정상_회원_반복호출_다양성_확인_테스트() {
        lineLog("같은 회원으로 10회 호출 → 응답 다양성 눈으로 확인 (랜덤 풀 동작)");
        MemberRegisterResponse registered = memberService.register();
        lineLog("등록된 닉네임: " + registered.getNickname());

        for (int i = 0; i < 10; i++) {
            GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
            lineLog("[" + (i + 1) + "] type=" + response.messageType() + " | " + response.message());
        }
    }

    public void 메시지_이모지_및_플레이스홀더_검증_테스트() {
        lineLog("응답 message에 이모지가 없고 {nickname} 플레이스홀더가 보존되는지 검증");
        MemberRegisterResponse registered = memberService.register();

        for (int i = 0; i < 20; i++) {
            GreetingResponse response = greetingService.getGreeting(registered.getMemberUuid());
            String msg = response.message();

            if (!msg.contains("{nickname}")) {
                throw new AssertionError("message에 {nickname} 플레이스홀더가 없음: " + msg);
            }
            // 대표 이모지 몇 개만 샘플 검증
            String[] forbiddenEmojis = {"📚", "💪", "🔥", "✨", "🎯", "🧠", "📝", "🚶", "💡", "🏃", "🚀", "😊", "🏆"};
            for (String emoji : forbiddenEmojis) {
                if (msg.contains(emoji)) {
                    throw new AssertionError("message에 이모지가 남아있음 (" + emoji + "): " + msg);
                }
            }
        }
        lineLog("20회 모두 플레이스홀더 보존 + 이모지 없음 확인 완료");
    }
}
```

**주요 변경 포인트:**
- `CustomException`, `AssertJ` import 제거
- `존재하지않는_uuid_404예외_테스트` → `존재하지않는_uuid_폴백_테스트`로 교체
- `null_uuid_폴백_테스트` 추가
- `정상_회원_반복호출_다양성_확인_테스트` 추가 (랜덤 풀 눈 확인용)
- `메시지_이모지_및_플레이스홀더_검증_테스트` 추가 — 프로젝트 룰상 assertion은 지양하지만, "눈으로 확인이 불가능한 경우에만 최소한으로 사용" 예외에 해당 (이모지 누락/플레이스홀더 누락은 눈으로 매번 검증 불가)

- [ ] **Step 2: 테스트 실행 지시**

Claude는 내부망 제약으로 gradle 테스트를 실행하지 않는다. 사용자에게 다음을 실행하도록 안내한다:

```
./gradlew :PQL-Application:test --tests "com.passql.application.service.GreetingServiceTest"
```

기대 동작: `mainTest` 통과. 로그에 5개 세부 케이스의 출력이 찍히고, 반복 호출 테스트에서 messageType과 message가 다양하게 출력된다.

- [ ] **Step 3: Commit (사용자 수동)**

커밋 메시지 제안:
```
test: GreetingServiceTest 폴백/다양성/플레이스홀더 검증 케이스 추가 #53
```

---

## Task 6: `HomeControllerDocs` API 문서 업데이트

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/HomeControllerDocs.java`

- [ ] **Step 1: `@ApiLog` 추가 및 description 갱신**

`@ApiLogs` 배열에 항목을 추가하고, `@Operation`의 description을 신규 스키마에 맞게 갱신한다.

Before:
```java
@ApiLogs({
    @ApiLog(date = "2026.04.09", author = Author.SUHSAECHAN, issueNumber = 39, description = "홈 화면 인사 메시지 조회 API 추가"),
})
@Operation(
    summary = "홈 화면 인사 메시지 조회",
    description = """
        ## 인증(JWT): **불필요**

        ## 요청 파라미터
        - **`memberUuid`** (required): 회원 UUID

        ## 반환값 (GreetingResponse)
        - **`message`**: 인사 메시지 문자열
        - 선택된 시험 일정이 있으면 D-day 포함 메시지 반환
        - 선택된 일정이 없으면 기본 인사 메시지 반환
        """
)
ResponseEntity<GreetingResponse> getGreeting(@RequestParam UUID memberUuid);
```

After:
```java
@ApiLogs({
    @ApiLog(date = "2026.04.09", author = Author.SUHSAECHAN, issueNumber = 39, description = "홈 화면 인사 메시지 조회 API 추가"),
    @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 53, description = "Greeting 응답 스키마 변경: nickname 분리, 이모지 제거, messageType 추가, D-day 구간에 일반 메시지 가중치 혼합, 회원 조회 실패 fallback"),
})
@Operation(
    summary = "홈 화면 인사 메시지 조회",
    description = """
        ## 인증(JWT): **불필요**

        ## 요청 파라미터
        - **`memberUuid`** (optional): 회원 UUID. null이거나 존재하지 않으면 '회원' 닉네임으로 폴백한다.

        ## 반환값 (GreetingResponse)
        - **`nickname`**: 회원 닉네임. 조회 실패/비로그인/닉네임 공백 시 `"회원"`.
        - **`message`**: 인사 메시지 템플릿. `{nickname}` 플레이스홀더를 포함하므로 프론트에서 치환해 렌더링한다. 이모지는 포함되지 않는다.
        - **`messageType`**: `GENERAL` / `COUNTDOWN` / `URGENT` / `EXAM_DAY` 중 하나. 프론트는 이 값으로 아이콘/톤을 분기할 수 있다.

        ## 메시지 선택 규칙
        - 선택된 시험 일정이 없거나 D-30 초과 / 시험 종료 → `GENERAL`
        - D-8 ~ D-30 → `COUNTDOWN` (카운트다운 40% / 일반 60% 혼합)
        - D-4 ~ D-7 → `URGENT` (긴급 50% / 일반 50% 혼합)
        - D-1 ~ D-3 → `URGENT` (긴급 70% / 일반 30% 혼합)
        - D-0 (시험 당일) → `EXAM_DAY` (100%)
        """
)
ResponseEntity<GreetingResponse> getGreeting(@RequestParam UUID memberUuid);
```

- [ ] **Step 2: 컴파일 확인**

사용자가 로컬 빌드로 확인.

- [ ] **Step 3: Commit (사용자 수동)**

커밋 메시지 제안:
```
docs: HomeControllerDocs Greeting 응답 스키마 변경 반영 #53
```

---

## Task 7: 최종 검증 체크리스트

- [ ] **Step 1: 파일 단위 체크**

사용자에게 다음 파일들이 모두 수정/생성되었는지 확인하도록 안내한다:

- `server/PQL-Application/src/main/java/com/passql/application/constant/GreetingMessageType.java` (신규)
- `server/PQL-Application/src/main/java/com/passql/application/dto/GreetingResponse.java` (3필드)
- `server/PQL-Application/src/main/java/com/passql/application/service/GreetingService.java` (리팩터링)
- `server/PQL-Application/src/test/java/com/passql/application/service/GreetingServiceTest.java` (확장)
- `server/PQL-Web/src/main/java/com/passql/web/controller/HomeControllerDocs.java` (@ApiLog + description)

- [ ] **Step 2: 동작 체크리스트 (사용자 실행)**

사용자에게 다음을 수동으로 확인하도록 안내:

1. 프로젝트 빌드 통과 — `./gradlew build`
2. `GreetingServiceTest` 통과 — 위 Task 5 Step 2의 명령어
3. 로컬 실행 후 실제 API 호출로 응답 JSON 확인
   - `GET /api/home/greeting?memberUuid=<실제UUID>` → 닉네임/message/messageType 3필드 확인
   - `GET /api/home/greeting?memberUuid=<존재하지않는UUID>` → `nickname="회원"`, `messageType="GENERAL"` 확인
4. 프론트 담당자에게 스키마 변경 공유:
   - `message` 필드는 이제 `{nickname}` 플레이스홀더를 포함한 템플릿이다
   - 프론트는 `message.replace("{nickname}", nickname)` 또는 `message.split("{nickname}")`으로 렌더한다
   - 아이콘/이모지는 더 이상 서버에서 내려주지 않으며, 필요하면 `messageType` 값에 따라 프론트가 자체 관리한다

- [ ] **Step 3: 이슈 #53 체크**

GitHub 이슈 passQL-Lab/passQL#53에 작업 완료 코멘트를 달거나 PR에 `Closes #53`을 포함해 연결한다 (사용자 수동).

---

## Self-Review 결과

**1. Spec coverage**
- 스키마 변경 → Task 1, 2
- 서비스 로직 리팩터링 (fallback + 가중치 혼합) → Task 3
- 메시지 풀 템플릿화/이모지 제거 → Task 3 + Task 4 셀프 리뷰
- 테스트 → Task 5
- API 문서 → Task 6
- 범위 밖 항목 (i18n, iconKey, 이력 저장 등) → 플랜에 포함하지 않음 ✓

**2. Placeholder scan**
- "TBD", "TODO", "later" 없음
- 모든 코드 step에 완전한 코드 블록 포함
- "Similar to Task N" 패턴 없음

**3. Type consistency**
- `GreetingMessageType` 이름이 Task 1, 2, 3, 5, 6 전체에서 동일
- enum 값 `GENERAL`, `COUNTDOWN`, `URGENT`, `EXAM_DAY` 4종 일관 사용
- `GreetingResponse(nickname, message, messageType)` 3-인자 생성자 순서 전 task에서 동일
- `FALLBACK_NICKNAME = "회원"` 상수 사용처와 테스트의 `"회원"` 일치
- `weightedPick` 시그니처 (primary, primaryWeight, fallback, fallbackWeight)가 호출부와 정의부에서 일치
