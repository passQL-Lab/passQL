# 합격 준비도(Readiness Score) 백엔드 설계

- 작성일: 2026-04-10
- 대상: passQL 서버(Spring Boot)
- 관련 엔드포인트: `GET /progress`
- 관련 이슈: #52 — 홈 화면의 "progress 바 + %" 표현이 무한 문제 환경과 맞지 않음

## 1. 배경 및 문제 정의

passQL은 AI Agent가 **무제한으로** 문제를 생성하는 SQLD/SQLP 학습 서비스다.
현재 홈 화면은 `correctRate`(정답률)를 progress 바의 width로 렌더링하고 있어,
사용자에게 "전체 중 몇 % 완료"라는 **진도율**로 오독될 수 있다.

무한 문제 환경에서는 "전체"라는 분모가 존재하지 않으므로 진도율 개념 자체가 성립하지 않는다.
동시에 SQLD/SQLP는 **끝(시험일)이 있는 시험**이므로, 사용자가 정말 알고 싶은 것은 단 하나다:

> **"나 지금 붙을 수 있어?"**

따라서 "진도율"을 버리고 **합격 준비도(Readiness)** 개념으로 대체한다.
Readiness는 "얼마나 했나(누적)"가 아니라 "얼마나 준비됐나(상태)"를 표현하며,
무한 문제 환경에서도 0~100% 게이지가 자연스럽게 성립한다.

## 2. 설계 원칙

- **정직 모드**: 초반 5%, 10% 같은 낮은 수치도 그대로 노출한다. 실제 Oracle 실행을 강조하는 브랜드와 일관됨.
- **가중치 없음**: 토픽이 관리자에 의해 동적으로 추가/수정될 수 있으므로, 토픽별 가중치를 두지 않는다.
- **3요소 곱셈 모델**: 서로 독립적인 3개 지표의 곱으로 단일 수치를 산출한다. 토픽이 추가/삭제돼도 산식이 흔들리지 않는다.
- **투명성**: 최종 점수만이 아니라 3요소 원본값과 분모/분자를 응답에 포함해, FE와 사용자가 "왜 이 점수인지" 이해할 수 있게 한다.
- **비즈니스 로직 제로(FE)**: D-day와 준비도 구간에 따른 톤(카피) 분기 판단은 백엔드가 `toneKey`로 내려준다. FE는 키 → 카피 매핑만 한다.

## 3. 산식

```
Readiness = Accuracy × Coverage × Recency        (0.0 ~ 1.0)
```

### 3.1 Accuracy (정답률)

- 정의: **최근 N개 시도**의 정답 개수 / 시도 개수
- `N = RECENT_ATTEMPT_WINDOW = 50` (서버 상수, 튜닝 가능)
- 시도가 N개 미만이면 **실제 시도 수** 기준으로 계산 (예: 5시도 중 3정답 → 0.6)
- 시도 0건 → `Accuracy = 0.0`
- "최근" 기준은 `submission.submitted_at DESC` 정렬 상위 N개

### 3.2 Coverage (커버리지)

- 정의: **최근 W일 내** 1회 이상 푼 활성 토픽 수 / 활성 토픽 전체 수
- `W = COVERAGE_WINDOW_DAYS = 14` (서버 상수)
- "활성 토픽"은 `topic.is_active = true`인 토픽
- 활성 토픽 0개인 방어 케이스 → `Coverage = 0.0`
- 같은 토픽을 여러 번 풀어도 1개로 카운트 (distinct topic)
- 서브토픽이 아니라 **토픽(최상위)** 기준

### 3.3 Recency (최신성)

- 정의: 마지막 시도일로부터 경과일에 따른 감쇠 계수

| 경과일 | Recency |
|---|---|
| 0~1일 | 1.00 |
| 2~3일 | 0.95 |
| 4~7일 | 0.85 |
| 8~14일 | 0.75 |
| 15일 이상 | 0.70 |

- 시도 0건 → `Recency = 0.70` (기본 바닥값). 단 Accuracy=0, Coverage=0이므로 최종 Readiness는 0이 된다.
- 경과일은 **서버 타임존(KST)** 기준 캘린더 일수 차이. 시각 차이가 아니다.

