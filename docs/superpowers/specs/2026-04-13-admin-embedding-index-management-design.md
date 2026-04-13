# Admin Embedding Index Management Design

## 개요

관리자가 Qdrant 임베딩 색인 상태를 확인하고, 미색인 문제를 탐지하여 선택적 또는 전체 재색인을 실행할 수 있는 관리 화면을 구현한다.

- 기존 `questions.html`에 "선택 색인" 버튼 추가 (체크박스 선택 → 단건/다건 재색인)
- 신규 `/admin/embeddings` 페이지: 컬렉션 상태 카드 + 미색인 문제 목록 + 전체 재색인

---

## 범위

### Python AI 서버

**`qdrant_client.py` 추가 메서드 2개**

1. `get_collection_info(collection: str) -> dict`
   - `GET /collections/{collection}` 호출
   - 반환: `{ "points_count": int, "vector_size": int, "status": str }`
   - 디버그 로그: 요청 URL, 응답 status, points_count

2. `scroll_all_ids(collection: str) -> list[str]`
   - `POST /collections/{collection}/points/scroll` — `limit: 1000`, `with_payload: false`, `with_vector: false`
   - `next_page_offset` 기반 페이지네이션 루프
   - 반환: 전체 포인트 UUID 문자열 목록
   - 디버그 로그: 페이지 단위 수집 현황 (`page N: offset=..., count=...`), 최종 총 수집 수

**`ai_request.py` 추가**

```python
class IndexStatusRequest(BaseModel):
    question_uuids: list[str]  # Java가 DB에서 조회한 전체 문제 UUID 목록
```

**`ai_response.py` 추가**

```python
class IndexStatusResponse(BaseModel):
    collection_points_count: int   # Qdrant 현재 포인트 수
    db_question_count: int         # Java가 전달한 DB 문제 수
    unindexed_count: int           # 미색인 수
    unindexed_uuids: list[str]     # 미색인 문제 UUID 목록
```

**`ai_router.py` 추가 엔드포인트**

- `POST /api/ai/index-status`
  - body: `IndexStatusRequest`
  - `scroll_all_ids()`로 Qdrant UUID 세트 수집
  - `set(question_uuids) - qdrant_uuid_set` = 미색인 목록 계산
  - 반환: `IndexStatusResponse`
  - 디버그 로그: qdrant UUID 수, DB UUID 수, 차집합 크기

---

### Java 서버

**`AiGatewayClient.java` 추가 메서드**

```java
public IndexStatusResult getIndexStatus(List<String> questionUuids)
```
- `POST /api/ai/index-status` 호출
- 실패 시 null 반환 (non-critical)
- 디버그 로그: 요청 UUID 수, 응답 unindexed_count

**신규 DTO (PQL-Domain-AI)**

```java
record IndexStatusRequest(List<String> questionUuids) {}

record IndexStatusResult(
    int collectionPointsCount,
    int dbQuestionCount,
    int unindexedCount,
    List<String> unindexedUuids
) {}
```

**`QuestionRepository.java` 추가 쿼리**

```java
// 기존 codebase 패턴 준수: 네이티브 쿼리 + CAST(... AS varchar)
@Query(value = "SELECT CAST(question_uuid AS varchar) FROM question", nativeQuery = true)
List<String> findAllQuestionUuids();
```

**`AdminEmbeddingController.java` 신규 (PQL-Web)**

| 경로 | 메서드 | 역할 |
|------|--------|------|
| `GET /admin/embeddings` | GET | 임베딩 관리 페이지 (상태 카드 + 미색인 목록) |
| `POST /admin/embeddings/index-all` | POST | 전체 재색인 실행 |
| `POST /admin/embeddings/index-selected` | POST | 선택 UUID 목록 재색인 실행 |

`GET /admin/embeddings` 흐름:
1. `questionRepository.findAllQuestionUuids()` 로 전체 UUID 목록 조회
2. `aiGatewayClient.getIndexStatus(uuids)` 로 미색인 목록 수신
3. `IndexStatusResult`가 null이면 AI 서버 장애 상태로 표시
4. Model에 바인딩 후 `embeddings.html` 렌더링
5. 디버그 로그: DB UUID 수, AI 서버 응답 unindexed_count, 렌더링 소요 시간

