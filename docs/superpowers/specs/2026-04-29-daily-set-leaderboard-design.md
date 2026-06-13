# Daily Set + Leaderboard 설계 문서

**이슈**: #304 — AI 문제 풀기 오늘의 데일리 세트 기능 추가  
**날짜**: 2026-04-29  
**브랜치**: `20260425_#304_AI_문제_풀기_오늘의_데일리_세트_기능_추가`

---

## 개요

기존 1문제짜리 `DailyChallenge`를 10문제짜리 데일리 세트로 완전 대체한다.  
전 회원이 동일한 10문제를 풀되, 순서는 회원마다 랜덤으로 다르다.  
완료 후 오늘의 리더보드(정답 수 기준)를 확인할 수 있다.

---

## 1. DB 스키마

### `daily_challenge` 테이블 변경

기존 `uk_daily_challenge_date` (날짜 단독 유니크) 제거 →  
`uk_daily_challenge_date_order` (`challenge_date + sort_order`) 복합 유니크로 교체.

```sql
ALTER TABLE daily_challenge
  DROP INDEX uk_daily_challenge_date,
  ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER challenge_date,
  ADD CONSTRAINT uk_daily_challenge_date_order UNIQUE (challenge_date, sort_order);
```

**변경 후 구조**:
```
daily_challenge
  - daily_challenge_uuid  UUID PK
  - challenge_date        DATE
  - sort_order            INT (0~9, 10문제)
  - question_uuid         UUID
  - UNIQUE (challenge_date, sort_order)
```

### `daily_set_submission` 신규 테이블

세트 완료자의 결과를 1행으로 집계. 리더보드 전용.  
문제 단위 기록은 기존 `submission` 테이블에 그대로 쌓인다.

```sql
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

**Flyway 버전**: 현재 `0.0.183` → 다음 버전 기준으로 작성.

---

## 2. 백엔드

### 변경: `daily_challenge` 엔티티

`sort_order` 컬럼 추가. `challenge_date` 단독 유니크 제약 제거.

### 변경: `AdminDailyChallengeService`

- `assign(date, questionUuid)` → `assign(date, List<UUID> questionUuids)` — 10문제 일괄 배정
- `confirmFallback(date)` — 활성 문제를 토픽별 그룹핑 후 토픽 순환 방식으로 10개 선정, `sort_order` 0~9로 저장

### 변경: `DailyChallengeScheduler`

변경 없음. 자정 cron 유지.

### 변경: `HomeService.getToday()`

`alreadySolvedToday` → `alreadyCompletedDailySet`으로 의미 변경.  
`daily_set_submission` 테이블에서 오늘 날짜 + memberUuid 존재 여부로 판단.

### 신규 API

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| `GET`  | `/daily-set/today` | 필요 | 오늘 10문제 조회 (회원별 랜덤 순서) |
| `POST` | `/daily-set/complete` | 필요 | 세트 완료 처리 + 정답 수 반환 |
| `GET`  | `/daily-set/leaderboard` | 필요 | 오늘 날짜 정답 수 내림차순 상위 N명 |

#### `GET /daily-set/today` 응답
```json
{
  "questions": [ /* QuestionSummary 10개, 회원별 셔플 순서 */ ],
  "alreadyCompleted": false,
  "correctCount": null
}
```

#### `POST /daily-set/complete` 요청/응답
```json
// 요청
{ "correctCount": 7, "sessionUuid": "..." }

// 응답
{ "correctCount": 7, "rank": 3, "totalParticipants": 42 }
```

#### `GET /daily-set/leaderboard` 응답
```json
{
  "date": "2026-04-29",
  "entries": [
    { "rank": 1, "nickname": "홍길동", "correctCount": 10 },
    ...
  ],
  "myEntry": { "rank": 3, "correctCount": 7 }
}
```

### 셔플 전략

`memberUuid + challengeDate`를 시드로 결정론적 셔플.  
같은 회원이 새로고침해도 순서가 바뀌지 않는다.

```java
long seed = (memberUuid.toString() + date.toString()).hashCode();
Collections.shuffle(questions, new Random(seed));
```

### 폴백 10문제 선정 (`confirmFallback`)

활성 문제를 `topicCode`별로 그룹핑 → 토픽 순환(round-robin)으로 10개 선택.  
같은 토픽 문제가 쏠리지 않도록 보장.

---

## 3. 프론트엔드

### 라우팅

```
/daily-set          → DailySet.tsx    (기존 /daily-challenge 대체)
/daily-set/result   → DailySetResult.tsx
/leaderboard        → Leaderboard.tsx
```

기존 `/daily-challenge` 라우트는 `/daily-set`으로 redirect.

### 화면별 변경

#### `Home.tsx`
- 기존 "오늘의 문제" 카드 → "오늘의 데일리 세트" 카드로 교체
- 완료 전: "10문제 도전하기" 버튼
- 완료 후: "완료됨 · 순위 확인하기" 버튼 (리더보드로 이동)

#### `DailySet.tsx` (신규)
- `PracticeSet.tsx`와 동일한 플로우로 구현
- 오답이어도 "다음 문제"로 진행 가능
- 피드백바에 정답+해설+SQL 실행 버튼 표시
- 전용 `dailySetStore` 사용 (practiceStore와 격리)
- 10문제 완료 시 `POST /daily-set/complete` 호출 → `/daily-set/result`로 이동

#### `DailySetResult.tsx` (신규)
- 정답 수 표시 (예: 7 / 10)
- 문제별 O/X 목록
- 리더보드 미니 카드 (내 순위 + 상위 3명)
- "전체 순위 보기" 버튼 → `/leaderboard`

#### `Leaderboard.tsx` (신규)
- 오늘 날짜 기준 전체 순위 목록
- 내 순위 하이라이트
- 정답 수 기준 내림차순

#### `dailySetStore.ts` (신규)
`practiceStore`와 동일한 구조. 필드:
- `questions`, `currentIndex`, `results`, `startedAt`
- `correctCount` (완료 후 집계)
- `reset()`

### 관리자 페이지 변경

기존: 캘린더 날짜 클릭 → 문제 1개 자동 배정  
변경: 캘린더 날짜 클릭 → 문제 10개 자동 배정 (폴백 로직 동일)

관리자가 별도로 문제를 선택하는 UI 없음. 기존 방식 그대로 유지하되 배정 수량만 1→10으로 변경.  
배정된 10문제 목록은 날짜 클릭 시 확인 가능 (조회 전용).

---

## 4. 에러 처리

| 상황 | 처리 |
|------|------|
| 오늘 세트 미배정 | "오늘의 세트가 아직 준비 중이에요" 안내 화면 |
| 이미 완료한 회원이 `/daily-set` 접근 | `/leaderboard`로 redirect |
| `complete` 중복 호출 | `uk_daily_set_submission_member_date` 유니크 위반 → 409 응답 |
| 활성 문제 10개 미만 | 가능한 수만큼만 세트 구성 (app_setting으로 문제 수 조정 가능) |

---

## 5. 마이그레이션 파일

`version.yml` 다음 버전 기준으로 1개 파일 작성:
- `daily_challenge` 테이블 `sort_order` 컬럼 추가 + 유니크 제약 변경
- `daily_set_submission` 테이블 신규 생성
