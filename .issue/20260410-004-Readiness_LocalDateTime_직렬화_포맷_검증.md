# 🐛[버그검증][Submission] Readiness 응답 LocalDateTime 직렬화 포맷 검증

**라벨**: `작업전`
**담당자**:

---

📝현재 문제점
---

- `ReadinessResponse.lastStudiedAt`이 `LocalDateTime`으로 노출되어 있어 FE가 기대하는 ISO-8601 포맷(`2026-04-10T12:34:56`)으로 직렬화되는지 확인이 필요하다.
- `Jackson JavaTimeModule` / `WRITE_DATES_AS_TIMESTAMPS` 설정에 따라 배열(`[2026,4,10,...]`) 또는 epoch로 나갈 위험이 있다.

🛠️해결 방안 / 제안 기능
---

- `ObjectMapper` 설정 점검 (이미 JavaTimeModule 등록되어 있는지).
- 통합 테스트로 `/progress` 응답 JSON을 캡처해 `lastStudiedAt` 필드 형식 확인.
- 필요 시 `@JsonFormat(shape = STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")` 명시.

🔗관련
---

- 선행: #52

🙋‍♂️담당자
---

-
