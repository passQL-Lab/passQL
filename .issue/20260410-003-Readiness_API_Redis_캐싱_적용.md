# ⚙️[기능개선][Submission] Readiness API Redis 캐싱 적용

**라벨**: `작업전`
**담당자**:

---

📝현재 문제점
---

- `/progress` 1회 호출 시 Readiness 계산에만 다수의 DB 쿼리(최근 시도 N개, 활성 토픽 수, 토픽 커버리지, ExamSchedule 등)가 발생한다.
- 홈 화면 진입 시마다 매번 재계산되어 트래픽이 늘면 DB 부하가 선형 증가한다.
- Readiness는 사용자가 새 제출을 하기 전까지 값이 거의 변하지 않으므로 캐시 적합도가 높다.

🛠️해결 방안 / 제안 기능
---

- Redis 키: `readiness:{memberUuid}` , TTL 5~10분.
- 새 Submission 저장 시 해당 키 invalidate.
- ExamSchedule 변경 시 전체 invalidate (또는 짧은 TTL로 자연 만료 허용).
- 캐시 미스 시에만 `ProgressService.buildReadiness` 호출.

🔗관련
---

- 선행: #52 (Readiness 도입)

🙋‍♂️담당자
---

-
