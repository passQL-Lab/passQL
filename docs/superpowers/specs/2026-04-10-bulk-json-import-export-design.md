# 대량 JSON 내보내기/가져오기 + Sandbox 일괄 검증

## 개요

질문 관리 페이지(`/admin/questions`)에 대량 JSON 내보내기/가져오기 기능을 추가한다.
가져오기 시 EXECUTABLE 문제는 Sandbox에서 answerSql을 자동 실행하여 검증하고,
검증 결과를 미리보기로 보여준 뒤 등록/업데이트를 수행한다.

## JSON 포맷

기존 단건 JSON 스키마를 배열로 확장한다. `questionUuid`를 선택적으로 포함.

```json
[
  {
    "questionUuid": "abc-123-...",
    "topicCode": "sql_basic_select",
    "difficulty": 3,
    "executionMode": "EXECUTABLE",
    "stem": "지문 텍스트",
    "hint": "힌트 (nullable)",
    "schemaDdl": "CREATE TABLE ... (\\n으로 줄바꿈)",
    "schemaSampleData": "INSERT INTO ... (nullable)",
    "schemaIntent": "스키마 의도 (nullable)",
    "answerSql": "SELECT ... (EXECUTABLE 필수)"
  }
]
```

### questionUuid에 따른 가져오기 동작

| questionUuid | DB 존재 여부 | 동작 |
|---|---|---|
| 없음 (null) | - | 신규 등록 |
| 있음 | 존재 | 업데이트 |
| 있음 | 미존재 | 신규 등록 (uuid 무시, 새로 생성) |

---

## 1. JSON 내보내기 (Export)

### UI 변경 - questions.html

질문 목록 테이블에 체크박스 컬럼을 추가하고, 액션 바에 내보내기 버튼 2개를 배치한다.

```
[필터 영역] ... [필터 전체 내보내기] [선택 내보내기] [직접 등록] [AI 생성]
```

- **필터 전체 내보내기**: 현재 필터 조건(토픽, 난이도, 실행모드)에 매칭되는 전체 문제를 JSON 파일로 다운로드
- **선택 내보내기**: 체크박스로 선택한 문제만 JSON 파일로 다운로드 (선택 없으면 비활성)

### 체크박스

| 위치 | 동작 |
|---|---|
| 테이블 헤더 | 전체 선택/해제 토글 |
| 각 행 | 개별 선택. `data-uuid` 속성으로 questionUuid 보유 |

### 백엔드 API

#### `GET /admin/questions/export`

필터 조건 기반 전체 내보내기. 쿼리 파라미터는 기존 목록 조회와 동일.

| 파라미터 | 타입 | 설명 |
|---|---|---|
| topic | String | 토픽 코드 (optional) |
| difficulty | Integer | 난이도 (optional) |
| executionMode | String | EXECUTABLE / CONCEPT_ONLY (optional) |

- Response: `application/json` 파일 다운로드
- Content-Disposition: `attachment; filename="passql-questions-2026-04-10.json"`
- 페이징 없이 필터 조건 전체를 반환 (최대 제한: 500건)

#### `POST /admin/questions/export`

선택 UUID 기반 내보내기.

- Request Body: `{ "questionUuids": ["uuid1", "uuid2", ...] }`
- Response: 위와 동일한 JSON 파일 다운로드

### 내보내기 서비스 로직

`QuestionService`에 메서드 추가:

```java
// 필터 기반 전체 내보내기
List<QuestionExportDto> exportByFilter(String topicCode, Integer difficulty, String executionMode);

// UUID 목록 기반 내보내기
List<QuestionExportDto> exportByUuids(List<UUID> questionUuids);
```

`QuestionExportDto` (새 DTO):

```java
public record QuestionExportDto(
    UUID questionUuid,
    String topicCode,        // topicUuid → code 변환
    Integer difficulty,
    String executionMode,
    String stem,
    String hint,
    String schemaDdl,
    String schemaSampleData,
    String schemaIntent,
    String answerSql
) {}
```

Question Entity + Topic Entity에서 조합하여 생성. `topicUuid` 대신 `topicCode`를 사용하여 환경 간 이식성을 확보한다.

---

## 2. JSON 가져오기 (Import) + Sandbox 일괄 검증

### 플로우

```
[JSON 가져오기 버튼] → [파일 선택]
    → JS에서 JSON 파싱 + 기본 검증 (필수 필드 체크)
    → POST /admin/questions/import/validate (JSON 배열 전송)
    → 서버: 각 문제별 Sandbox 실행 + topicCode 유효성 + uuid 존재 여부 확인
    → 검증 결과 반환
    → 검증 결과 모달 표시
    → [전체 등록] 또는 [성공한 것만 등록] 클릭
    → POST /admin/questions/import (등록 대상 JSON 배열 전송)
    → 페이지 리로드 + 성공 메시지
```

