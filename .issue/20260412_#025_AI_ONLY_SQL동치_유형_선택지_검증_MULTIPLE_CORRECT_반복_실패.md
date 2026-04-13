# ❗[버그][선택지생성] AI_ONLY 정책에서 SQL 동치 유형 문제 MULTIPLE_CORRECT 반복 실패

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- `choiceSetPolicy=AI_ONLY` + `executionMode=EXECUTABLE` 조합의 "동일한 실행 결과를 내는 SQL은?" 유형 문제에서, AI가 생성한 오답 선택지가 실제로 정답 SQL과 동일한 실행 결과를 내어 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 오류가 최대 재시도(3회) 내내 반복된다.
- SQL 동치(Equivalence) 특성상 AI가 의도적으로 틀린 선택지를 만들어도 샌드박스 실행 결과가 정답과 동일하게 나올 수 있으며, 이는 재시도로 해결되지 않는 구조적 문제다.

🔄재현 방법
---

1. `choiceSetPolicy=AI_ONLY`, `executionMode=EXECUTABLE`인 SQL 동치 유형 문제 접근
   - 예: "다음 SQL과 동일한 실행 결과를 내는 SQL은?" 유형
2. `POST /api/questions/{questionUuid}/generate-choices` SSE 호출
3. 백엔드에서 3회 재시도 모두 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 발생
4. 선택지 생성 실패로 사용자에게 에러 반환

📸참고 자료
---

**에러 로그:**
```
[choice-gen] Sandbox 검증 완료: attempt=1, correctCount=2, questionUuid=fc143893-...
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=1/3

[choice-gen] Sandbox 검증 완료: attempt=2, correctCount=2, questionUuid=fc143893-...
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=2/3

[choice-gen] Sandbox 검증 완료: attempt=3, correctCount=2, questionUuid=fc143893-...
[choice-gen] validation failed: code=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT, attempt=3/3

[choice-gen] 최대 재시도 초과: questionUuid=fc143893-..., lastErrorCode=CHOICE_SET_VALIDATION_MULTIPLE_CORRECT
```

**재현 문제 정보:**
- 문제 UUID: `fc143893-2e86-4071-9e9f-a96c0ef2d745`
- stem: "다음 SQL과 동일한 실행 결과를 내는 SQL은? (Self Join 유형)"
- 3회 재시도 전부 `correctCount=2` 발생

✅예상 동작
---

- 정답이 1개인 유효한 선택지 세트가 생성되어야 한다.
- 또는 해당 문제 유형이 구조적으로 `AI_ONLY` 정책에 부적합함을 감지하여 `RESULT_MATCH` 정책으로 폴백하거나, 관리자에게 알림을 보내야 한다.

⚙️환경 정보
---

- **OS**: macOS
- **브라우저**: Chrome
- **기기**: PC

**관련 파일:**
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxValidator.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetResolver.java`

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
