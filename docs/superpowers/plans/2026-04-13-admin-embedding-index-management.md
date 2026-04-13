# Admin Embedding Index Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 Qdrant 임베딩 색인 상태를 확인하고 미색인 문제를 탐지하여 선택적/전체 재색인을 실행할 수 있는 관리 화면을 구현한다.

**Architecture:** Python AI 서버가 Qdrant scroll API로 전체 포인트 UUID를 수집하고, Java가 전달한 DB UUID와 차집합 계산하여 미색인 목록 반환. Java AdminEmbeddingController가 화면 렌더링 및 재색인 액션을 담당. questions.html 툴바에도 선택 색인 버튼 추가.

**Tech Stack:** Python FastAPI + httpx + Qdrant REST API, Spring Boot 3 / Thymeleaf / daisyUI, PostgreSQL native query

---

## File Map

| 파일 | 변경 유형 | 역할 |
|------|----------|------|
| `ai/src/services/qdrant_client.py` | 수정 | `get_collection_info()`, `scroll_all_ids()` 추가 |
| `ai/src/models/ai_request.py` | 수정 | `IndexStatusRequest` 추가 |
| `ai/src/models/ai_response.py` | 수정 | `IndexStatusResponse` 추가 |
| `ai/src/services/ai_service.py` | 수정 | `get_index_status()` 추가 |
| `ai/src/apis/ai_router.py` | 수정 | `POST /api/ai/index-status` 추가 |
| `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusRequest.java` | 신규 | Java → Python 요청 DTO |
| `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusResult.java` | 신규 | Python → Java 응답 DTO |
| `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java` | 수정 | `getIndexStatus()` 추가 |
| `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java` | 수정 | `findAllQuestionUuids()` 추가 |
| `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminEmbeddingController.java` | 신규 | 임베딩 관리 페이지 + 액션 API |
| `server/PQL-Web/src/main/resources/templates/admin/embeddings.html` | 신규 | 상태 카드 + 미색인 목록 화면 |
| `server/PQL-Web/src/main/resources/templates/admin/questions.html` | 수정 | "선택 색인" 버튼 추가 |
| `server/PQL-Web/src/main/resources/templates/admin/layout.html` | 수정 | 사이드바 임베딩 관리 메뉴 추가 |

---

### Task 1: Python — qdrant_client.py에 get_collection_info(), scroll_all_ids() 추가

**Files:**
- Modify: `ai/src/services/qdrant_client.py`

- [ ] **Step 1: get_collection_info() 메서드 추가**

`upsert()` 메서드 아래에 다음 메서드 2개를 추가한다.