### 3.4 반올림

- 3요소 각각: 소수 2자리 반올림
- 최종 `score`: 소수 2자리 반올림 (0.00 ~ 1.00)

### 3.5 시나리오 검증

| 사용자 유형 | Accuracy | Coverage | Recency | Readiness |
|---|---|---|---|---|
| 신규 (5문제) | 0.60 | 0.10 | 1.00 | 0.06 |
| 편식 고수 (JOIN만) | 0.90 | 0.30 | 1.00 | 0.27 |
| 골고루 중수 | 0.70 | 0.80 | 0.95 | 0.53 |
| 탑 학습자 | 0.85 | 0.95 | 1.00 | 0.81 |
| 방치된 과거 고수 | 0.85 | 0.90 | 0.70 | 0.54 |
| 미시도 | 0.00 | 0.00 | 0.70 | 0.00 |

## 4. API 변경

### 4.1 엔드포인트

`GET /progress?memberUuid={uuid}` — 기존 엔드포인트 유지, 응답 필드만 추가한다.

### 4.2 응답 스키마 (변경)

**기존 필드는 모두 보존**한다. FE가 홈 외 다른 영역에서 여전히 쓸 수 있기 때문.

```json
{
  "solvedCount": 42,
  "correctRate": 0.68,
  "streakDays": 7,
  "readiness": {
    "score": 0.32,
    "accuracy": 0.68,
    "coverage": 0.55,
    "recency": 0.85,
    "lastStudiedAt": "2026-04-09T22:13:00Z",
    "recentAttemptCount": 37,
    "coveredTopicCount": 6,
    "activeTopicCount": 11,
    "daysUntilExam": 27,
    "toneKey": "STEADY"
  }
}
```

### 4.3 필드 설명

| 필드 | 타입 | Nullable | 설명 |
|---|---|:---:|---|
| `readiness.score` | double | N | 최종 준비도 (0.00~1.00, 소수 2자리) |
| `readiness.accuracy` | double | N | Accuracy 원본값 (0.00~1.00) |
| `readiness.coverage` | double | N | Coverage 원본값 (0.00~1.00) |
| `readiness.recency` | double | N | Recency 원본값 (0.70~1.00) |
| `readiness.lastStudiedAt` | string (ISO-8601) | Y | 마지막 시도 시각. 미시도면 `null` |
| `readiness.recentAttemptCount` | int32 | N | 최근 50 윈도우에 실제 들어온 시도 수 (0~50) |
| `readiness.coveredTopicCount` | int32 | N | 최근 14일 내 푼 활성 토픽 수 |
| `readiness.activeTopicCount` | int32 | N | 활성 토픽 전체 수 |
| `readiness.daysUntilExam` | int32 | Y | 선택된 시험 일정 기준 D-day. 선택 없으면 `null` |
| `readiness.toneKey` | string (enum) | N | 카피 톤 분기 키 (아래 5장 참고) |

### 4.4 빈 상태 응답 예시 (첫 진입)

```json
{
  "solvedCount": 0,
  "correctRate": 0.0,
  "streakDays": 0,
  "readiness": {
    "score": 0.00,
    "accuracy": 0.00,
    "coverage": 0.00,
    "recency": 0.70,
    "lastStudiedAt": null,
    "recentAttemptCount": 0,
    "coveredTopicCount": 0,
    "activeTopicCount": 11,
    "daysUntilExam": 27,
    "toneKey": "ONBOARDING"
  }
}
```

## 5. toneKey — 카피 톤 분기

D-day와 시도 상태에 따라 "어떤 톤의 카피를 보여줄지"의 판단만 백엔드가 내린다.
**카피 문자열 자체는 FE가 관리**한다.

### 5.1 결정 규칙 (우선순위 순)

