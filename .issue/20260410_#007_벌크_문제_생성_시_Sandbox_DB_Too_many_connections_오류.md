# ❗[버그][Sandbox] 벌크 문제 생성 시 Sandbox DB "Too many connections" 오류 발생

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 관리자 페이지에서 JSON 벌크 문제 가져오기(50문항) 검증 시, Lv.3 이상 문항부터 `Too many connections` 오류가 연속 발생하여 30문항이 실패함
- 초반 Lv.1~2 문항은 DDL 문법 오류(SQL syntax)로 일부 실패하고, Lv.3 이상부터는 MariaDB 커넥션 한도 초과로 샌드박스 DB 자체가 생성되지 않음
- 벌크 요청 시 각 문항마다 `SandboxPool.acquire()` → `CREATE DATABASE` → `DataSource` 생성 흐름이 동시에 실행되어 DB 연결이 순식간에 소진됨

🔄재현 방법
---

1. 관리자 > 문제 등록 > JSON 불러오기 탭 진입
2. 50문항 이상이 포함된 JSON 파일 업로드
3. "전체 검증" 또는 "등록" 실행
4. Lv.3 이상 문항부터 아래 오류 연속 발생 확인

```
샌드박스 DB 생성 실패: (conn=18981) Too many connections
샌드박스 DB 생성 실패: (conn=19006) Too many connections
샌드박스 DB 생성 실패: (conn=19007) Too many connections
...
```

📸참고 자료
---

- conn 번호가 18981 → 19040 까지 순식간에 증가 (50회 이상 연결 시도)
- 초반 오류: `DDL 적용 실패: SQL syntax error near ' BONUS NUMBER )' at line 2` (별도 이슈 대상)
- 후반 오류: `샌드박스 DB 생성 실패: Too many connections`

✅예상 동작
---

- 벌크 문항 검증 시에도 MariaDB 연결 한도를 초과하지 않아야 함
- 각 문항 검증이 순차 처리되거나, 동시 처리 시 연결 수를 제한하는 구조가 필요함
- 검증 완료 후 Sandbox DB가 정상적으로 `DROP`되어 연결이 반환되어야 함

⚙️환경 정보
---

- **Sandbox DB**: MariaDB (시놀로지 NAS)
- **현재 Main DB Pool**: HikariCP `maximum-pool-size: 5`
- **Sandbox 연결 방식**: 문항당 동적 DB 생성 (`SandboxPool.acquire()`) — 풀링 없음
- **문제 발생 시점**: 벌크 검증 50문항 요청 시

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