### UI - 가져오기 버튼

질문 관리 페이지(`questions.html`) 액션 바에 추가:

```
[JSON 가져오기] [필터 전체 내보내기] [선택 내보내기] [직접 등록] [AI 생성]
```

### UI - 검증 결과 모달

가져오기 후 서버 검증 결과를 보여주는 대형 모달.

```
┌─────────────────────────────────────────────────┐
│  JSON 가져오기 검증 결과                          │
│                                                  │
│  전체: 25건  |  성공: 22건  |  실패: 3건          │
│  신규: 20건  |  업데이트: 5건                     │
│                                                  │
│  ┌──┬──────────────────┬────┬────┬──────┬─────┐  │
│  │# │ 지문 (50자)       │토픽│난이│Sandbox│상태 │  │
│  ├──┼──────────────────┼────┼────┼──────┼─────┤  │
│  │1 │ SELECT 문에서... │JOIN│Lv3 │ OK   │신규 │  │
│  │2 │ GROUP BY를...    │GRP │Lv2 │ OK   │수정 │  │
│  │3 │ 윈도우 함수...    │WIN │Lv5 │ FAIL │신규 │  │
│  │  │  → DDL 문법 오류: near "WINDO"...         │  │
│  │4 │ 개념: NULL 처리  │SEL │Lv1 │ SKIP │신규 │  │
│  └──┴──────────────────┴────┴────┴──────┴─────┘  │
│                                                  │
│          [취소]  [성공한 것만 등록]  [전체 등록]    │
└─────────────────────────────────────────────────┘
```

#### Sandbox 상태 컬럼

| 상태 | 의미 | badge |
|---|---|---|
| OK | answerSql 실행 성공 (행 수 표시) | badge-success |
| FAIL | answerSql 실행 실패 (에러 메시지 표시) | badge-error |
| SKIP | CONCEPT_ONLY 문제 (Sandbox 불필요) | badge-ghost |

#### 상태 컬럼

| 상태 | 의미 | badge |
|---|---|---|
| 신규 | questionUuid 없거나 DB 미존재 | badge-info |
| 수정 | questionUuid가 DB에 존재 | badge-warning |

### 백엔드 API

#### `POST /admin/questions/import/validate`

배치 Sandbox 검증.

- Request Body: JSON 배열 (QuestionExportDto 목록)
- Response:

```java
public record ImportValidationResult(
    int total,
    int success,
    int failed,
    int newCount,
    int updateCount,
    List<ImportItemResult> items
) {}

public record ImportItemResult(
    int index,                // 원본 배열 인덱스 (0-based)
    String stemPreview,       // 지문 50자 미리보기
    String topicCode,
    Integer difficulty,
    String executionMode,
    String sandboxStatus,     // "OK" | "FAIL" | "SKIP"
    Integer sandboxRowCount,  // OK일 때만
    Long sandboxElapsedMs,    // OK일 때만
    String sandboxError,      // FAIL일 때만
    String importAction       // "NEW" | "UPDATE"
) {}
```

#### 검증 로직 상세

각 문제에 대해 순차적으로:

1. **필수 필드 검증**: topicCode, difficulty, executionMode, stem 필수
2. **topicCode 유효성**: DB의 topic 테이블에 존재하는지 확인
3. **executionMode=EXECUTABLE이면 추가 필수**: schemaDdl, answerSql
4. **questionUuid 존재 여부**: uuid가 있으면 DB 조회 → NEW/UPDATE 판정
5. **Sandbox 실행** (EXECUTABLE만):
   - `SandboxPool.acquire()` → `SandboxExecutor.applyDdl()` → `SandboxExecutor.execute(answerSql)` → `SandboxPool.release()`
   - **문제별로 독립된 sandbox DB 사용** (격리)
   - 결과의 status가 "OK"이면 성공, "ERROR"이면 실패

#### Sandbox 실행 최적화

대량 처리 시 sandbox DB를 매 문제마다 생성/삭제하면 느릴 수 있다.
**현재 구현(`SandboxPool`)은 문제별 독립 DB** 방식이므로 격리성은 보장된다.
하나의 sandbox DB를 재사용하되 매번 `DROP TABLE IF EXISTS` + 재생성하는 최적화는 v2에서 검토.

**현재 MVP**: 문제별 acquire/release 그대로 사용. 50문제 기준 약 50초 이내 예상.

#### `POST /admin/questions/import`

검증 후 실제 등록/업데이트.

- Request Body:

```java
public record ImportRequest(
    List<QuestionExportDto> items,
    String importMode  // "ALL" | "SUCCESS_ONLY"
) {}
```

