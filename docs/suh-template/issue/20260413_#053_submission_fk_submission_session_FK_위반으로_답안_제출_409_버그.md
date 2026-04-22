# ❗[버그][제출] submission fk_submission_session FK 위반으로 답안 제출 409 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 문제 풀이 후 "답안 제출하기" 버튼 클릭 시 HTTP 409 에러 발생
- `submission` 테이블의 `session_uuid` 컬럼에 `quiz_session` 테이블을 참조하는 FK 제약(`fk_submission_session`)이 걸려 있으나, 단독 풀이 모드에서 클라이언트가 `crypto.randomUUID()`로 생성한 임의 UUID를 전달하기 때문에 FK 위반 발생
- `quiz_session` 테이블을 채우는 세션 생성 로직이 존재하지 않아, 어떤 sessionUuid를 전달해도 FK 위반이 발생하는 구조

🔄재현 방법
---

1. 단독 풀이 모드(`/questions/{questionUuid}`)로 이동
2. 선택지 생성 완료 후 보기 선택
3. "답안 제출하기" 버튼 클릭
4. HTTP 409 응답 수신 — 서버 로그에 `fk_submission_session` FK 위반 에러 확인

📸참고 자료
---

**서버 에러 로그:**
```
ERROR: insert or update on table "submission" violates foreign key constraint "fk_submission_session"
  Detail: Key (session_uuid)=(42054588-294e-4f1b-9342-630280e96101) is not present in table "quiz_session".
org.springframework.dao.DataIntegrityViolationException: could not execute statement
    at com.passql.submission.service.SubmissionService.submit(...)
    at com.passql.web.controller.QuestionController.submit(QuestionController.java:181)
```

**클라이언트 에러:**
```
POST /questions/{questionUuid}/submit 409 (Conflict)
{ errorCode: 'DATA_INTEGRITY_VIOLATION', message: '데이터 무결성 제약을 위반했습니다' }
```

**관련 파일:**
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/entity/Submission.java`
- `server/PQL-Domain-Submission/src/main/java/com/passql/submission/service/SubmissionService.java`
- `server/PQL-Web/src/main/resources/db/migration/V0_0_28__realtime_choice_set.sql` (FK 생성 위치)
- `server/PQL-Web/src/main/resources/db/migration/V0_0_70__convert_uuid_char_to_native.sql` (FK 재생성 위치)
- `client/src/hooks/useQuestionDetail.ts` (클라이언트 sessionUuid 생성 위치)

✅예상 동작
---

- 선택지를 고르고 "답안 제출하기"를 누르면 정상적으로 채점 결과 화면으로 이동해야 함
- `session_uuid`는 AI 코멘트 세션 집계용 느슨한 식별자로, `quiz_session` 레코드 존재 여부와 무관하게 저장되어야 함

⚙️환경 정보
---

- **OS**: macOS
- **브라우저**: Chrome
- **기기**: 웹

🙋‍♂️담당자
---

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름