1. `daysUntilExam == null` → `NO_EXAM` (시험 미선택)
2. `recentAttemptCount == 0` → `ONBOARDING` (첫 진입 / 최근 시도 없음)
3. `daysUntilExam < 0` → `POST_EXAM` (시험일 지남)
4. `daysUntilExam == 0` → `TODAY` (시험 당일)
5. `1 ≤ daysUntilExam < 7` → `SPRINT` (막판)
6. `7 ≤ daysUntilExam < 15` → `PUSH` (가속)
7. `15 ≤ daysUntilExam ≤ 30` → `STEADY` (정석)
8. `daysUntilExam > 30` → `EARLY` (여유)

위→아래 우선순위로 처음 매칭되는 규칙의 키를 반환한다.

### 5.2 FE 매핑 책임

FE는 `(toneKey, scoreBand)` 조합으로 카피를 선택한다. `scoreBand`는 FE가 `score`로부터 자체 계산:

- `LOW`: score < 0.30
- `MID`: 0.30 ≤ score < 0.70
- `HIGH`: score ≥ 0.70

조합 매트릭스(8 toneKey × 3 scoreBand = 24칸) 관리는 FE 몫이다.
백엔드는 **키만 정직하게** 내려준다.

## 6. 구현 설계

### 6.1 변경 파일

- `server/src/main/java/.../progress/ProgressService.java` — 기존 `getProgress()` 확장
- `server/src/main/java/.../progress/dto/ProgressResponse.java` — `readiness` 필드 추가
- `server/src/main/java/.../progress/dto/ReadinessResponse.java` — 신규 DTO
- `server/src/main/java/.../progress/readiness/ReadinessCalculator.java` — 신규, 3요소 계산
- `server/src/main/java/.../progress/readiness/ToneKeyResolver.java` — 신규, toneKey 결정
- `server/src/main/java/.../progress/readiness/ReadinessConstants.java` — 상수 (`RECENT_ATTEMPT_WINDOW=50`, `COVERAGE_WINDOW_DAYS=14`, 감쇠 구간)

경계를 나눈 이유: `ReadinessCalculator`는 순수 함수에 가깝게 만들어 단위 테스트가 쉽다.
`ToneKeyResolver`도 분리해 규칙 추가/조정 시 다른 로직과 섞이지 않게 한다.

### 6.2 쿼리 설계

`ProgressService.getProgress()` 내에서 3개 쿼리로 해결:

1. **최근 N개 시도** — `SubmissionRepository.findTopNByMemberOrderBySubmittedAtDesc(memberUuid, 50)`
   - 결과에서 정답 개수 카운트 → Accuracy
   - 결과 첫 번째의 `submittedAt` → `lastStudiedAt` + Recency
   - 결과 크기 → `recentAttemptCount`
2. **최근 W일 내 distinct 활성 토픽 수** — 커스텀 쿼리
   ```
   SELECT COUNT(DISTINCT q.topic_id)
   FROM submission s
   JOIN question q ON s.question_id = q.id
   JOIN topic t ON q.topic_id = t.id
   WHERE s.member_uuid = :uuid
     AND s.submitted_at >= :since
     AND t.is_active = true
   ```
3. **활성 토픽 전체 수** — `TopicRepository.countByIsActiveTrue()`

`ExamScheduleService.fetchSelected()` 재사용해 `daysUntilExam` 계산.

### 6.3 성능

- 홈 진입 시 1회 호출 → 초기에는 **캐싱하지 않는다**. 매번 신선한 값 계산.
- 쿼리 3개 모두 인덱스 적중(`submission(member_uuid, submitted_at)`, `topic(is_active)`)하면 수십 ms 내 처리 가능.
- 병목 관측되면 그때 Redis 1분 TTL 캐시 도입. 지금은 YAGNI.

### 6.4 타임존

- `lastStudiedAt`은 UTC ISO-8601로 반환 (기존 API 규칙 따름).
- Recency 계산 및 `daysUntilExam` 계산은 **KST 캘린더 기준** 일수 차이.
- `LocalDate.now(ZoneId.of("Asia/Seoul"))` 사용.

## 7. 테스트

### 7.1 ReadinessCalculatorTest (단위)

