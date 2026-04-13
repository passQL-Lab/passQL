# ❗[버그][Server/Client] executionMode·choiceSetPolicy 불일치로 인한 다중 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

문제 유형(executionMode / choiceSetPolicy)에 따른 처리 분기가 서버·클라이언트 양측에서 누락되어 있었으며, 아래 4가지 버그가 동시에 발생하였다.

1. **CONCEPT_ONLY 문제에서 `generate-choices` SSE 호출 → 서버 에러**
   - 프론트엔드에서 `executionMode` 체크 없이 항상 SSE 선택지 생성 요청을 보냄
   - 서버(`ChoiceSetResolver`)도 CONCEPT_ONLY에 대한 거부 처리 없이 AI 생성 로직으로 진입하여 에러 발생

2. **`/execute` 엔드포인트에서 `SANDBOX_SETUP_FAILED` 오류**
   - `QuestionExecutionService.executeChoice()`가 `sandboxDbName`이 null인 레거시 문제에서 DB를 찾지 못해 실패
   - `SubmissionService.submit()`도 동일한 문제 — `sandboxDbName` 없이 UUID 폴백 없이 실행

3. **`QuestionDetail` API 응답에 `choiceSetPolicy` 필드 누락**
   - 서버 DTO(`QuestionDetail`)에 `choiceSetPolicy`가 없어 API 응답에 포함되지 않음
   - 클라이언트 타입(`types/api.ts`)에도 미정의 → 프론트에서 정책 분기 불가

4. **ODD_ONE_OUT 문제 최초 등록 후 두 번째 생성 실패**
   - DB에 `AI_ONLY`로 저장된 문제를 `ODD_ONE_OUT` 유형처럼 운영 → 검증 로직 불일치

🔄재현 방법
---

1. CONCEPT_ONLY 문제 상세 페이지(`/questions/{uuid}`) 진입
2. 선택지가 없는 상태 → 프론트가 자동으로 SSE 선택지 생성 요청 발송
3. 서버에서 에러 응답 반환 → 빈 선택지 화면 고착

또는:

1. `sandboxDbName`이 null인 레거시 EXECUTABLE 문제의 선택지 클릭
2. `/execute` 호출 → `SANDBOX_SETUP_FAILED` 에러

📸참고 자료
---

- `ChoiceSetResolver.java` — CONCEPT_ONLY 거부 로직 누락
- `QuestionExecutionService.java` — sandboxDbName null 폴백 누락
- `SubmissionService.java` — sandboxDbName null 폴백 누락
- `QuestionDetail.java` — choiceSetPolicy 필드 누락
- `client/src/pages/QuestionDetail.tsx` — executionMode 미체크로 SSE 무조건 호출

✅예상 동작
---

- CONCEPT_ONLY 문제는 SSE 선택지 생성을 요청하지 않고 "선택지가 아직 준비되지 않았습니다" 메시지 표시
- sandboxDbName이 null인 레거시 문제는 questionUuid를 DB명 폴백으로 사용하여 정상 실행
- API 응답 `QuestionDetail`에 `choiceSetPolicy` 포함 → 클라이언트에서 유형별 UI 분기 가능
- ODD_ONE_OUT 문제는 DB에 해당 정책이 올바르게 저장되어 검증 로직과 일치

⚙️환경 정보
---

- **OS**: macOS
- **브라우저**: Chrome
- **기기**: Desktop
- **서버**: Spring Boot (PQL-Domain-Question, PQL-Domain-Submission, PQL-Application)
- **클라이언트**: React + TypeScript (Vite)

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
