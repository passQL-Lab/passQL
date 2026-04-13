# Greeting API 응답 스키마 개선 설계

- **이슈**: passQL-Lab/passQL#53
- **작성일**: 2026-04-10
- **관련 파일**
  - `server/PQL-Application/src/main/java/com/passql/application/dto/GreetingResponse.java`
  - `server/PQL-Application/src/main/java/com/passql/application/service/GreetingService.java`
  - `server/PQL-Application/src/test/java/com/passql/application/service/GreetingServiceTest.java`
  - `server/PQL-Web/src/main/java/com/passql/web/controller/HomeControllerDocs.java`
  - (신규) `server/PQL-Application/src/main/java/com/passql/application/constant/GreetingMessageType.java`

---

## 1. 배경 & 문제

현재 `GreetingResponse`는 단일 문자열 필드 하나로 구성되어 있다.

```json
{ "message": "홍길동님, 좋은 아침이에요! 오늘도 SQL 한 문제 풀어볼까요? 📚" }
```

문자열 안에 닉네임 + 본문 + 이모지가 뭉쳐 있어 다음과 같은 문제가 있다.

1. **프론트가 닉네임만 별도 스타일링할 수 없다.** 하이라이트 등을 적용하려면 문자열 파싱이 필요한데 지저분하다.
2. **이모지가 서버에 하드코딩되어 있다.** 프론트가 일관된 아이콘 체계를 갖고 싶어도 서버 문자열에 종속된다.
3. **메시지 선택 로직이 구간 단일 풀이다.** D-7 이내에 들어가면 "D-5 스퍼트!" 같은 urgent 메시지만 계속 반복되어, 매일 들어오는 사용자에게 피로감이 있다.
4. **회원 조회 실패 시 예외를 던진다.** 프론트 fallback 요구(예외 상황에서도 인사말 표시)를 만족시키지 못한다.

## 2. 목표

- 프론트가 닉네임을 손쉽게 분리해서 스타일링할 수 있게 한다.
- 이모지를 제거하고 아이콘 정책을 프론트로 이관한다.
- D-day 구간에서도 일반 메시지를 섞어 다양성을 확보한다. 긴박할수록 D-day 메시지 비중을 높인다.
- 회원 조회 실패 / 비로그인 / 닉네임 공백 상황에서도 정상 응답을 내려 준다 (fallback).

## 3. 응답 스키마

### 3.1 새로운 `GreetingResponse`

```java
public record GreetingResponse(
    String nickname,
    String message,
    GreetingMessageType messageType
) {}
```

```json
{
  "nickname": "홍길동",
  "message": "{nickname}님, 좋은 아침이에요! 오늘도 SQL 한 문제 풀어볼까요?",
  "messageType": "GENERAL"
}
```

- `nickname`: 회원 닉네임. 예외 케이스에서는 기본값 `"회원"`.
- `message`: `{nickname}` 플레이스홀더를 포함한 템플릿 문자열. **이모지 미포함.**
- `messageType`: 인사말 메시지 타입 enum (아래 3.2 참조).

프론트 렌더 방식 예시:
```js
const text = data.message.replace("{nickname}", data.nickname);
// 또는 닉네임 부분만 스타일링:
const [before, after] = data.message.split("{nickname}");
```

### 3.2 `GreetingMessageType` enum

`server/PQL-Application/src/main/java/com/passql/application/constant/GreetingMessageType.java`

```java
public enum GreetingMessageType {
    GENERAL,    // 일반 인사 (시험 없음 / D-30 초과 / 시험 종료 / 예외 케이스)
    COUNTDOWN,  // D-8 ~ D-30
    URGENT,     // D-1 ~ D-7
    EXAM_DAY    // D-0 (시험 당일)
}
```

## 4. 메시지 선택 로직

### 4.1 전체 분기

```
회원이 null (비로그인 / 조회 실패 / 닉네임 공백)
  → nickname = "회원", messageType = GENERAL, pool = generalMessages

회원 존재
  ├─ 선택한 시험 없음                  → GENERAL,   pool = generalMessages
  ├─ dDay == 0 (당일)                  → EXAM_DAY,  pool = examDayMessages          (100%)
  ├─ 1 <= dDay <= 3                    → URGENT,    urgent 70% / general 30%
  ├─ 4 <= dDay <= 7                    → URGENT,    urgent 50% / general 50%
  ├─ 8 <= dDay <= 30                   → COUNTDOWN, countdown 40% / general 60%
  └─ dDay > 30 또는 dDay < 0 (종료)    → GENERAL,   pool = generalMessages
```

**당일(D-0)은 혼합하지 않고 100% EXAM_DAY**로 고정한다. 이 날만큼은 일반 인사가 섞이면 의미가 퇴색된다.

### 4.2 가중치 혼합 구현

풀을 물리적으로 합치지 않는다. 각 풀의 크기가 다르기 때문에 단순 합집합으로는 의도한 비율이 나오지 않는다.

```java
private String weightedPick(List<String> primary, int primaryWeight,
                             List<String> fallback, int fallbackWeight) {
    int total = primaryWeight + fallbackWeight;
    int roll = ThreadLocalRandom.current().nextInt(total);
    List<String> chosen = (roll < primaryWeight) ? primary : fallback;
    return chosen.get(ThreadLocalRandom.current().nextInt(chosen.size()));
}
```

사용 예:
```java
// D-1 ~ D-3: urgent 70 / general 30
return weightedPick(
    urgentMessages(certType, dDay), 70,
    generalMessages(now), 30
);
```

### 4.3 회원 조회 fallback