```python
async def get_collection_info(self, collection: str) -> dict:
    """
    Qdrant 컬렉션 기본 정보 조회 (포인트 수, 벡터 차원, 상태).

    Args:
        collection: 조회할 컬렉션 이름

    Returns:
        dict: {"points_count": int, "vector_size": int, "status": str}
              컬렉션 미존재 시 {"points_count": 0, "vector_size": 0, "status": "not_found"}

    Raises:
        CustomError: API 호출 실패 시
    """
    url = f"{self.base_url}/collections/{collection}"
    logger.debug(f"[qdrant] get_collection_info 요청: url={url}")
    try:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, headers=self._headers())
            if resp.status_code == 404:
                logger.info(f"[qdrant] 컬렉션 없음: {collection}")
                return {"points_count": 0, "vector_size": 0, "status": "not_found"}
            resp.raise_for_status()
            data = resp.json()

        result = data.get("result", {})
        config = result.get("config", {}).get("params", {})
        vectors_config = config.get("vectors", {})
        # bge-m3 단일 벡터 컬렉션 — vectors 키 없이 바로 size/distance
        vector_size = vectors_config.get("size", 0) if isinstance(vectors_config, dict) else 0
        points_count = result.get("points_count", 0)
        status = result.get("status", "unknown")

        logger.debug(
            f"[qdrant] get_collection_info 응답: collection={collection}, "
            f"points_count={points_count}, vector_size={vector_size}, status={status}"
        )
        return {"points_count": points_count, "vector_size": vector_size, "status": status}

    except httpx.HTTPStatusError as e:
        logger.error(f"[qdrant] get_collection_info HTTP 오류: {e.response.status_code}")
        raise CustomError(f"Qdrant get_collection_info HTTP 오류: {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"[qdrant] get_collection_info 요청 오류: {e}")
        raise CustomError(f"Qdrant get_collection_info 요청 오류: {e}")
    except CustomError:
        raise
    except Exception as e:
        logger.error(f"[qdrant] get_collection_info 예기치 않은 오류: {e}")
        raise CustomError(f"Qdrant get_collection_info 예기치 않은 오류: {e}")

async def scroll_all_ids(self, collection: str) -> list[str]:
    """
    Qdrant 컬렉션의 모든 포인트 ID(UUID 문자열)를 페이지네이션으로 수집.

    scroll API: limit=1000씩, next_page_offset이 None이 될 때까지 반복.
    with_payload=false, with_vector=false — ID만 수집하여 응답 최소화.

    Args:
        collection: 조회할 컬렉션 이름

    Returns:
        list[str]: 전체 포인트 UUID 문자열 목록

    Raises:
        CustomError: API 호출 실패 시
    """
    url = f"{self.base_url}/collections/{collection}/points/scroll"
    all_ids: list[str] = []
    offset = None
    page = 0

    logger.info(f"[qdrant] scroll_all_ids 시작: collection={collection}")

    try:
        async with httpx.AsyncClient(timeout=60) as client:  # scroll은 대용량 가능 — timeout 60s
            while True:
                body: dict = {
                    "limit": 1000,
                    "with_payload": False,
                    "with_vector": False,
                }
                if offset is not None:
                    body["offset"] = offset

                resp = await client.post(url, json=body, headers=self._headers())
                if resp.status_code == 404:
                    logger.info(f"[qdrant] scroll_all_ids: 컬렉션 없음 — 빈 목록 반환")
                    return []
                resp.raise_for_status()
                data = resp.json()

                result = data.get("result", {})
                points = result.get("points", [])
                next_offset = result.get("next_page_offset")

                page_ids = [str(p["id"]) for p in points if "id" in p]
                all_ids.extend(page_ids)

                logger.debug(
                    f"[qdrant] scroll_all_ids page {page}: "
                    f"offset={offset}, collected={len(page_ids)}, total_so_far={len(all_ids)}"
                )
                page += 1

                if not next_offset:
                    break
                offset = next_offset

        logger.info(f"[qdrant] scroll_all_ids 완료: collection={collection}, total={len(all_ids)}")
        return all_ids

    except httpx.HTTPStatusError as e:
        logger.error(f"[qdrant] scroll_all_ids HTTP 오류: {e.response.status_code}")
        raise CustomError(f"Qdrant scroll_all_ids HTTP 오류: {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"[qdrant] scroll_all_ids 요청 오류: {e}")
        raise CustomError(f"Qdrant scroll_all_ids 요청 오류: {e}")
    except CustomError:
        raise
    except Exception as e:
        logger.error(f"[qdrant] scroll_all_ids 예기치 않은 오류: {e}")
        raise CustomError(f"Qdrant scroll_all_ids 예기치 않은 오류: {e}")
```

- [ ] **Step 2: 커밋**

```bash
git add ai/src/services/qdrant_client.py
git commit -m "feat: Qdrant get_collection_info, scroll_all_ids 메서드 추가 #065"
```

---

### Task 2: Python — DTO 및 ai_service.py get_index_status() 추가

**Files:**
- Modify: `ai/src/models/ai_request.py`
- Modify: `ai/src/models/ai_response.py`
- Modify: `ai/src/services/ai_service.py`

- [ ] **Step 1: ai_request.py에 IndexStatusRequest 추가**

기존 import/모델 목록 맨 아래에 추가:

```python
class IndexStatusRequest(BaseModel):
    # Java가 DB에서 조회한 전체 문제 UUID 목록
    question_uuids: list[str]
```

- [ ] **Step 2: ai_response.py에 IndexStatusResponse 추가**

기존 모델 목록 맨 아래에 추가:

```python
class IndexStatusResponse(BaseModel):
    collection_points_count: int   # Qdrant 현재 포인트 수
    db_question_count: int         # Java가 전달한 DB 문제 수
    unindexed_count: int           # 미색인 문제 수
    unindexed_uuids: list[str]     # 미색인 문제 UUID 목록
```

- [ ] **Step 3: ai_service.py — import 목록 업데이트**

`ai_service.py` 상단 import에 추가:

```python
from src.models.ai_request import (
    ...
    IndexStatusRequest,   # 추가
)
from src.models.ai_response import (
    ...
    IndexStatusResponse,  # 추가
)
```

- [ ] **Step 4: ai_service.py에 get_index_status() 추가**

`AiService` 클래스의 `recommend()` 메서드 아래에 추가:

