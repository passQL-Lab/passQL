🎯 [기능추가][Server] Daily Challenge 도메인 및 오늘의 챌린지 API + 어드민

📝 현재 문제점
---

- 홈 화면 "오늘의 문제" 카드에 표시할 일일 챌린지 데이터를 백엔드에서 결정해 내려줘야 하지만, 관련 도메인이 없습니다.
- 어드민이 미리 캘린더에 문제를 배정해두는 큐레이션 기능이 필요하며, 어드민이 안 채운 날에도 카드가 비어 보이지 않도록 폴백이 필요합니다.
- 같은 사용자가 오늘 챌린지를 이미 풀었는지 표시(`alreadySolvedToday`)도 필요합니다.

🛠️ 해결 방안 / 제안 기능
---

- `daily_challenge` 신규 테이블을 생성하여 (날짜, 문제) 매핑을 관리합니다. 하루에 1문제만 배정 가능 (`UNIQUE(challengeDate)`).
- 어드민이 특정 날짜에 문제를 배정해두면 그것을 사용하고, 없으면 활성 문제 풀에서 **날짜 시드 결정적 선택**으로 폴백합니다.
- 사용자가 오늘 해당 문제를 이미 제출했는지 여부를 함께 응답합니다.
- 어드민 화면에서 캘린더 기반으로 미래 날짜에 문제를 배정/해제할 수 있게 합니다.

📚 참고 문서
---

- 설계 문서: `docs/superpowers/specs/2026-04-08-홈화면-백엔드-설계.md` §4.3, §5.2
- 의존: `.issue/20260408-001-Flyway_V1_보강_submission_및_question_is_active.md` (question.is_active, submission)

⚙️ 작업 내용
---

### 📌 도메인

- [ ] `DailyChallenge extends BaseEntity` 엔티티
  - `dailyChallengeUuid` UUID PK
  - `challengeDate` LocalDate (UNIQUE)
  - `questionUuid` UUID FK → question
- [ ] `DailyChallengeRepository extends JpaRepository<DailyChallenge, UUID>`
  - `Optional<DailyChallenge> findByChallengeDate(LocalDate date)`
  - `List<DailyChallenge> findByChallengeDateBetweenOrderByChallengeDateAsc(LocalDate from, LocalDate to)`

### 📌 Flyway

- [ ] V?: `daily_challenge` 테이블 생성
  - `UNIQUE(challenge_date)`
  - FK → question(`question_uuid`)
- [ ] 시드 없음 (폴백 자동 동작)

### 📌 사용자 API

- [ ] `GET /api/questions/today?memberUuid={uuid?}` 엔드포인트 추가
- [ ] Response DTO: `TodayQuestionResponse { question, alreadySolvedToday }`
  - `question`: `{ questionUuid, topicName, difficulty, stemPreview }` 또는 `null`
- [ ] 선정 로직
  ```
  todayRow = dailyChallengeRepo.findByChallengeDate(today)
  if (todayRow != null) {
    question = questionRepo.findById(todayRow.questionUuid)
  } else {
    activeIds = questionRepo.findActiveUuidsOrderedByCreatedAt()
    if (activeIds.isEmpty()) return null
    seed = today.toEpochDay()
    question = questionRepo.findById(activeIds[seed % activeIds.size()])
  }
  ```
- [ ] `alreadySolvedToday`
  - `memberUuid` 있으면 `submissionRepo.existsByMemberUuidAndQuestionUuidAndSubmittedAtBetween(memberUuid, questionUuid, todayStart, todayEnd)`
  - 없으면 false
- [ ] 활성 문제 0개 → `{ question: null, alreadySolvedToday: false }`

### 📌 어드민 API

- [ ] `GET /admin/daily-challenges?from={date}&to={date}` — 캘린더 조회 (배정된 행만 반환)
- [ ] `PUT /admin/daily-challenges/{date}` — 배정/교체
  - body: `{ questionUuid }`
  - 해당 날짜에 행이 있으면 update, 없으면 insert (upsert)
  - questionUuid가 활성 문제가 아니면 422
- [ ] `DELETE /admin/daily-challenges/{date}` — 배정 해제 (폴백 복귀)

### 📌 어드민 화면 (Thymeleaf, D5)

- [ ] `/admin/daily-challenges` 페이지
  - 월별 캘린더 뷰 (이번 달 ± 1)
  - 각 날짜 칸: 배정된 문제 ID/지문 미리보기 또는 "(폴백)"
  - 칸 클릭 → 문제 선택 모달 (활성 문제 검색/리스트) → 배정
  - "해제" 버튼

### ✅ 단위 테스트

- [ ] `QuestionService.getToday`
  - 큐레이션 hit (오늘 행 존재)
  - 폴백 (오늘 행 없음, 활성 문제 5개)
  - 활성 문제 0개 → null
  - 같은 날짜는 항상 같은 폴백 결과 (결정성)
  - `memberUuid` null → `alreadySolvedToday = false`
  - `memberUuid` 제출 있음 → true
  - `memberUuid` 제출 없음 → false

🙋‍♂️ 담당자
---

- 백엔드: SUH SAECHAN
