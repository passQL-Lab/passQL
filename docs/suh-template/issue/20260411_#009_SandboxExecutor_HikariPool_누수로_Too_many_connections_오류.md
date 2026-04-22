# ❗[버그][Sandbox] SandboxExecutor HikariPool 누수로 Too many connections 오류 발생

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- `SandboxExecutor.execute()` 및 `applyDdl()` 호출 시 매번 `createDataSource()`로 새 HikariPool을 생성하지만, 사용 후 HikariPool 자체를 close하지 않아 커넥션이 누적됨
- 문제를 여러 번 풀다 보면 HikariPool이 누적되어 MariaDB `max_connections` 한도(기본 151)를 초과하고, 이후 모든 DB 작업이 `1040: Too many connections` 오류로 실패함
- 스프링 서버를 재시작하기 전까지 오류가 지속됨

🔄재현 방법
---

1. 로컬 스프링 서버 실행
2. 문제 풀기 화면에서 선택지 생성(generate-choices) 요청을 반복 수행
3. 약 15~20회 이후 HikariPool이 누적되어 `Too many connections` 오류 발생
4. 이후 모든 sandbox 관련 요청(선택지 생성, SQL 실행)이 `SANDBOX_SETUP_FAILED`로 실패

📸참고 자료
---

```
HikariPool-14 - Start completed.
HikariPool-15 - Start completed.
...
Error: 1040-HY000: Too many connections
Error: 1040-08004: Too many connections
[choice-gen] failed: questionUuid=..., attempts=1, errorCode=SANDBOX_SETUP_FAILED
```

- 관련 파일: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxExecutor.java`
- 관련 파일: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxPool.java`

✅예상 동작
---

- `execute()` / `applyDdl()` 완료 후 생성된 HikariPool(DataSource)이 자동으로 close되어 커넥션이 반환되어야 함
- 반복 실행해도 커넥션 수가 누적되지 않아야 함

⚙️환경 정보
---

- **OS**: macOS
- **런타임**: Spring Boot (로컬)
- **DB**: MariaDB (로컬)

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
