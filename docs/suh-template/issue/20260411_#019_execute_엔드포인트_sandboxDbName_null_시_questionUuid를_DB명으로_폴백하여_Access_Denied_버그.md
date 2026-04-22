# ❗[버그][Sandbox] /execute 엔드포인트가 sandboxDbName null 시 questionUuid를 DB명으로 폴백하여 Access Denied 발생

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 사용자가 문제 풀이 화면에서 선택지 "실행" 버튼을 클릭하면 `/api/questions/{questionUuid}/execute` 엔드포인트가 호출됨
- `question.sandboxDbName`이 null인 경우 `questionUuid` 문자열(`35a0ec50-5726-40e5-8c43-80d6a85173c9`)을 MariaDB DB명으로 그대로 사용하는 레거시 폴백 로직이 존재
- `sqld_runner` 계정은 `sandbox_xxxxx` 형태의 전용 샌드박스 DB에만 권한이 있어 해당 이름의 DB에 접근 불가 → `Access denied for user 'sqld_runner'@'localhost' to database '35a0ec50-...'` 에러 발생
- 현재 등록된 모든 문제가 `sandbox_db_name` 미설정 상태이므로 **모든 문제의 실행 버튼이 동작하지 않음**

🔄재현 방법
---

1. `sandbox_db_name`이 null인 EXECUTABLE 문제 풀이 페이지 진입
2. 선택지 중 하나의 "실행" 버튼 클릭
3. `SQLSyntaxErrorException: Access denied for user 'sqld_runner'@'localhost' to database '{questionUuid}'` 에러 카드 표시

📸참고 자료
---

**에러 로그**:
```
WARN HikariPool : Error: 1044-42000: Access denied for user 'sqld_runner'@'localhost' to database '35a0ec50-5726-40e5-8c43-80d6a85173c9'

Response Body: {"status":"ERROR","errorCode":"SQLSyntaxErrorException",
  "errorMessage":"(conn=4777) Access denied for user 'sqld_runner'@'localhost' to database '35a0ec50-5726-40e5-8c43-80d6a85173c9'"}
```

**영향 파일**:
- `server/PQL-Application/src/main/java/com/passql/application/service/QuestionExecutionService.java`
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxPool.java`

✅예상 동작
---

- `sandbox_db_name` 설정 여부와 무관하게 선택지 "실행" 버튼이 정상 동작해야 함
- `sandbox_db_name`이 없는 경우 `SandboxPool`을 통해 임시 DB를 생성 → 문제의 DDL + 샘플 데이터 적용 → SQL 실행 → DB drop 방식으로 처리되어야 함
- `SandboxValidator`(선택지 생성 시 검증)와 동일한 임시 DB 생성 방식을 사용해야 함

⚙️환경 정보
---

- **서버**: Spring Boot, MariaDB
- **DB 유저**: `sqld_runner` (sandbox_xxxxx 전용 권한)
- **문제 상태**: 현재 등록된 모든 문제의 `sandbox_db_name` 컬럼 = null

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
