# ❗[버그][AI/Sandbox] AI 선택지 body에 SQL 대신 실행 결과 텍스트 반환으로 Sandbox 검증 전체 실패

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- Gemini fallback(직접 호출) 시 선택지 `body` 필드에 실행 가능한 SQL 쿼리가 아닌 **쿼리 실행 결과 텍스트**(예: `NAME | DEPT_NAME\n홍길동 | 개발팀`)가 반환됨
- `SandboxValidator`가 해당 body를 MariaDB에 그대로 실행 → SQL syntax error 발생
- 4개 선택지 모두 `ERROR` 상태가 되어 `correctCount=0` → `CHOICE_SET_VALIDATION_NO_CORRECT` 에러
- 3회 재시도 모두 실패 → CustomException throw → SSE error 이벤트 전송
- 프론트엔드에서 SSE 스트림 종료 시 마지막 버퍼 청크를 처리하지 않는 버그로 인해 에러 이벤트가 도달하지 못하고 화면이 "선택지 생성 중..." 스피너 상태로 계속 멈춤

🔄재현 방법
---

1. Python AI 서버가 오프라인 상태(401 Unauthorized)이거나 Circuit Breaker가 열린 상태에서 Gemini fallback 동작
2. `SELECT A.NAME, B.DEPT_NAME FROM EMP A, DEPT B WHERE A.DEPT_ID = B.DEPT_ID` 같은 JOIN 문제 풀이 페이지 진입
3. SSE `/generate-choices` 호출 → Gemini fallback 실행
4. Gemini가 `body`에 SQL 대신 실행 결과 텍스트를 반환
5. 3회 재시도 모두 실패 → 화면에서 스피너가 영원히 멈추지 않음

📸참고 자료
---

**에러 로그 (핵심 부분)**:
```
WARN o.m.jdbc.message.server.ErrorPacket: Error: 1064-42000: You have an error in your SQL syntax;
  ... near 'NAME | DEPT_NAME\n홍길동 | 개발팀\n김영희 | 개발팀' at line 1

DEBUG [choice-gen] Sandbox 검증 완료: attempt=3, correctCount=0
INFO  [choice-gen] validation failed: code=CHOICE_SET_VALIDATION_NO_CORRECT, attempt=3/3
ERROR [choice-gen] 최대 재시도 초과: lastErrorCode=CHOICE_SET_VALIDATION_NO_CORRECT
ERROR [generate-choices] CustomException 발생: code=CHOICE_SET_VALIDATION_NO_CORRECT
```

**영향 파일**:
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java`
- `server/PQL-Web/src/main/resources/db/migration/` — `generate_choice_set` 프롬프트 시드
- `client/src/api/questions.ts` — `generateChoices()` SSE 스트림 파싱

✅예상 동작
---

- Gemini fallback 포함 모든 AI 경로에서 선택지 `body`에 실행 가능한 SELECT SQL 쿼리가 반환되어야 함
- Sandbox 검증 3회 시도 후 실패 시 SSE error 이벤트가 프론트엔드에 정상 전달되어야 함
- 프론트엔드에서 에러 수신 시 스피너가 멈추고 "선택지 생성에 실패했어요 / 다시 시도" UI가 표시되어야 함

⚙️환경 정보
---

- **서버**: Spring Boot (Java Virtual Thread), MariaDB
- **AI**: Gemini fallback (Python AI 서버 장애 시) — `GeminiFallbackClient.generateChoiceSet()`
- **프롬프트 키**: `generate_choice_set` v1

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
