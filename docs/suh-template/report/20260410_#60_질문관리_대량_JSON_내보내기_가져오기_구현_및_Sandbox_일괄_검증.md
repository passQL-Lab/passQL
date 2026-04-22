# 질문관리 대량 JSON 내보내기/가져오기 구현 및 Sandbox 일괄 검증

## 개요
질문 관리 페이지(`/admin/questions`)에 대량 JSON 내보내기/가져오기 기능을 추가했다. 기존에는 문제 직접 등록 페이지에서 단건 JSON만 불러올 수 있었으나, 이제 필터 조건 전체 또는 체크박스 선택 문제를 JSON 배열로 내보내고, JSON 파일을 가져올 때 EXECUTABLE 문제의 answerSql을 Sandbox에서 자동 검증한 뒤 등록/업데이트할 수 있다.

## 변경 사항

### DTO 신규 생성 (PQL-Domain-Question/dto)
- `QuestionExportDto.java`: 내보내기/가져오기 JSON 포맷. questionUuid(선택), topicCode, difficulty, executionMode, stem, hint, schemaDdl, schemaSampleData, schemaIntent, answerSql
- `ExportRequest.java`: 선택 내보내기 요청 DTO (UUID 배열)
- `ImportValidationResult.java`: 검증 결과 요약 (total, success, failed, newCount, updateCount, items)
- `ImportItemResult.java`: 개별 문제 검증 결과 (sandboxStatus: OK/FAIL/SKIP, importAction: NEW/UPDATE)
- `ImportRequest.java`: 가져오기 요청 DTO (items, importMode, sandboxStatuses)
- `ImportResult.java`: 가져오기 결과 (created, updated, skipped)

### Service 신규 생성
- `QuestionImportExportService.java`: 내보내기, Sandbox 일괄 검증, 가져오기 비즈니스 로직. SandboxPool/SandboxExecutor를 재활용하여 EXECUTABLE 문제의 DDL+샘플데이터 적용 후 answerSql 실행 테스트 수행

### Controller 수정
- `AdminQuestionController.java`: export/import 엔드포인트 4개 추가
  - `GET /admin/questions/export` — 필터 조건 기반 전체 내보내기 (JSON 파일 다운로드)
  - `POST /admin/questions/export` — 선택 UUID 기반 내보내기
  - `POST /admin/questions/import/validate` — 배치 Sandbox 검증
  - `POST /admin/questions/import` — 검증 후 실제 등록/업데이트

### Repository 수정
- `QuestionRepository.java`: `findByFiltersAll()` 메서드 추가 (페이징 없이 필터 조건 전체 조회, Pageable로 최대 500건 제한)

### ErrorCode 추가
- `ErrorCode.java`: `IMPORT_LIMIT_EXCEEDED` (한 번에 최대 100건), `EXPORT_NO_DATA` (내보낼 문제 없음)

### 프론트엔드 (Thymeleaf + JS)
- `questions.html`: 테이블에 체크박스 컬럼 추가, 액션 바에 "JSON 가져오기" / "필터 전체 내보내기" / "선택 내보내기" 버튼 추가, 가져오기 검증 결과 모달 추가
- `question-import-export.js` (신규): 체크박스 전체 선택/개별 선택/indeterminate 관리, 내보내기 (필터 전체/선택 UUID), 가져오기 (파일 선택 → 검증 API → 결과 모달 → 등록 API), XSS 방어용 escapeHtml

## 주요 구현 내용

### JSON 내보내기/가져오기 라운드트립
내보내기 시 `questionUuid`를 포함하여, 가져오기 시 uuid가 있으면 기존 문제 업데이트, 없으면 신규 등록으로 자동 분기한다. uuid를 지우면 복제/이관 용도로도 활용 가능하다. `topicUuid` 대신 `topicCode`를 사용하여 환경 간 이식성을 확보했다.

### Sandbox 일괄 검증 플로우
가져오기 시 프론트에서 JSON 파싱 후 `POST /import/validate`로 전송하면, 서버가 각 EXECUTABLE 문제에 대해 독립 sandbox DB를 생성(`SandboxPool.acquire()`)하고 DDL+샘플데이터 적용 후 answerSql을 실행하여 성공/실패를 판정한다. CONCEPT_ONLY 문제는 SKIP 처리. 검증 결과를 모달로 보여주고, "전체 등록" 또는 "성공한 것만 등록"을 선택할 수 있다.

### Sandbox 이중 실행 방지
등록(`POST /import`) 시 Sandbox를 다시 실행하지 않는다. 프론트에서 검증 결과의 `sandboxStatuses` 배열을 함께 전송하여, 서버는 FAIL 항목만 스킵하고 나머지를 등록/업데이트한다. sandboxStatuses가 null이거나 items 수와 불일치하면 안전하게 전체 스킵한다.

### N+1 쿼리 방지
- 내보내기: `toExportDtos()`에서 topicUuid 전체를 한번에 조회하여 `Map<UUID, String>` 캐싱
- 가져오기: `buildTopicCodeMap()`에서 topicCode 전체를 한번에 조회하여 `Map<String, UUID>` 캐싱

### 건수 제한
- 내보내기: 최대 500건 (`EXPORT_LIMIT`, Pageable 적용)
- 가져오기: 최대 100건 (`IMPORT_LIMIT`, 프론트+서버 양쪽 검증)

## 주의사항
- Entity/DB 스키마 변경 없음. Flyway 마이그레이션 불필요
- 기존 단건 JSON 스키마와 하위 호환 유지 (questionUuid 없이도 가져오기 동작)
- Sandbox 검증은 문제별로 독립 DB를 생성/삭제하므로, 100건 기준 약 100초 소요될 수 있음. 프론트에서 로딩 스피너로 안내
- `question-json-loader.js` (단건 등록/수정 전용)와 `question-import-export.js` (배치 전용)는 별도 파일로 분리되어 서로 영향 없음
