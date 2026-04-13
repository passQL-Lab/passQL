# ❗[버그][Submission] EXECUTABLE 문제 제출 시 sandboxDbName null일 때 임시 DB 경로 누락으로 INTERNAL_SERVER_ERROR

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- EXECUTABLE 문제에서 `sandbox_db_name`이 null인 경우, `SubmissionService.submit()`이 `questionUuid`를 DB명으로 폴백하여 존재하지 않는 DB에 SQL을 실행하려다 `INTERNAL_SERVER_ERROR` 발생
- 동일 상황에서 `executeChoice()` (SQL 실행 미리보기)는 `SandboxPool`에서 임시 DB를 생성·DDL 적용·실행·drop하는 완전한 경로가 구현되어 있으나, `SubmissionService.submit()`에는 해당 경로가 구현되지 않음
- 결과적으로 클라이언트에는 "오답이에요 / 정답: ?" 가 표시되며 실제 채점이 이루어지지 않음

🔄재현 방법
---

1. `sandbox_db_name`이 null이고 `execution_mode = EXECUTABLE`인 문제 진입
2. 선택지 선택 후 제출 (`POST /api/questions/{questionUuid}/submit`)
3. 응답: `{"errorCode":"INTERNAL_SERVER_ERROR","message":"서버 내부 오류가 발생했습니다"}`
4. 화면에 "오답이에요 / 정답: ?" 표시

📸참고 자료
---

- 문제 UUID: `35a0ec50-5726-40e5-8c43-80d6a85173c9`
- choiceSetId: `15bcde23-3426-4387-92f0-996c149ad6e4`
- DB 확인 결과: `sandbox_db_name = NULL`, 폴백 DB(`questionUuid` 문자열)도 미존재
- 관련 코드:
  - `SubmissionService.submit()` — `SandboxPool` 미주입, 임시 DB 생성 경로 없음
  - `QuestionExecutionService.executeChoice()` — 정상 동작 (임시 DB 생성 경로 존재)

✅예상 동작
---

- `sandbox_db_name`이 null인 EXECUTABLE 문제 제출 시, `executeChoice()`와 동일하게 `SandboxPool`에서 임시 DB를 빌려 DDL·샘플데이터 적용 → SQL 실행 → drop 후 채점 결과 반환
- 정상적으로 정오답 판정 및 `correctKey` 반환

⚙️환경 정보
---

- **OS**: macOS
- **브라우저**: Chrome (Android 모바일 에뮬레이션)
- **기기**: 로컬 dev 서버

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
