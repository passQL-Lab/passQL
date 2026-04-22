# ❗[버그][QuestionReport] 문제 신고 API 코드 품질 버그 수정

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- 관리자 신고 목록 조회 API에서 신고 건수만큼 문제 제목(stem)을 개별 쿼리로 조회하는 N+1 문제 발생
- 신고 입력 검증 로직이 Controller에 위치해 CLAUDE.md 규칙 위반 (Controller에 비즈니스 로직 금지)
- `nativeQuery` 결과의 `Timestamp` 캐스팅이 DB 드라이버에 따라 `ClassCastException` 발생 가능
- `question_report_category` 테이블에 복합 PK가 없어 동일 카테고리 중복 삽입 가능

🔄재현 방법
---

1. 관리자 신고 목록 API(`GET /admin/api/reports`) 호출 시 신고 건수 N만큼 `SELECT` 쿼리 N+1 발생 확인
2. `POST /api/questions/{questionUuid}/report` 요청 시 입력 검증이 Controller 레이어에서 수행됨
3. `question_report_category`에 동일 `(question_report_uuid, category)` 조합 중복 삽입 시 DB 레벨 차단 없음

📸참고 자료
---

- `server/PQL-Application/src/main/java/com/passql/application/service/QuestionReportService.java`
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminReportController.java`
- `server/PQL-Web/src/main/java/com/passql/web/controller/QuestionReportController.java`
- `server/PQL-Web/src/main/resources/db/migration/V0_0_120__add_question_report.sql`

✅예상 동작
---

- 신고 목록 조회 시 문제 제목은 questionUuid 목록 일괄 조회로 처리 (쿼리 1회)
- 입력 검증은 Service 레이어에서 수행
- Timestamp 타입 안전하게 처리
- `question_report_category` 복합 PK `(question_report_uuid, category)`로 중복 삽입 DB 레벨 차단

⚙️환경 정보
---

- **OS**:
- **브라우저**:
- **기기**:

🙋‍♂️담당자
---

- **백엔드**: 이름
- **프론트엔드**: 이름
- **디자인**: 이름