```python
async def get_index_status(self, req: IndexStatusRequest) -> IndexStatusResponse:
    """
    DB UUID 목록과 Qdrant 포인트 UUID를 비교하여 미색인 문제 목록 반환.

    흐름:
    1. Qdrant passql_questions 컬렉션 scroll로 전체 포인트 UUID 수집
    2. DB UUID 세트 - Qdrant UUID 세트 = 미색인 목록 계산
    3. 컬렉션이 없으면 전체가 미색인

    Args:
        req: IndexStatusRequest (question_uuids: DB 전체 문제 UUID 목록)

    Returns:
        IndexStatusResponse
    """
    logger.info(
        f"[index-status] 요청: db_uuid_count={len(req.question_uuids)}"
    )

    # Qdrant에서 전체 포인트 UUID 수집
    qdrant_ids = await qdrant_search_client.scroll_all_ids(self.QUESTION_COLLECTION)
    qdrant_uuid_set = set(qdrant_ids)

    db_uuid_set = set(req.question_uuids)

    # 차집합: DB에는 있지만 Qdrant에 없는 문제
    unindexed = list(db_uuid_set - qdrant_uuid_set)

    logger.info(
        f"[index-status] 결과: db={len(db_uuid_set)}, "
        f"qdrant={len(qdrant_uuid_set)}, 미색인={len(unindexed)}"
    )
    logger.debug(f"[index-status] 미색인 UUID 목록: {unindexed[:10]}{'...' if len(unindexed) > 10 else ''}")

    return IndexStatusResponse(
        collection_points_count=len(qdrant_uuid_set),
        db_question_count=len(db_uuid_set),
        unindexed_count=len(unindexed),
        unindexed_uuids=unindexed,
    )
```

- [ ] **Step 5: 커밋**

```bash
git add ai/src/models/ai_request.py ai/src/models/ai_response.py ai/src/services/ai_service.py
git commit -m "feat: IndexStatusRequest/Response DTO 및 get_index_status() 추가 #065"
```

---

### Task 3: Python — ai_router.py에 POST /api/ai/index-status 추가

**Files:**
- Modify: `ai/src/apis/ai_router.py`

- [ ] **Step 1: import 업데이트**

`ai_router.py` 상단 import에 추가:

```python
from src.models.ai_request import (
    ...
    IndexStatusRequest,   # 추가
)
from src.models.ai_response import (
    ...
    IndexStatusResponse,  # 추가
)
```

- [ ] **Step 2: 엔드포인트 추가**

기존 recommend 엔드포인트 아래에 추가:

```python
@router.post("/index-status", response_model=IndexStatusResponse)
async def get_index_status(req: IndexStatusRequest):
    """
    DB UUID 목록 대비 Qdrant 미색인 문제 목록 반환.

    Java가 DB 전체 문제 UUID를 전달하면,
    Python이 Qdrant scroll로 포인트 UUID를 수집하여 차집합 계산.
    """
    logger.info(f"[router] POST /index-status: uuid_count={len(req.question_uuids)}")
    return await ai_service.get_index_status(req)
```

- [ ] **Step 3: 커밋**

```bash
git add ai/src/apis/ai_router.py
git commit -m "feat: POST /api/ai/index-status 엔드포인트 추가 #065"
```

---

### Task 4: Java — DTO 2개 신규 생성

**Files:**
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusRequest.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusResult.java`

- [ ] **Step 1: IndexStatusRequest.java 생성**

```java
package com.passql.ai.dto;

import java.util.List;

/**
 * Python AI 서버에 미색인 탐지 요청 시 전달하는 DTO.
 * Java가 DB에서 조회한 전체 문제 UUID 목록을 포함.
 */
public record IndexStatusRequest(
        List<String> questionUuids
) {}
```

- [ ] **Step 2: IndexStatusResult.java 생성**

```java
package com.passql.ai.dto;

import java.util.List;

/**
 * Python AI 서버로부터 받는 색인 상태 응답 DTO.
 * Qdrant 포인트 수, DB 문제 수, 미색인 목록을 포함.
 */
public record IndexStatusResult(
        int collectionPointsCount,
        int dbQuestionCount,
        int unindexedCount,
        List<String> unindexedUuids
) {}
```

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusRequest.java \
        server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/IndexStatusResult.java
git commit -m "feat: IndexStatusRequest, IndexStatusResult DTO 추가 #065"
```

---

### Task 5: Java — AiGatewayClient에 getIndexStatus() 추가