- `ALL`: 모든 문제 등록 (Sandbox 실패 포함)
- `SUCCESS_ONLY`: Sandbox 성공 + CONCEPT_ONLY만 등록

- Response:

```java
public record ImportResult(
    int created,
    int updated,
    int skipped
) {}
```

- 등록 로직:
  - `questionUuid` 없음 / DB 미존재 → `QuestionGenerateService.createQuestionOnly()` 호출
  - `questionUuid` DB 존재 → `QuestionService.updateQuestion()` 호출

---

## 3. 파일 변경 목록

### 신규 파일

| 파일 | 모듈 | 설명 |
|---|---|---|
| `QuestionExportDto.java` | PQL-Domain-Question/dto | 내보내기/가져오기 JSON DTO |
| `ImportValidationResult.java` | PQL-Domain-Question/dto | 검증 결과 DTO |
| `ImportItemResult.java` | PQL-Domain-Question/dto | 개별 문제 검증 결과 |
| `ImportRequest.java` | PQL-Domain-Question/dto | 가져오기 요청 DTO |
| `ImportResult.java` | PQL-Domain-Question/dto | 가져오기 결과 DTO |
| `QuestionImportExportService.java` | PQL-Domain-Question/service | 내보내기/가져오기/검증 비즈니스 로직 |
| `question-import-export.js` | PQL-Web/static/js/admin | 프론트엔드 JS (체크박스, 내보내기, 가져오기 모달) |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `AdminQuestionController.java` | export/import 엔드포인트 4개 추가 |
| `questions.html` | 체크박스 컬럼, 내보내기/가져오기 버튼, 검증 결과 모달 추가 |
| `ErrorCode.java` | IMPORT_VALIDATION_FAILED, IMPORT_TOPIC_NOT_FOUND 등 에러코드 추가 |

### 변경 없음

| 파일 | 이유 |
|---|---|
| `SandboxPool.java` | 기존 acquire/release 그대로 사용 |
| `SandboxExecutor.java` | 기존 applyDdl/execute 그대로 사용 |
| `QuestionService.java` | 기존 updateQuestion 그대로 사용 |
| `QuestionGenerateService.java` | 기존 createQuestionOnly 그대로 사용 |
| `question-json-loader.js` | 단건 등록/수정 전용, 배치와 무관 |
| DB 스키마 | Entity 변경 없음, Flyway 마이그레이션 불필요 |

---

## 4. 프론트엔드 상세 (question-import-export.js)

### 체크박스 관리

```javascript
// 전체 선택 토글
function toggleSelectAll(masterCheckbox) { ... }

// 선택된 UUID 목록 반환
function getSelectedUuids() { ... }

// 선택 개수에 따라 "선택 내보내기" 버튼 활성/비활성
function updateExportButtonState() { ... }
```

### 내보내기

```javascript
// 필터 전체 내보내기 (GET, 현재 URL 파라미터 활용)
async function exportByFilter() {
    const params = new URLSearchParams(window.location.search);
    const resp = await fetch('/admin/questions/export?' + params.toString());
    downloadJsonBlob(resp);
}

// 선택 내보내기 (POST, UUID 배열)
async function exportSelected() {
    const uuids = getSelectedUuids();
    const resp = await fetch('/admin/questions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionUuids: uuids })
    });
    downloadJsonBlob(resp);
}

// Blob → 파일 다운로드
function downloadJsonBlob(response) { ... }
```

### 가져오기

```javascript
// 파일 선택 → JSON 파싱 → validate API 호출 → 모달 렌더링
async function handleImportFile(event) {
    const file = event.target.files[0];
    const text = await file.text();
    const items = JSON.parse(text);
    
    // 서버 검증
    const resp = await fetch('/admin/questions/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
    });
    const result = await resp.json();
    
    renderValidationModal(result, items);
}

// 검증 결과 모달 렌더링
function renderValidationModal(result, originalItems) { ... }

// 등록 실행
async function executeImport(items, mode) {
    await fetch('/admin/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, importMode: mode })
    });
    location.reload();
}
```

---

## 5. 제약사항 및 향후 고려

- **최대 가져오기 건수**: 한번에 100건으로 제한 (Sandbox 부하 관리)
- **Sandbox 타임아웃**: 문제당 10초 (기존 `SandboxExecutor` 설정 유지)
- **전체 검증 타임아웃**: 100건 * 10초 = 최대 ~1000초. 프론트에서 로딩 스피너 표시 필요
- **동시성**: validate API는 SandboxPool을 순차 사용. 동시에 여러 사용자가 대량 검증하면 sandbox DB가 많아질 수 있음 → 관리자 1명 환경에서는 문제 없음
- **v2 최적화 후보**: sandbox DB 재사용, 병렬 검증, 진행률 SSE 스트리밍
