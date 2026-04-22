# ⚙️[기능개선][DailyChallenge] 폴백 오늘의 문제 daily_challenge 자동 저장 스케줄러 구현

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- 관리자가 수동으로 배정하지 않은 날은 `daily_challenge` 테이블에 행이 없어 관리자 달력 화면에서 해당 날짜가 비어 보임
- 폴백 로직(`toEpochDay() % activeCount`)으로 문제는 정상 노출되지만 DB에 기록되지 않아 이력 추적 불가
- 활성 문제 수가 변경되면 과거 날짜의 폴백 결과가 달라지는 일관성 문제 발생

🛠️해결 방안 / 제안 기능
---

- 매일 자정 `@Scheduled(cron = "0 0 0 * * *")`로 당일 `daily_challenge` 행이 없으면 폴백 결과를 DB에 저장
- 스케줄러 실패 시 `resolveTodayQuestion()` 최초 조회 시점에 폴백 결과를 저장하는 백업 로직 추가
- 저장 후 관리자 달력에 자동 배정된 날짜도 이벤트로 표시됨

⚙️작업 내용
---

- `PQL-Web/scheduler/DailyChallengeScheduler.java` 신규 생성 — 자정 스케줄러
- `AdminDailyChallengeService.confirmFallback(LocalDate)` 메서드 추가 — 폴백 결과 저장 로직
- `QuestionService.resolveTodayQuestion()` 수정 — 폴백 조회 시 DB 저장 백업 추가

🙋‍♂️담당자
---

- 백엔드: 