**Files:**
- Modify: `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java`

- [ ] **Step 1: import에 새 DTO 추가 확인**

`AiGatewayClient.java` 상단 import에 이미 `com.passql.ai.dto.*`가 와일드카드로 포함되어 있으면 추가 불필요. 개별 import라면 두 DTO를 추가한다.

- [ ] **Step 2: getIndexStatus() 메서드 추가**

`recommend()` 메서드 아래에 추가:

```java
// ========================
//  getIndexStatus
// ========================

/**
 * DB UUID 목록을 Python에 전달하여 Qdrant 미색인 문제 목록 수신.
 * 실패 시 null 반환 — 호출부에서 AI 서버 장애로 처리.
 *
 * @param questionUuids DB 전체 문제 UUID 문자열 목록
 * @return 색인 상태 결과 (AI 서버 장애 시 null)
 */
public IndexStatusResult getIndexStatus(List<String> questionUuids) {
    log.debug("[AiGateway] getIndexStatus 요청: uuid_count={}", questionUuids.size());
    try {
        IndexStatusResult result = postToPython(
                "/api/ai/index-status",
                new IndexStatusRequest(questionUuids),
                IndexStatusResult.class
        );
        log.info("[AiGateway] getIndexStatus 응답: unindexed_count={}, db={}, qdrant={}",
                result.unindexedCount(), result.dbQuestionCount(), result.collectionPointsCount());
        return result;
    } catch (Exception e) {
        log.warn("[AiGateway] getIndexStatus 실패 (AI 서버 장애): error={}", e.getMessage());
        return null;
    }
}
```

- [ ] **Step 3: import java.util.List 확인**

`AiGatewayClient.java`에 `import java.util.List;`가 없으면 추가.

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java
git commit -m "feat: AiGatewayClient에 getIndexStatus() 추가 #065"
```

---

### Task 6: Java — QuestionRepository에 findAllQuestionUuids() 추가

**Files:**
- Modify: `server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java`

- [ ] **Step 1: findAllQuestionUuids() 추가**

기존 `countActiveByTopic()` 아래에 추가:

```java
/**
 * 전체 문제 UUID 문자열 목록 조회 (임베딩 색인 상태 확인용).
 *
 * 기존 codebase 패턴 준수: 네이티브 쿼리 + CAST(... AS varchar)
 * isActive 제한 없음 — 비활성 포함 전체 조회.
 */
@Query(value = "SELECT CAST(question_uuid AS varchar) FROM question", nativeQuery = true)
List<String> findAllQuestionUuids();
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/repository/QuestionRepository.java
git commit -m "feat: QuestionRepository에 findAllQuestionUuids() 추가 #065"
```

---

### Task 7: Java — AdminEmbeddingController 신규 생성

**Files:**
- Create: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminEmbeddingController.java`

- [ ] **Step 1: 파일 생성**

