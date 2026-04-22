# ⚙️[기능개선][Import] Oracle SQL 방언 MariaDB 호환 처리 부재로 벌크 임포트 Sandbox 실패

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- SQLD 시험 기출 문제를 벌크 임포트할 때 Oracle 전용 SQL 문법이 MariaDB Sandbox에서 실행되지 않아 `sandboxStatus: FAIL`로 처리되는 문제
- Oracle과 MariaDB 간 1:1 치환 가능한 문법(예: `NVL → IFNULL`, `SYSDATE → NOW()`)이 존재함에도 이를 자동 변환하지 않아 정상적인 문제가 검증 실패로 처리됨
- Oracle 전용이라 MariaDB에서 근본적으로 실행 불가한 문법(`CONNECT BY`, `ROWNUM`, `(+)` Outer Join 등)은 치환 대상이 아닌 `CONCEPT_ONLY` 전환 대상으로 별도 처리가 필요함
- 이 두 케이스가 구분되지 않아 모든 Oracle 문법 문제가 `FAIL` 처리됨

🔄재현 방법(발견 경위)
---

1. SQLD 기출 문제 JSON을 `/admin/questions/import/validate`로 벌크 임포트 검증 요청
2. 검증 결과 화면에서 다수의 문제가 `FAIL` 상태로 표시됨
3. 실패 메시지 확인 시 `NVL`, `SYSDATE`, `CONNECT BY`, `ROWNUM`, `FROM DUAL` 등 Oracle 전용 문법에 의한 MariaDB 실행 오류 확인
4. 로컬에서 동일 SQL을 MariaDB에 직접 실행하여 동일 오류 재현 → Oracle 방언 호환 문제임을 확인

📸참고 자료
---

- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionImportExportService.java` — `validateSingleItem()`, `importBatch()` 메서드
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java` — 단일 문제 직접 등록 `/register` 핸들러
- `server/PQL-Web/src/main/resources/static/docs/question-bulk-guide.md` — 문제 등록 가이드 문서 (Oracle 방언 대응 안내 누락)

✅예상 동작
---

- **1:1 치환 가능한 Oracle 문법**: 임포트/등록 시 서버가 자동으로 MariaDB 호환 문법으로 변환 후 Sandbox 실행 (사용자에게 투명하게 처리)
  - `NVL(a, b)` → `IFNULL(a, b)`
  - `SYSDATE` → `NOW()`
  - `TO_DATE(...)` → `STR_TO_DATE(...)`
  - `SUBSTR` → `SUBSTRING`
  - `INSTR` → `LOCATE` 등
- **MariaDB에서 근본적으로 실행 불가한 Oracle 전용 문법**: `CONCEPT_ONLY`로 자동 전환하여 Sandbox 스킵
  - `CONNECT BY`, `START WITH`, `ROWNUM`, `(+)` Outer Join, `PIVOT`, `MERGE INTO`, `.NEXTVAL` 등
- **문제 등록 가이드 문서** 업데이트: Oracle 기준으로 문제를 작성해도 된다는 안내, 자동 치환/전환 동작 명시

🛠️해결 방안 / 제안 기능
---

- `QuestionImportExportService`에 Oracle → MariaDB 1:1 문법 치환 메서드 구현
  - `answerSql`, `schemaDdl`, `schemaSampleData` 필드 대상으로 치환 적용
  - 치환은 대소문자 무관, 함수 인자 보존 방식으로 처리
- 치환 후에도 실행 불가한 Oracle 전용 문법 키워드 감지 → `CONCEPT_ONLY` 자동 전환 (현재 `detectOracleOnlySyntax()` 구현 완료, 치환 선적용 후 감지 순서로 변경 필요)
- 단일 문제 직접 등록(`/register`) 핸들러에도 동일한 치환+전환 로직 적용
- `question-bulk-guide.md`에 Oracle 문법 사용 허용 및 자동 처리 동작 안내 추가

🙋‍♂️담당자
---

- 백엔드: @Cassiiopeia
- 프론트엔드: 
- 디자인: 