기존:
```java
Member member = memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid)
        .orElseThrow(() -> new CustomException(ErrorCode.MEMBER_NOT_FOUND));
```

변경:
```java
Member member = (memberUuid != null)
    ? memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid).orElse(null)
    : null;

String nickname = (member != null && StringUtils.hasText(member.getNickname()))
    ? member.getNickname()
    : "회원";
```

- `memberUuid == null` (비로그인)
- 회원 없음 / 삭제됨
- 닉네임이 null 또는 공백

위 3가지 케이스 모두 `nickname = "회원"` + `GENERAL` 메시지로 폴백한다.
`MEMBER_NOT_FOUND` 예외는 더 이상 던지지 않는다.

## 5. 메시지 풀 리팩터링

모든 메시지 풀에서 두 가지를 수행한다.

1. 닉네임 변수 결합(`nickname + "님"`)을 `"{nickname}님"` 리터럴로 교체
2. 이모지(📚 💪 🔥 ✨ 🎯 🧠 📝 🚶 💡 🏃 🚀 😊 🏆 등) 전부 제거

### 5.1 예시 — generalMessages

```java
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
```

### 5.2 D-day 메시지

D-day 숫자는 플레이스홀더가 아니라 런타임에 계산되므로, `"{nickname}님, " + certType + " D-" + dDay + ..."` 형태로 문자열 결합을 유지한다. `{nickname}`만 플레이스홀더다.

```java
private List<String> urgentMessages(String certType, long dDay) {
    return List.of(
        certType + " D-" + dDay + ", 마지막 스퍼트! {nickname}님 파이팅!",
        "{nickname}님, " + certType + " D-" + dDay + "! 지금이 골든타임이에요",
        "D-" + dDay + "! {nickname}님 " + certType + " 마무리 잘 하고 계시죠?",
        certType + " D-" + dDay + "! {nickname}님 오늘도 한 문제씩 착착",
        "{nickname}님, " + certType + " D-" + dDay + "! 오답노트 한 번 더 보고 가세요"
    );
}
```

`examDayMessages`, `countdownMessages`도 동일한 원칙으로 수정한다.

## 6. 서비스 전체 스켈레톤

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GreetingService {

    private final MemberRepository memberRepository;
    private final ExamScheduleRepository examScheduleRepository;

    public GreetingResponse getGreeting(UUID memberUuid) {
        Member member = (memberUuid != null)
            ? memberRepository.findByMemberUuidAndIsDeletedFalse(memberUuid).orElse(null)
            : null;

        String nickname = (member != null && StringUtils.hasText(member.getNickname()))
            ? member.getNickname()
            : "회원";

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 예외 케이스: 회원 없음 → 무조건 GENERAL
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

    // weightedPick, randomFrom, 메시지 풀 메서드들 ...
}
```

## 7. 테스트 계획

`GreetingServiceTest`는 기존 프로젝트 테스트 컨벤션(`mainTest` 단일 진입, `timeLog`+`superLog`, 눈으로 확인)을 따른다.

케이스:
- 정상 회원 + 시험 선택 없음 → `GENERAL`
- 정상 회원 + D-0 → `EXAM_DAY` (여러 번 호출해도 examDay 풀만 나오는지)
- 정상 회원 + D-2 → `URGENT` (여러 번 호출해서 urgent/general 분포 출력)
- 정상 회원 + D-5 → `URGENT`
- 정상 회원 + D-15 → `COUNTDOWN`
- 정상 회원 + D-100 → `GENERAL` (30일 초과)
- 정상 회원 + 시험 이미 지남(과거 날짜) → `GENERAL`
- 랜덤 UUID (회원 없음) → `nickname="회원"`, `GENERAL`
- `memberUuid == null` → `nickname="회원"`, `GENERAL`
- 모든 응답에서 `message`에 이모지가 포함되어 있지 않은지 간단 검증 (이건 예외적으로 assertion 사용 가능)
- 모든 응답에서 `message`에 `{nickname}` 플레이스홀더가 그대로 남아있는지 확인 (프론트 치환 계약 보증)

## 8. API 문서

`HomeControllerDocs`에 `@ApiLog` 항목 추가:

```java
@ApiLog(
    date = "2026.04.10",
    author = Author.SUHSAECHAN,
    issueNumber = 53,
    description = "Greeting 응답 스키마 변경: nickname 분리, 이모지 제거, messageType 추가, D-day 구간에 일반 메시지 가중치 혼합, 회원 조회 실패 fallback"
)
```

## 9. 범위 밖 (YAGNI)

- 다국어(i18n) 처리
- 이모지/아이콘을 `iconKey` 같은 별도 필드로 내려주는 것
- `context`/`messageType` 외에 sub-category (예: 아침/오후/저녁) 추가
- 회원별 인사말 이력 저장, 중복 회피
- A/B 테스트용 풀 분리

이번 스펙에서는 다루지 않는다. 필요해지면 별도 이슈로 분리한다.

## 10. 작업 체크리스트

- [ ] `GreetingMessageType` enum 신설
- [ ] `GreetingResponse`에 `nickname`, `messageType` 필드 추가
- [ ] `GreetingService` 리팩터링 (fallback, 가중치 혼합)
- [ ] 메시지 풀 `{nickname}` 템플릿화 + 이모지 제거
- [ ] `GreetingServiceTest` 케이스 확장
- [ ] `HomeControllerDocs`에 `@ApiLog` 추가
- [ ] 프론트 담당자에게 스키마 변경 공유 (nickname 필드 분리, message의 `{nickname}` 치환 규칙)