```java
package com.passql.web.controller.admin;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.IndexQuestionRequest;
import com.passql.ai.dto.IndexQuestionsBulkRequest;
import com.passql.ai.dto.IndexQuestionsBulkResult;
import com.passql.ai.dto.IndexStatusResult;
import com.passql.meta.entity.Subtopic;
import com.passql.meta.entity.Topic;
import com.passql.meta.repository.SubtopicRepository;
import com.passql.meta.repository.TopicRepository;
import com.passql.question.entity.Question;
import com.passql.question.repository.QuestionConceptTagRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 관리자 Qdrant 임베딩 색인 관리 컨트롤러.
 *
 * - GET  /admin/embeddings            : 색인 상태 페이지 (상태 카드 + 미색인 목록)
 * - POST /admin/embeddings/index-all  : 전체 재색인 실행
 * - POST /admin/embeddings/index-selected : 선택 UUID 재색인 실행
 */
@Slf4j
@Controller
@RequestMapping("/admin/embeddings")
@RequiredArgsConstructor
public class AdminEmbeddingController {

    private final AiGatewayClient aiGatewayClient;
    private final QuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final QuestionConceptTagRepository questionConceptTagRepository;

    @GetMapping
    public String page(Model model) {
        long startMs = System.currentTimeMillis();

        // DB 전체 문제 UUID 조회
        List<String> allUuids = questionRepository.findAllQuestionUuids();
        log.info("[embedding-mgmt] DB uuid_count={}", allUuids.size());

        // Python AI 서버에 색인 상태 조회
        IndexStatusResult status = aiGatewayClient.getIndexStatus(allUuids);

        if (status == null) {
            log.warn("[embedding-mgmt] AI 서버 응답 없음 — 연결 실패");
            model.addAttribute("aiServerError", true);
            model.addAttribute("indexStatus", null);
            model.addAttribute("unindexedQuestions", List.of());
        } else {
            log.info("[embedding-mgmt] unindexed={}, elapsed={}ms",
                    status.unindexedCount(), System.currentTimeMillis() - startMs);

            // 미색인 문제 엔티티 조회 (테이블 표시용)
            List<Question> unindexedQuestions = status.unindexedUuids().stream()
                    .map(uuidStr -> {
                        try {
                            return questionRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                        } catch (IllegalArgumentException e) {
                            log.debug("[embedding-mgmt] UUID 파싱 실패: {}", uuidStr);
                            return null;
                        }
                    })
                    .filter(q -> q != null)
                    .toList();

            model.addAttribute("aiServerError", false);
            model.addAttribute("indexStatus", status);
            model.addAttribute("unindexedQuestions", unindexedQuestions);
        }

        model.addAttribute("currentMenu", "embeddings");
        model.addAttribute("pageTitle", "임베딩 관리");
        return "admin/embeddings";
    }

    /**
     * DB 전체 문제를 Qdrant에 일괄 재색인.
     * 토픽/서브토픽/태그 조회 후 IndexQuestionsBulkRequest 빌드하여 Python 전달.
     */
    @PostMapping("/index-all")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> indexAll() {
        long startMs = System.currentTimeMillis();
        List<Question> questions = questionRepository.findAll();
        log.info("[embedding-index-all] 시작: total={}", questions.size());

        List<IndexQuestionRequest> requests = buildRequests(questions);
        log.debug("[embedding-index-all] IndexQuestionRequest 빌드 완료: count={}", requests.size());

        IndexQuestionsBulkResult result = aiGatewayClient.indexQuestionsBulk(
                new IndexQuestionsBulkRequest(requests));

        long elapsed = System.currentTimeMillis() - startMs;
        log.info("[embedding-index-all] 완료: succeeded={}, failed={}, elapsed={}ms",
                result.succeeded(), result.failed(), elapsed);

        return ResponseEntity.ok(Map.of(
                "succeeded", result.succeeded(),
                "failed", result.failed(),
                "failedUuids", result.failedUuids(),
                "elapsedMs", elapsed
        ));
    }

    /**
     * 선택된 UUID 목록만 Qdrant에 재색인.
     * questions.html 및 embeddings.html 양쪽에서 동일 엔드포인트 사용.
     */
    @PostMapping("/index-selected")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> indexSelected(
            @RequestBody Map<String, List<String>> body) {
        List<String> uuidStrings = body.getOrDefault("questionUuids", List.of());
        log.info("[embedding-index-selected] 요청 uuid_count={}", uuidStrings.size());

        List<Question> questions = uuidStrings.stream()
                .map(uuidStr -> {
                    try {
                        return questionRepository.findById(UUID.fromString(uuidStr)).orElse(null);
                    } catch (IllegalArgumentException e) {
                        log.debug("[embedding-index-selected] UUID 파싱 실패: {}", uuidStr);
                        return null;
                    }
                })
                .filter(q -> q != null)
                .toList();

        log.debug("[embedding-index-selected] 조회된 문제 수: {}", questions.size());

        List<IndexQuestionRequest> requests = buildRequests(questions);
        IndexQuestionsBulkResult result = aiGatewayClient.indexQuestionsBulk(
                new IndexQuestionsBulkRequest(requests));

        log.info("[embedding-index-selected] 완료: succeeded={}, failed={}",
                result.succeeded(), result.failed());

        return ResponseEntity.ok(Map.of(
                "succeeded", result.succeeded(),
                "failed", result.failed(),
                "failedUuids", result.failedUuids()
        ));
    }

    /**
     * Question 목록을 IndexQuestionRequest 목록으로 변환.
     * 토픽/서브토픽 이름 + 개념 태그 키 조회 포함.
     */
    private List<IndexQuestionRequest> buildRequests(List<Question> questions) {
        List<IndexQuestionRequest> requests = new ArrayList<>();
        for (Question q : questions) {
            String topicName = topicRepository.findById(q.getTopicUuid())
                    .map(Topic::getDisplayName)
                    .orElse("");
            String subtopicName = q.getSubtopicUuid() != null
                    ? subtopicRepository.findById(q.getSubtopicUuid())
                            .map(Subtopic::getDisplayName)
                            .orElse(null)
                    : null;
            List<String> tagKeys = questionConceptTagRepository
                    .findTagKeysByQuestionUuid(q.getQuestionUuid().toString());

            requests.add(new IndexQuestionRequest(
                    q.getQuestionUuid().toString(),
                    topicName,
                    subtopicName,
                    q.getDifficulty(),
                    tagKeys,
                    q.getStem() != null ? q.getStem() : ""
            ));
        }
        log.debug("[embedding-build-requests] 총 {}개 빌드 완료", requests.size());
        return requests;
    }
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminEmbeddingController.java
git commit -m "feat: AdminEmbeddingController 신규 생성 #065"
```