- 시도 0건 → `score=0.0, accuracy=0.0, coverage=0.0, recency=0.70`
- 완벽 케이스: Accuracy=1.0, Coverage=1.0, Recency=1.0 → `score=1.00`
- Recency 경계: 경과일 0, 1, 2, 3, 4, 7, 8, 14, 15, 30 각각 매핑 확인
- Coverage: 활성 토픽 5개 중 3개 커버 → `0.60`
- Coverage 분모 0 방어 → `0.00`
- Accuracy 최근 50 윈도우 경계: 시도 49, 50, 51, 100개일 때 정답률 계산 일관성
- 반올림: 0.666... → 0.67 확인

### 7.2 ToneKeyResolverTest (단위)

- `daysUntilExam == null` → `NO_EXAM` (다른 조건 무시)
- `recentAttemptCount == 0` & `daysUntilExam = 27` → `ONBOARDING` (D-day 무시)
- D-day 경계값: -1, 0, 1, 6, 7, 14, 15, 30, 31 → 각각 `POST_EXAM, TODAY, SPRINT, SPRINT, PUSH, PUSH, STEADY, STEADY, EARLY`
- 우선순위: `NO_EXAM > ONBOARDING > POST_EXAM > TODAY > SPRINT > PUSH > STEADY > EARLY`

### 7.3 ProgressServiceIntegrationTest (통합)

- `/progress` 응답 스키마 검증: 기존 필드 3개 보존 + `readiness` 블록 존재
- 빈 상태 사용자 → `score=0.0, toneKey=ONBOARDING 또는 NO_EXAM`
- 선택된 시험 일정 있는 사용자 → `daysUntilExam != null`, 적절한 toneKey
- 선택된 시험 일정 없는 사용자 → `daysUntilExam = null, toneKey = NO_EXAM`

## 8. 스코프에서 제외한 것 (YAGNI)

아래 항목들은 의도적으로 **이번 스프린트에서 제외**한다. 필요해지면 별도 설계.

- **토픽별 가중치** — 토픽 동적 수정 가능성 때문에 버림
- **난이도 보정** — 3요소로 충분. 필요 시 Accuracy 내부에 난이도 가중 평균으로 추가 가능
- **Readiness 이력 저장 / 추세 그래프** — 현재값만 계산. 저장은 다음 스프린트
- **Readiness 예측 (시험일 도달 예상치)** — 예측 틀릴 때 신뢰 깎임. 데이터 쌓은 후 고려
- **Redis 캐싱** — 병목 관측 전엔 도입하지 않음
- **서브토픽 단위 Coverage** — 토픽 단위로 충분. 세밀화는 UI 요구 생길 때
- **카피 문자열 관리** — FE 책임

## 9. FE 가이드라인 (참고)

UI는 FE가 판단하지만, 백엔드가 설계한 의도를 살리기 위한 최소 가이드:

- `score`는 **홈에서 가장 시인성 높은 위치**에 노출하는 것을 권장. "정직 모드 5%"는 크게 보여야 "출발선"으로 느껴진다. 구석에 작게 두면 오히려 창피함이 됨.
- 3요소(`accuracy`, `coverage`, `recency`)를 **탭/토글로 드릴다운** 가능하게 하면, 사용자가 "왜 이 점수인지" 이해할 수 있어 정직 모드의 신뢰를 받는다.
- `toneKey` × `scoreBand` 매트릭스(24칸)는 FE에서 단일 파일에 모아두고, 공란 없이 채우는 것을 권장.
- progress 바가 사용되는 경우, **이제는 의미가 있다** — 무한 문제 분모 문제가 해결됐으므로.

## 10. 마이그레이션 / 호환성

- 기존 필드(`solvedCount`, `correctRate`, `streakDays`)는 **100% 보존**한다.
- 기존 FE는 `readiness` 필드를 무시하면 종전과 동일하게 동작한다.
- DB 스키마 변경 없음. 기존 `submission`, `question`, `topic` 테이블만 읽는다.
- 신규 인덱스 필요성은 쿼리 EXPLAIN 후 결정.
