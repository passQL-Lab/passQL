📊 [기능추가][Server] Progress API 및 StreakCalculator 구현

📝 현재 문제점
---

- 홈 화면의 통계 카드(푼 문제 수, 정답률)와 스트릭 뱃지(🔥 연속 N일)를 채우려면 사용자별 학습 진도 집계 API가 필요합니다.
- 통계 화면(`/stats`)도 동일 API를 재사용하므로 단일 엔드포인트로 통합 응답을 제공해야 합니다.
- "프론트 비즈니스 로직 제로 원칙"에 따라 정답률 반올림과 스트릭 일수 계산은 모두 백엔드 책임입니다.

🛠️ 해결 방안 / 제안 기능
---

- `GET /api/progress` 엔드포인트를 신설하여 푼 문제 수, 정답률, 연속 학습 일수를 단일 응답으로 제공합니다.
- 같은 문제를 여러 번 풀어도 푼 문제 수는 distinct로 카운트하고, 정답률은 마지막 시도 기준으로 계산합니다.
- 스트릭 계산은 순수 함수(`StreakCalculator`)로 분리하여 단위 테스트를 쉽게 작성합니다.
- 오늘 미제출이지만 어제까지 연속이면 streak를 유지하는 "하루 그레이스" 정책을 적용합니다.

📚 참고 문서
---

- 설계 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md` §4.2
- 의존: `.issue/20260408-001-Flyway_V1_보강_submission_및_question_is_active.md`

⚙️ 작업 내용
---

### 📌 API

- [ ] `GET /api/progress?memberUuid={uuid}` 엔드포인트 추가
- [ ] Response DTO: `ProgressResponse { solvedCount, correctRate, streakDays }`
  - `correctRate`는 0.0~1.0 소수, 둘째 자리 반올림
- [ ] `memberUuid` 미존재 → 404, 제출 이력 0 → 200 + `{0, 0.0, 0}`

### 📌 SubmissionRepository 메서드 추가

- [ ] `long countDistinctQuestionUuidByMemberUuid(UUID memberUuid)`
- [ ] 정답률 계산 native query (마지막 시도 기준)
  ```sql
  WITH latest AS (
    SELECT DISTINCT ON (question_uuid) question_uuid, is_correct
    FROM submission
    WHERE member_uuid = :memberUuid
    ORDER BY question_uuid, submitted_at DESC
  )
  SELECT COALESCE(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END), 0) FROM latest
  ```
- [ ] `List<LocalDate> findSubmissionDatesByMemberUuid(UUID memberUuid)` (DESC, distinct)

### 📌 StreakCalculator (순수 함수)

- [ ] `int calculate(Set<LocalDate> submissionDates, LocalDate today)` 시그니처
- [ ] 알고리즘
  - 빈 셋 → 0
  - 오늘 포함 시 오늘부터, 미포함이지만 어제 포함 시 어제부터 (하루 그레이스)
  - 거기서부터 하루씩 거슬러 가며 셋에 존재하면 +1, 끊기면 stop

### 📌 ProgressService

- [ ] `ProgressService.getProgress(UUID memberUuid) → ProgressResponse`
- [ ] 정답률은 BigDecimal 둘째 자리 반올림 후 double 변환

### ✅ 단위 테스트

- [ ] `StreakCalculator`
  - 빈 셋 → 0
  - `[today]` → 1
  - `[today, yesterday, day-2]` → 3
  - 오늘 미포함 + `[yesterday, day-2]` → 2 (그레이스)
  - 오늘/어제 모두 미포함 → 0
  - 중간 끊김 `[today, day-2]` → 1
- [ ] `ProgressService`
  - 제출 0건 → `{0, 0.0, 0}`
  - 같은 문제 3회 제출(마지막만 정답) → `solvedCount=1, correctRate=1.0`
  - 다른 두 문제, 각 1회 제출(정답/오답) → `correctRate=0.5`

### 📌 어드민 (이번 이슈 범위 외)

- 본 이슈는 사용자 조회 API만 다룹니다. 어드민에서 수동으로 submission을 보정하는 기능은 별도 이슈에서 다룹니다 (현재 미정).

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