---

### Task 8: Thymeleaf — embeddings.html 신규 생성

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/embeddings.html`

- [ ] **Step 1: 파일 생성**

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" th:replace="~{admin/layout :: layout(~{::title}, ~{::main})}">
<head>
    <title th:text="${pageTitle}">임베딩 관리</title>
</head>
<body>
<main>

    <!-- AI 서버 연결 실패 배너 -->
    <div th:if="${aiServerError}" class="alert alert-error mb-4">
        <i data-lucide="wifi-off" class="size-5"></i>
        <span>AI 서버에 연결할 수 없습니다. Python AI 서버 상태를 확인해주세요.</span>
    </div>

    <!-- 상태 카드 (3개) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-4">
                <p class="text-sm text-base-content/60">Qdrant 포인트 수</p>
                <p class="text-3xl font-bold"
                   th:text="${indexStatus != null ? indexStatus.collectionPointsCount : '-'}">-</p>
            </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-4">
                <p class="text-sm text-base-content/60">DB 문제 수</p>
                <p class="text-3xl font-bold"
                   th:text="${indexStatus != null ? indexStatus.dbQuestionCount : '-'}">-</p>
            </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
            <div class="card-body p-4">
                <p class="text-sm text-base-content/60">미색인 문제</p>
                <p class="text-3xl font-bold"
                   th:classappend="${indexStatus != null and indexStatus.unindexedCount > 0} ? 'text-warning' : 'text-success'"
                   th:text="${indexStatus != null ? indexStatus.unindexedCount : '-'}">-</p>
            </div>
        </div>
    </div>

    <!-- 액션 툴바 -->
    <div class="flex gap-2 items-center mb-4">
        <button type="button" id="indexSelectedBtn" class="btn btn-sm btn-primary btn-outline"
                onclick="indexSelected()" disabled>
            <i data-lucide="zap" class="size-4"></i>
            <span id="indexSelectedLabel">선택 색인</span>
        </button>
        <button type="button" class="btn btn-sm btn-warning btn-outline"
                onclick="document.getElementById('indexAllModal').showModal()">
            <i data-lucide="refresh-cw" class="size-4"></i>
            전체 재색인
        </button>
    </div>

    <!-- 미색인 문제 목록 -->
    <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th class="w-10">
                            <input type="checkbox" id="selectAllCheckbox" class="checkbox checkbox-xs"
                                   onchange="toggleSelectAll(this)"/>
                        </th>
                        <th>문제 UUID</th>
                        <th>토픽</th>
                        <th>난이도</th>
                        <th>등록일</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 미색인 없을 때 -->
                    <tr th:if="${#lists.isEmpty(unindexedQuestions)}">
                        <td colspan="5" class="text-center py-8 text-base-content/40">
                            <i data-lucide="check-circle" class="size-5 inline mr-2 text-success"></i>
                            모든 문제가 색인되어 있습니다
                        </td>
                    </tr>
                    <!-- 미색인 문제 행 -->
                    <tr th:each="q : ${unindexedQuestions}" th:if="${!#lists.isEmpty(unindexedQuestions)}">
                        <td>
                            <input type="checkbox" class="checkbox checkbox-xs question-checkbox"
                                   th:data-uuid="${q.questionUuid}"
                                   onchange="onCheckboxChange()"/>
                        </td>
                        <td class="font-mono text-xs"
                            th:text="${#strings.abbreviate(q.questionUuid.toString(), 16)}">uuid</td>
                        <td th:text="${q.topicUuid}">토픽</td>
                        <td th:text="${'Lv.' + q.difficulty}">Lv.1</td>
                        <td th:text="${#temporals.format(q.createdAt, 'yyyy-MM-dd')}">2026-04-13</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- 전체 재색인 확인 모달 -->
    <dialog id="indexAllModal" class="modal">
        <div class="modal-box">
            <h3 class="font-bold text-lg">전체 재색인 실행</h3>
            <p class="py-4">DB의 모든 문제를 Qdrant에 재색인합니다. 시간이 걸릴 수 있습니다.</p>
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="document.getElementById('indexAllModal').close()">취소</button>
                <button class="btn btn-warning" onclick="confirmIndexAll()">실행</button>
            </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- 결과 토스트 -->
    <div id="resultToast" class="toast toast-end hidden">
        <div id="resultAlert" class="alert">
            <span id="resultMsg"></span>
        </div>
    </div>

</main>
</body>
</html>

<script th:inline="javascript">
function toggleSelectAll(master) {
    document.querySelectorAll('.question-checkbox').forEach(cb => cb.checked = master.checked);
    onCheckboxChange();
}

function onCheckboxChange() {
    const checked = document.querySelectorAll('.question-checkbox:checked');
    const btn = document.getElementById('indexSelectedBtn');
    const label = document.getElementById('indexSelectedLabel');
    btn.disabled = checked.length === 0;
    label.textContent = checked.length > 0 ? `선택 색인 (${checked.length})` : '선택 색인';

    const all = document.querySelectorAll('.question-checkbox');
    document.getElementById('selectAllCheckbox').checked =
        all.length > 0 && checked.length === all.length;
}

function getSelectedUuids() {
    return Array.from(document.querySelectorAll('.question-checkbox:checked'))
        .map(cb => cb.dataset.uuid);
}

function showResult(success, msg) {
    const toast = document.getElementById('resultToast');
    const alert = document.getElementById('resultAlert');
    const msgEl = document.getElementById('resultMsg');
    alert.className = 'alert ' + (success ? 'alert-success' : 'alert-error');
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
}

async function indexSelected() {
    const uuids = getSelectedUuids();
    if (uuids.length === 0) return;
    const btn = document.getElementById('indexSelectedBtn');
    btn.disabled = true;
    try {
        const res = await fetch('/admin/embeddings/index-selected', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({questionUuids: uuids})
        });
        const data = await res.json();
        showResult(data.failed === 0,
            `색인 완료 — 성공 ${data.succeeded}개 / 실패 ${data.failed}개`);
        if (data.succeeded > 0) setTimeout(() => location.reload(), 2000);
    } catch (e) {
        showResult(false, '색인 요청 중 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
    }
}

async function confirmIndexAll() {
    document.getElementById('indexAllModal').close();
    try {
        const res = await fetch('/admin/embeddings/index-all', {method: 'POST'});
        const data = await res.json();
        showResult(data.failed === 0,
            `전체 재색인 완료 — 성공 ${data.succeeded}개 / 실패 ${data.failed}개 (${data.elapsedMs}ms)`);
        if (data.succeeded > 0) setTimeout(() => location.reload(), 2000);
    } catch (e) {
        showResult(false, '전체 재색인 중 오류가 발생했습니다.');
    }
}
</script>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/embeddings.html
git commit -m "feat: 관리자 임베딩 관리 페이지(embeddings.html) 신규 생성 #065"
```

