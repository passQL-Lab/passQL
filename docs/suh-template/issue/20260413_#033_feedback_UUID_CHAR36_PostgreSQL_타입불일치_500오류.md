# ❗[버그][Server] feedback UUID 컬럼 CHAR(36) vs PostgreSQL uuid 타입 불일치 500 오류

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- `GET /api/feedback/me` 호출 시 500 오류 반환
- `V0_0_115__add_feedback_table.sql`에서 `feedback_uuid`, `member_uuid` 컬럼을 PostgreSQL 네이티브 `uuid` 타입이 아닌 `CHAR(36)` 문자열 타입으로 생성한 것이 원인
- Hibernate 6은 Java `UUID` 파라미터를 PostgreSQL `uuid` 타입으로 바인딩하는데, DB 컬럼이 `character` 타입이므로 `operator does not exist: character = uuid` 에러 발생

🔄재현 방법
---

1. `V0_0_115` 마이그레이션이 적용된 DB 환경에서 서버 실행
2. `GET /api/feedback/me` 호출
3. HTTP 500 응답 및 `operator does not exist: character = uuid` 에러 확인

📸참고 자료
---

```
ERROR: operator does not exist: character = uuid
Hint: No operator matches the given name and argument types.
      You might need to add explicit type casts.
Position: 174
```

관련 파일:
- `server/PQL-Web/src/main/resources/db/migration/V0_0_115__add_feedback_table.sql` (원인)
- `server/PQL-Web/src/main/resources/db/migration/V0_0_119__fix_feedback_uuid_column_types.sql` (수정 마이그레이션)
- `.report/20260413_#200_feedback_uuid_CHAR36_PostgreSQL_타입불일치_500오류.md` (트러블슈팅 보고서)

✅예상 동작
---

- `GET /api/feedback/me` 호출 시 200 응답과 함께 해당 회원의 건의사항 목록 반환

⚙️환경 정보
---

- **OS**: Linux (Production Server)
- **브라우저**: -
- **기기**: Spring Boot 3.4.4 / Hibernate 6.6.11 / PostgreSQL

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