`POST /admin/embeddings/index-all` 흐름:
1. `questionRepository.findAllQuestionUuids()` 로 전체 UUID 조회
2. Question 엔티티로부터 `IndexQuestionRequest` 목록 빌드 (토픽/태그 포함)
3. `aiGatewayClient.indexQuestionsBulk()` 호출
4. 결과(succeeded/failed) JSON 반환
5. 디버그 로그: 총 대상 수, 성공/실패 수, 소요 시간

`POST /admin/embeddings/index-selected` 흐름:
1. body: `{ "questionUuids": ["uuid1", ...] }`
2. UUID 목록으로 Question 조회 → `IndexQuestionRequest` 빌드
3. `aiGatewayClient.indexQuestionsBulk()` 호출
4. 결과 JSON 반환
5. 디버그 로그: 요청 UUID 수, 성공/실패 수

---

### Thymeleaf 화면

**`templates/admin/embeddings.html` 신규**

상단 상태 카드 (3개):
- Qdrant 총 포인트 수 (`collectionPointsCount`)
- DB 문제 수 (`dbQuestionCount`)
- 미색인 수 (`unindexedCount`) — 0이면 green badge, 양수면 warning badge

전체 재색인 버튼:
- "전체 재색인 실행" → 확인 모달 → `POST /admin/embeddings/index-all` (fetch) → 결과 토스트

미색인 문제 테이블:
- 체크박스 + 전체 선택/해제 (`selectAllCheckbox` + `toggleSelectAll()` 패턴 재사용)
- 컬럼: 체크박스, 문제 UUID, 토픽, 난이도, 등록일
- 툴바: "선택 색인" 버튼 (선택 없으면 disabled)
- 미색인 없으면 "모든 문제가 색인되어 있습니다" 빈 상태 표시

AI 서버 연결 실패 시:
- 상태 카드에 "AI 서버 연결 실패" 경고 배너 표시

**`templates/admin/questions.html` 수정**

기존 툴바에 "선택 색인" 버튼 추가:
```html
[선택 삭제]  [선택 색인]  [JSON ▼]  [문제 등록]
```
- 체크박스 선택 시 활성화 (기존 `onCheckboxChange()` 확장)
- 클릭 → `POST /admin/embeddings/index-selected` (fetch) → 결과 토스트

**`templates/admin/layout.html` 수정**

사이드바에 Embeddings 메뉴 항목 추가:
```html
<a href="/admin/embeddings">
  <i data-lucide="database-zap"></i>
  임베딩 관리
</a>
```

---

## 로깅 전략

모든 주요 경로에 `log.debug` / `log.info` / `log.warn` 명시:

| 위치 | 레벨 | 내용 |
|------|------|------|
| `scroll_all_ids` 페이지마다 | DEBUG | `page {n}: offset={offset}, collected={count}` |
| `scroll_all_ids` 완료 | INFO | `[index-status] Qdrant 총 {n}개 포인트 수집 완료` |
| `POST /api/ai/index-status` | INFO | `[index-status] DB={db_count}, Qdrant={qdrant_count}, 미색인={unindexed_count}` |
| `AdminEmbeddingController.page()` | INFO | `[embedding-mgmt] DB uuid_count={n}, unindexed={m}, elapsed={ms}ms` |
| `AdminEmbeddingController.indexAll()` | INFO | `[embedding-index-all] 시작: total={n}` |
| `AdminEmbeddingController.indexAll()` 완료 | INFO | `[embedding-index-all] 완료: succeeded={s}, failed={f}, elapsed={ms}ms` |
| `AdminEmbeddingController.indexSelected()` | INFO | `[embedding-index-selected] 요청 uuid_count={n}` |
| AI 서버 응답 null | WARN | `[embedding-mgmt] AI 서버 응답 없음 — 연결 실패` |

Python 측 로그는 `logger.debug` / `logger.info` / `logger.warning` 사용.

---

## 에러 처리

- AI 서버 장애 시 Java는 null 반환 — 화면에 "AI 서버 연결 실패" 배너 표시, 페이지 자체는 정상 렌더링
- Qdrant `scroll` 도중 실패 시 Python은 `CustomError` raise → Java warn 로그 + 화면 에러 배너
- 전체 재색인 도중 개별 문제 실패는 스킵하고 `failed_uuids`에 기록 (기존 `index_questions_bulk` 동작 그대로)

---

## 제외 범위

- 색인 이력 DB 저장 (언제 색인했는지 기록) — 별도 이슈
- 색인 진행 상황 실시간 SSE 스트리밍 — 별도 이슈
- 임베딩 모델 설정 변경 UI (B 서브시스템) — 별도 이슈