---

### Task 9: Thymeleaf — questions.html 툴바에 "선택 색인" 버튼 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/questions.html`

- [ ] **Step 1: 툴바에 선택 색인 버튼 추가**

`deleteSelectedBtn` 버튼 바로 다음에 추가:

```html
<!-- 선택 색인 버튼: 체크박스 선택 시 활성화 -->
<button type="button" id="indexSelectedBtn" class="btn btn-sm btn-primary btn-outline"
        onclick="indexSelectedQuestions()" disabled>
    <i data-lucide="zap" class="size-4"></i>
    <span id="indexSelectedLabel">선택 색인</span>
</button>
```

- [ ] **Step 2: 기존 onCheckboxChange() JS 함수 확장**

기존 `onCheckboxChange()` 함수를 찾아 `indexSelectedBtn` 활성화 로직 추가:

```javascript
function onCheckboxChange() {
    const checked = document.querySelectorAll('.question-checkbox:checked');
    const count = checked.length;

    // 기존: 삭제/내보내기 버튼 처리
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const deleteLabel = document.getElementById('deleteSelectedLabel');
    if (deleteBtn) {
        deleteBtn.disabled = count === 0;
        deleteLabel.textContent = count > 0 ? `선택 삭제 (${count})` : '선택 삭제';
    }

    const exportBtn = document.getElementById('exportSelectedBtn');
    const exportLabel = document.getElementById('exportSelectedLabel');
    if (exportBtn) {
        exportBtn.disabled = count === 0;
        exportLabel.textContent = count > 0 ? `선택 내보내기 (${count})` : '선택 내보내기';
    }

    // 추가: 색인 버튼 처리
    const indexBtn = document.getElementById('indexSelectedBtn');
    const indexLabel = document.getElementById('indexSelectedLabel');
    if (indexBtn) {
        indexBtn.disabled = count === 0;
        indexLabel.textContent = count > 0 ? `선택 색인 (${count})` : '선택 색인';
    }
}
```

