# ⚙️[기능추가][Report] 문제 신고 기능 구현 (신고 API, 관리자 관리 화면)

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- AI가 생성한 선택지/문제에 오류가 발생할 수 있으나 사용자가 이를 신고할 수 있는 수단이 없음
- 오류 있는 문제로 인해 사용자의 정답률이 억울하게 떨어질 수 있음
- 관리자가 문제 품질 이슈를 파악하고 추적할 방법이 없음

🛠️해결 방안 / 제안 기능
---

- 문제 풀기 결과 바텀시트에 신고 버튼 추가 (결과 확인 후에만 신고 가능)
- 복수 선택 가능한 신고 카테고리: 정답 오류 / 문제 오류 / 선택지 오류 / SQL 실행 결과 오류 / 기타
- 관리자 신고 관리 화면: 문제별 집계 목록 → 신고 건 상세 조회
- 관리자 처리 시 문제 비활성화 및 Submission 소급 보정 가능 (보정 범위: 문제 전체 or 선택지 세트 기준)

⚙️작업 내용
---

**백엔드**
- `QuestionReport` 엔티티 추가 (`PQL-Domain-Question`)
- `ReportCategory`, `ReportStatus`, `CorrectionScope` Enum 추가
- `question_report`, `question_report_category` 테이블 Flyway 마이그레이션
- 사용자 신고 API: `POST /api/questions/{questionUuid}/report`
- 신고 여부 조회 API: `GET /api/questions/{questionUuid}/report/status`
- 관리자 집계 목록 API: `GET /admin/api/reports`
- 관리자 신고 상세 API: `GET /admin/api/reports/{questionUuid}`
- 관리자 resolve API: `POST /admin/api/reports/{reportUuid}/resolve` (비활성화 + 소급 보정 포함)
- `QuestionReportService` 추가 (`PQL-Application`)
- ErrorCode 추가: `REPORT_ALREADY_EXISTS`, `REPORT_NOT_FOUND`, `REPORT_ALREADY_RESOLVED`

**프론트엔드**
- PracticeResult 화면 신고 버튼 추가 (이미 신고한 경우 비활성화)
- 신고 모달 컴포넌트 (daisyUI modal + checkbox, ETC 선택 시 textarea 표시)
- 관리자 `/admin/reports` 페이지 (문제별 집계 목록)
- 관리자 `/admin/reports/{questionUuid}` 페이지 (신고 상세 + 일괄 처리)

🙋‍♂️담당자
---

- 백엔드: 
- 프론트엔드: 