- [ ] **Step 3: indexSelectedQuestions() 함수 추가**

JS 영역 하단(기존 함수들 아래)에 추가:

```javascript
// 선택된 문제 UUID 목록을 임베딩 관리 엔드포인트로 전송
async function indexSelectedQuestions() {
    const uuids = Array.from(document.querySelectorAll('.question-checkbox:checked'))
        .map(cb => cb.dataset.uuid);
    if (uuids.length === 0) return;

    const btn = document.getElementById('indexSelectedBtn');
    btn.disabled = true;

    try {
        const res = await fetch('/admin/embeddings/index-selected', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({questionUuids: uuids})
        });
        const data = await res.json();
        const msg = `색인 완료 — 성공 ${data.succeeded}개 / 실패 ${data.failed}개`;
        // daisyUI toast가 없는 경우 alert fallback
        alert(msg);
    } catch (e) {
        alert('색인 요청 중 오류가 발생했습니다.');
    } finally {
        btn.disabled = false;
    }
}
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/questions.html
git commit -m "feat: questions.html 툴바에 선택 색인 버튼 추가 #065"
```

---

### Task 10: Thymeleaf — layout.html 사이드바 메뉴 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/layout.html`

- [ ] **Step 1: 사이드바에 임베딩 관리 메뉴 추가**

`monitor` 메뉴 항목(`th:href="@{/admin/monitor}"`) 바로 아래, `<div class="divider">` 이전에 추가:

```html
<li>
    <a th:href="@{/admin/embeddings}" th:classappend="${currentMenu == 'embeddings'} ? 'active'">
        <i data-lucide="database-zap" class="size-5"></i>
        임베딩 관리
    </a>
</li>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/layout.html
git commit -m "feat: 사이드바에 임베딩 관리 메뉴 추가 #065"
```

---

## Self-Review

**1. 스펙 커버리지 확인**
- ✅ `qdrant_client.py` — `get_collection_info()`, `scroll_all_ids()` (Task 1)
- ✅ Python DTO — `IndexStatusRequest`, `IndexStatusResponse` (Task 2)
- ✅ `ai_service.py` — `get_index_status()` (Task 2)
- ✅ `ai_router.py` — `POST /api/ai/index-status` (Task 3)
- ✅ Java DTO — `IndexStatusRequest`, `IndexStatusResult` (Task 4)
- ✅ `AiGatewayClient` — `getIndexStatus()` (Task 5)
- ✅ `QuestionRepository` — `findAllQuestionUuids()` (Task 6)
- ✅ `AdminEmbeddingController` — GET/POST 3개 (Task 7)
- ✅ `embeddings.html` — 상태 카드 + 미색인 목록 + 선택/전체 재색인 (Task 8)
- ✅ `questions.html` — 선택 색인 버튼 (Task 9)
- ✅ `layout.html` — 사이드바 메뉴 (Task 10)
- ✅ 로깅 — Python DEBUG/INFO, Java INFO/WARN 전 경로 포함

**2. 타입 일관성**
- Python `IndexStatusResponse.unindexed_uuids` ↔ Java `IndexStatusResult.unindexedUuids()` — snake_case ↔ camelCase, `snakeCaseMapper`로 자동 변환 ✅
- `buildRequests()` 반환 `List<IndexQuestionRequest>` → `IndexQuestionsBulkRequest(List<IndexQuestionRequest>)` 생성자 일치 ✅
- `indexSelectedBtn` id — embeddings.html(Task 8)과 questions.html(Task 9) 각각 독립적인 페이지이므로 id 충돌 없음 ✅

**3. 누락 확인**
- `AdminEmbeddingController`에서 `QuestionConceptTagRepository` 의존성 주입 필요 — Task 7에 포함 ✅
- `buildRequests()`가 Controller 내부 private 메서드로 중복 코드 없이 index-all/index-selected 양쪽 재사용 ✅
