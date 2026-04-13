# 실시간 선택지 세트 생성 + 관리자 AI 문제 등록 설계

**작성일:** 2026-04-09
**대체 대상:** `2026-04-08-admin-question-generation-prompt-test-design.md` (방향 전환으로 폐기)
**관련 이슈:** #22 Entity 스키마 보강 + 관리자 문제 등록/프롬프트 테스트 기능 (재해석)
**범위:** 사용자 풀이 진입 시 Gemini 실시간 선택지 생성 + 프리페치 + 관리자 문제 등록(AI 보조) + 선택지 세트 이력 관리 + 프롬프트 테스트
**Flyway 버전:** V0_0_28

---

## 📌 설계 컨셉 (한 줄 요약)

**문제는 고정, 선택지는 매번 새로.** 사용자가 문제에 진입할 때마다 Gemini가 선택지 4개 세트를 실시간 생성하고, 모든 세트는 히스토리로 DB에 남겨 관리자가 추적·검수·승격할 수 있다.

### 핵심 원칙

1. **AI 교육 컨텐츠로서의 서사** — "AI가 너만을 위해 지금 문제를 만든다" 는 경험을 핵심 셀링 포인트로.
2. **지연 숨김** — 프리페치 전략으로 첫 문제만 콜드 스타트, 이후는 체감 지연 ≈ 0.
3. **AI 호출 단일 진입점** — Java에서 AI 기능 사용 시 무조건 `AiGatewayClient` 만 사용. 메인 경로는 Python AI 서버. Python 장애 시 Spring `GeminiClient` fallback.
4. **선택지 세트는 저장됨** — 휘발 X. 모든 세트를 `question_choice_set` 에 기록해 관리자 대시보드에서 조회·검수 가능.
5. **확장성 고려, 구현 범위 최소** — 신고·큐레이션·하이브리드 정책 등은 스키마와 훅만 열어두고 이번엔 구현 X.
6. **에러는 `CustomException` + `ErrorCode` 단일 규약** — 도메인별 예외 클래스 만들지 않음.

---

## 1. 전체 아키텍처

### 1.1. 사용자 풀이 플로우

```
세션 시작 (/quiz/start)
    │
    ▼
QuizSessionService.createSession(memberUuid, topic?, difficulty?)
    │
    ├─ Question 10개 픽 (난이도·토픽 기반) → questionOrder[0..9]
    ├─ QuizSession 엔티티 저장 (sessionUuid, memberUuid, questionOrder)
    └─ return sessionUuid
         │
         ▼
문제 1 진입 (/quiz/{sessionUuid}/q/0)
    │
    ├─ [foreground] ChoiceSetResolver.resolveForUser(questionUuid[0], memberUuid)
    │       ├─ Question.choiceSetPolicy 확인
    │       │     ├─ AI_ONLY      → Gemini 실시간 호출 (MVP: 이것만 구현)
    │       │     ├─ CURATED_ONLY → ADMIN_CURATED 세트 중 랜덤 (MVP 미구현)
    │       │     └─ HYBRID       → 확률로 분기 (MVP 미구현)
    │       ├─ AI 경로:
    │       │     ├─ 프리페치 캐시 확인 (questionUuid[0] + memberUuid)
    │       │     ├─ 캐시 HIT  → consumed_at 업데이트 후 즉시 반환 (첫 문제는 MISS)
    │       │     └─ 캐시 MISS → ChoiceSetGenerationService.generate(source=AI_RUNTIME)
    │       │                    → AiGatewayClient → Python → Gemini
    │       │                    → SandboxValidator 검증 → 재시도 루프 (최대 3회)
    │       │                    → QuestionChoiceSet + Items 저장 → 반환
    │       └─ 사용자에게 choiceSet 표시
    │
    └─ [async, @Async] PrefetchService.prefetchNext(sessionUuid, currentIndex=0)
              └─ questionOrder[1] 에 대해 위 AI 경로 실행
                 → QuestionChoiceSet(source=AI_PREFETCH, generatedForMemberUuid) 저장
         │
         ▼
사용자가 문제 1 풀이 중 (수십 초~수 분)
         │
         ▼
사용자가 답안 제출 (POST /quiz/{sessionUuid}/q/0/submit)
    │
    ├─ Submission 저장 (sessionUuid, choiceSetUuid, selectedChoiceKey, isCorrect, ...)
    ├─ 결과 화면 렌더링 (정답/오답 + rationale)
    └─ [다음 문제] → 문제 2 진입
         │
         ▼
문제 2 진입 — 이 시점에 프리페치 캐시 HIT → 즉시 표시
    │
    └─ [async] 문제 3 프리페치 시작
    ...
```

### 1.2. 관리자 등록 플로우

```
/admin/questions/new
    │
Step 1: 기본 입력
    ├─ topic / subtopic / difficulty
    ├─ schema_ddl (CREATE TABLE 문들)
    ├─ schema_sample_data (INSERT INTO 문들)
    ├─ schema_intent (nullable, 자연어 설명)
    ├─ hint (nullable)
    ├─ choice_set_policy (기본 AI_ONLY)
    └─ [AI로 문제 생성]
         │
         ▼
Step 2: AI 생성 (AiGatewayClient → Python → Gemini)
    └─ prompt: generate_question_full
       inputs: { schema_ddl, schema_sample_data, schema_intent, hint, topic, difficulty }
       output: { stem, answer_sql, seed_choices: [A,B,C,D] }
         │
         ▼
Step 3: 검수 & 저장
    ├─ stem (수정 가능)
    ├─ answer_sql (수정 가능) — 샌드박스에서 [실행 테스트] 버튼 가능
    ├─ seed 선택지 4개 (수정 가능, 각각 [샌드박스 실행 테스트] 버튼)
    └─ [저장]
         │
         ▼
트랜잭션:
    1. Question 저장
    2. QuestionChoiceSet(source=ADMIN_SEED, status=OK, is_reusable=true) 저장
    3. QuestionChoiceSetItem × 4 저장
```

### 1.3. AI 호출 경로 (엄격)

```
Java 서비스 (QuestionGenerateService, ChoiceSetGenerationService, AdminPromptController...)
    │
    ▼
AiGatewayClient (Spring, PQL-Domain-AI)      ← Java의 유일한 AI 진입점
    │
    ├─ [1차 메인] Python AI Server → Gemini API
    │        POST /api/ai/generate-question-full
    │        POST /api/ai/generate-choice-set
    │        POST /api/ai/test-prompt
    │
    └─ [fallback] GeminiFallbackClient → 기존 GeminiClient 직접 호출
             (@CircuitBreaker 발동 조건: 커넥션 거부, 타임아웃, HTTP 5xx, 파싱 실패)
```

**모델 역할 분리:**

| 용도 | 모델 | 위치 |
|---|---|---|
| 텍스트 생성 (메인) | `gemini-2.5-flash-lite` | Python AI 서버, Gemini API |
| 임베딩 (향후 유사 문제 검색) | `embeddinggemma:latest` | Python AI 서버, Ollama (이번 스코프 X) |
| Ollama LLM (`gemma3:1b-it-qat`) | — | 느려서 프로덕션 경로 미사용 |

**프롬프트 전달 방식:** Spring이 `prompt_template` DB에서 system_prompt/user_template/model/temperature/max_tokens/response_schema 전부 꺼내 request body에 담아 Python으로 전달. Python은 stateless "모델 호출기" 역할.

---

## 2. 데이터 모델

Flyway **V0_0_28**: 기존 `question_choice` drop + 신규 테이블 3개 create + `question` 재정의 + `submission` 컬럼 추가 + `prompt_template` 시드 추가.

### 2.1. `question` (재정의)

```sql
DROP TABLE IF EXISTS question_choice;
DROP TABLE IF EXISTS question;

CREATE TABLE question (
    question_uuid           BINARY(16)   NOT NULL PRIMARY KEY,
    topic_uuid              BINARY(16)   NOT NULL,
    subtopic_uuid           BINARY(16)   NULL,
    difficulty              TINYINT      NOT NULL,         -- 1~5
    dialect                 VARCHAR(20)  NOT NULL DEFAULT 'MARIADB',

    -- 스키마 정보 (LLM 컨텍스트용)
    schema_ddl              TEXT         NOT NULL,          -- CREATE TABLE 문들
    schema_sample_data      TEXT         NOT NULL,          -- INSERT INTO 문들
    schema_intent           TEXT         NULL,              -- 자연어 설명 (옵션)

    -- 문제 본체
    stem                    TEXT         NOT NULL,          -- 문제 지문
    answer_sql              TEXT         NOT NULL,          -- 기준 정답 SQL
    hint                    TEXT         NULL,

    -- 정책 (하이브리드 확장성)
    choice_set_policy       VARCHAR(20)  NOT NULL DEFAULT 'AI_ONLY',
                            -- AI_ONLY | CURATED_ONLY | HYBRID

    -- 샌드박스 DB (사용자 SQL 직접 실행용, 추후)
    sandbox_db_name         VARCHAR(64)  NULL,

    -- 메타
    extra_meta_json         JSON         NULL,              -- 향후 확장용
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              DATETIME(6)  NOT NULL,
    updated_at              DATETIME(6)  NOT NULL,

    INDEX idx_question_topic (topic_uuid),
    INDEX idx_question_difficulty (difficulty),
    INDEX idx_question_active (is_active)
);
```

### 2.2. `question_choice_set` (신규)

```sql
CREATE TABLE question_choice_set (
    choice_set_uuid             BINARY(16)   NOT NULL PRIMARY KEY,
    question_uuid               BINARY(16)   NOT NULL,

    -- 출처 구분 (핵심 — 하이브리드 확장성)
    source                      VARCHAR(30)  NOT NULL,
                                -- AI_RUNTIME | AI_PREFETCH | AI_ADMIN_PREVIEW
                                -- ADMIN_SEED | ADMIN_CURATED
    status                      VARCHAR(20)  NOT NULL DEFAULT 'OK',
                                -- OK | DISABLED | REPORTED | DRAFT | FAILED

    -- 대상 (프리페치/런타임 캐시용)
    generated_for_member_uuid   BINARY(16)   NULL,
                                -- NULL이면 재사용 가능, 특정 멤버 예약이면 채움
    is_reusable                 BOOLEAN      NOT NULL DEFAULT FALSE,
                                -- ADMIN_SEED/CURATED=true, AI_RUNTIME/PREFETCH=false

    -- 생성 메타 (AI 경로에만 의미 있음)
    prompt_template_uuid        BINARY(16)   NULL,
    model_name                  VARCHAR(50)  NULL,
    temperature                 DECIMAL(3,2) NULL,
    max_tokens                  INT          NULL,
    generation_attempts         INT          NOT NULL DEFAULT 1,
    sandbox_validation_passed   BOOLEAN      NOT NULL DEFAULT FALSE,
    raw_response_json           JSON         NULL,          -- Gemini 원본 응답 전체
    total_elapsed_ms            INT          NULL,

    -- 소유자 (ADMIN_CURATED/ADMIN_SEED면 관리자 UUID)
    created_by_member_uuid      BINARY(16)   NULL,

    -- 소비 상태 (프리페치 캐시 용도)
    consumed_at                 DATETIME(6)  NULL,          -- 사용자에게 제공된 시각

    -- 실패 이력
    last_error_code             VARCHAR(64)  NULL,          -- ErrorCode enum 값

    created_at                  DATETIME(6)  NOT NULL,
    updated_at                  DATETIME(6)  NOT NULL,

    CONSTRAINT fk_choice_set_question FOREIGN KEY (question_uuid)
        REFERENCES question(question_uuid),
    INDEX idx_choice_set_question (question_uuid),
    INDEX idx_choice_set_source (source),
    INDEX idx_choice_set_status (status),
    INDEX idx_choice_set_prefetch (question_uuid, generated_for_member_uuid, consumed_at)
        -- 프리페치 캐시 조회: "이 멤버·이 문제·아직 소비 안 된" 빠르게
);
```

### 2.3. `question_choice_set_item` (신규)

```sql
CREATE TABLE question_choice_set_item (
    choice_set_item_uuid    BINARY(16)   NOT NULL PRIMARY KEY,
    choice_set_uuid         BINARY(16)   NOT NULL,

    choice_key              VARCHAR(8)   NOT NULL,          -- A~D
    sort_order              TINYINT      NOT NULL,          -- 0~3
    kind                    VARCHAR(10)  NOT NULL DEFAULT 'SQL',  -- SQL | TEXT
    body                    TEXT         NOT NULL,          -- SQL 또는 텍스트
    is_correct              BOOLEAN      NOT NULL,
    rationale               TEXT         NULL,

    -- 샌드박스 실행 결과 (AI 경로 검증 시점)
    sandbox_execution_json  JSON         NULL,
    -- { status: OK|ERROR, rows: N, elapsed_ms: N, error: "...", matches_expected: true }

    created_at              DATETIME(6)  NOT NULL,

    CONSTRAINT fk_choice_set_item_set FOREIGN KEY (choice_set_uuid)
        REFERENCES question_choice_set(choice_set_uuid) ON DELETE CASCADE,
    UNIQUE KEY uk_choice_set_item_key (choice_set_uuid, choice_key),
    INDEX idx_choice_set_item_set (choice_set_uuid)
);
```

### 2.4. `quiz_session` (신규)

```sql
CREATE TABLE quiz_session (
    session_uuid            BINARY(16)   NOT NULL PRIMARY KEY,
    member_uuid             BINARY(16)   NOT NULL,

    question_order_json     JSON         NOT NULL,
                            -- ["uuid1","uuid2",...,"uuid10"] 고정 순서
    current_index           TINYINT      NOT NULL DEFAULT 0,     -- 0~10
    total_questions         TINYINT      NOT NULL DEFAULT 10,

    -- 세션 설정 (나중에 적응형 도입 시 활용)
    topic_uuid              BINARY(16)   NULL,
    difficulty_min          TINYINT      NULL,
    difficulty_max          TINYINT      NULL,

    status                  VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
                            -- IN_PROGRESS | COMPLETED | ABANDONED
    started_at              DATETIME(6)  NOT NULL,
    completed_at            DATETIME(6)  NULL,

    INDEX idx_quiz_session_member (member_uuid),
    INDEX idx_quiz_session_status (status)
);
```

### 2.5. `submission` (컬럼 추가)

```sql
ALTER TABLE submission
    ADD COLUMN choice_set_uuid  BINARY(16) NULL AFTER question_uuid,
    ADD COLUMN session_uuid     BINARY(16) NULL AFTER choice_set_uuid,
    ADD COLUMN question_index   TINYINT    NULL AFTER session_uuid,

    ADD CONSTRAINT fk_submission_choice_set FOREIGN KEY (choice_set_uuid)
        REFERENCES question_choice_set(choice_set_uuid),
    ADD CONSTRAINT fk_submission_session FOREIGN KEY (session_uuid)
        REFERENCES quiz_session(session_uuid),

    ADD INDEX idx_submission_session (session_uuid),
    ADD INDEX idx_submission_choice_set (choice_set_uuid);
```

이러면 **"누가 어떤 세션의 몇 번째 문제에서 어떤 세트를 받고 뭘 골랐는지"** 완전 추적 가능.

### 2.6. `prompt_template` — 신규 시드 (같은 V0_0_28 또는 별도 V0_0_29)

```sql
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note, created_at, updated_at
) VALUES
  (UUID_TO_BIN(UUID()), 'generate_question_full', 1, TRUE, 'gemini-2.5-flash-lite',
   '<systemPrompt>', '<userTemplate with {schema_ddl},{schema_sample_data},...>',
   0.8, 2048, '관리자 문제 등록 시 stem+answer_sql+seed set 생성', NOW(6), NOW(6)),
  (UUID_TO_BIN(UUID()), 'generate_choice_set', 1, TRUE, 'gemini-2.5-flash-lite',
   '<systemPrompt>', '<userTemplate>',
   0.9, 1536, '사용자 풀이 진입 시 선택지 세트 생성', NOW(6), NOW(6));
```

### 2.7. 확장성 포인트 (지금 구현 X)

| 향후 기능 | 필요한 스키마 변경 |
|---|---|
| 신고 기능 | 없음. `question_choice_set.status = REPORTED` + 별도 `choice_set_report` 테이블 신설 시 FK만. |
| `CURATED_ONLY` / `HYBRID` 정책 활성화 | 없음. `choice_set_policy` 이미 enum 수용. |
| 관리자 직접 큐레이션 선택지 | 없음. `source=ADMIN_CURATED` + `is_reusable=true` 로 저장만 하면 됨. |
| AI 세트 승격 | 없음. UPDATE로 `source=ADMIN_CURATED, is_reusable=true` 변경만. |
| 적응형 문제 추천 | `quiz_session.question_order_json` JSON 구조라 호환. |

---

## 3. 백엔드 컴포넌트

### 3.1. Python AI Server (`ai/`)

**신규 파일**

- `ai/src/services/gemini_client.py`
  ```python
  class GeminiClient:
      async def chat(self, system_prompt, user_prompt, model, temperature, max_tokens) -> str: ...
      async def chat_structured(self, system_prompt, user_prompt, model, temperature,
                                max_tokens, response_schema) -> dict: ...
          # google.genai SDK의 response_schema(JSON mode) 사용
          # 파싱 실패 시 HTTPException 500 (Spring은 이걸 AI_STRUCTURED_SCHEMA_VIOLATION 으로 해석)
  ```

**수정 파일**

- `ai/pyproject.toml` — `google-genai` 의존성 추가 (내부망 설치는 별도 환경에서)
- `ai/src/core/config.py` — `GEMINI_API_KEY` 실제 사용
- `ai/src/apis/ai_router.py` — 신규 엔드포인트 3개 추가
- `ai/src/models/ai_request.py` / `ai_response.py` — 신규 Pydantic 모델
- `ai/src/services/ai_service.py` — 신규 메서드 3개 추가

**신규 엔드포인트**

```
POST /api/ai/generate-question-full   — 관리자 문제 등록용
POST /api/ai/generate-choice-set      — 사용자 풀이용 (메인 트래픽)
POST /api/ai/test-prompt              — 관리자 프롬프트 테스트
```

**요청 구조 (Spring이 프롬프트 전문 포함)**

```python
class LlmConfig(BaseModel):
    model: str
    system_prompt: str
    user_template: str
    temperature: float
    max_tokens: int
    response_schema: Optional[dict] = None

class GenerateQuestionFullRequest(BaseModel):
    context: QuestionFullContext
    llm_config: LlmConfig

class GenerateChoiceSetRequest(BaseModel):
    context: ChoiceSetContext  # question_uuid, stem, answer_sql, schema_ddl, sample_data, intent, difficulty
    llm_config: LlmConfig

class TestPromptRequest(BaseModel):
    llm_config: LlmConfig
    variables: dict[str, str]
```

**응답 구조**

```python
class GeneratedChoice(BaseModel):
    key: str                   # "A"~"D"
    body: str
    is_correct: bool
    rationale: str

class GenerationMetadata(BaseModel):
    model: str
    elapsed_ms: int
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    raw_response_json: Optional[dict] = None

class GenerateQuestionFullResponse(BaseModel):
    stem: str
    answer_sql: str
    seed_choices: list[GeneratedChoice]
    metadata: GenerationMetadata

class GenerateChoiceSetResponse(BaseModel):
    choices: list[GeneratedChoice]
    metadata: GenerationMetadata

class TestPromptResponse(BaseModel):
    result: str
    elapsed_ms: int
```

**Ollama 처리:** `ollama_client.py` 의 embedding 메서드만 유지. chat 관련은 deprecated 주석만 달고 사용 X. 기존 엔드포인트 `explain-error/diff-explain/similar` 는 이번 스코프 밖, 그대로 TODO.

### 3.2. Spring `PQL-Domain-AI`

**신규 파일**

```
AiGatewayClient                      ★ Java의 유일한 AI 진입점
    @CircuitBreaker(name="aiServer", fallbackMethod="...")
    @Retry(name="aiServer", maxAttempts=2)

    generateQuestionFull(req) -> GenerateQuestionFullResult
        → POST {ai-server}/api/ai/generate-question-full
    generateChoiceSet(req) -> GenerateChoiceSetResult
        → POST {ai-server}/api/ai/generate-choice-set
    testPrompt(req) -> TestPromptResult
        → POST {ai-server}/api/ai/test-prompt

    // fallback methods (private, 같은 클래스)
    generateQuestionFullFallback(req, Throwable t)
        → log.warn; geminiFallbackClient.generateQuestionFull(req)
    generateChoiceSetFallback(req, Throwable t)
    testPromptFallback(req, Throwable t)

    // 내부 HTTP 처리
    HTTP 5xx → throw new CustomException(ErrorCode.AI_SERVER_UNAVAILABLE, ...)
    파싱 실패 → throw new CustomException(ErrorCode.AI_RESPONSE_PARSE_FAILED, ...)
    → 이 예외들이 @CircuitBreaker fallback 경로를 발동시킴

GeminiFallbackClient                 ★ fallback 전용 래퍼
    generateQuestionFull(req)
        → 같은 llm_config 로 GeminiClient.chatStructured() 직접 호출
        → 결과를 동일한 DTO로 매핑
    generateChoiceSet(req)
    testPrompt(req)

    ⚠️ AiGatewayClient 내부에서만 호출. 다른 서비스에서 직접 주입 금지.
```

**기존 파일**

- `GeminiClient` — 그대로 유지. `GeminiFallbackClient` 내부에서만 호출.

**DTO (PQL-Domain-AI/dto, record)**

- `LlmConfigDto` — `{ model, systemPrompt, userTemplate, temperature, maxTokens, responseSchema? }`
- `GenerateQuestionFullRequest` — `{ context, llmConfig }`
  - `QuestionFullContextDto` — `{ schemaDdl, schemaSampleData, schemaIntent?, topic, subtopic?, difficulty, hint? }`
- `GenerateQuestionFullResult` — `{ stem, answerSql, seedChoices: List<GeneratedChoiceDto>, metadata }`
- `GenerateChoiceSetRequest` / `GenerateChoiceSetResult`
  - `ChoiceSetContextDto` — `{ questionUuid, stem, answerSql, schemaDdl, schemaSampleData, schemaIntent?, difficulty }`
- `TestPromptRequest` — `{ llmConfig, variables: Map<String,String> }`
- `TestPromptResult` — `{ result, elapsedMs }`
- `GeneratedChoiceDto` — `{ key, body, isCorrect, rationale }`
- `GenerationMetadataDto` — `{ modelName, promptTemplateUuid?, elapsedMs, promptTokens?, completionTokens?, rawResponseJson?, attempts }`

**Circuit Breaker 설정 (`application-*.yml`)**

```yaml
resilience4j:
  circuitbreaker:
    instances:
      aiServer:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      aiServer:
        maxAttempts: 2
        waitDuration: 500ms

passql:
  ai-server:
    base-url: https://ai.passql.suhsaechan.kr
    api-key: ${AI_SERVER_API_KEY}
    timeout-ms: 15000
```

### 3.3. Spring `PQL-Domain-Question`

```
QuestionService (기존 확장)
    createQuestionWithSeedSet(QuestionCreateRequest) -> Question
        트랜잭션:
            1. Question 저장
            2. QuestionChoiceSet(source=ADMIN_SEED, status=OK, is_reusable=true) 저장
            3. QuestionChoiceSetItem × 4 저장
    getQuestion(uuid)  // 없으면 CustomException(QUESTION_NOT_FOUND)
    listQuestions(filter, pageable)
    buildSchemaContext(question) -> ChoiceSetContextDto

ChoiceSetResolver                    ★ 신규 — 정책 분기
    resolveForUser(questionUuid, memberUuid) -> QuestionChoiceSet
        switch (question.choiceSetPolicy):
            case AI_ONLY:
                1. 프리페치 캐시 조회
                2. HIT: consumed_at=NOW() UPDATE 후 return
                3. MISS: choiceSetGenerationService.generate(source=AI_RUNTIME)
            case CURATED_ONLY:
                throw new CustomException(CHOICE_SET_POLICY_NOT_IMPLEMENTED)
            case HYBRID:
                throw new CustomException(CHOICE_SET_POLICY_NOT_IMPLEMENTED)

ChoiceSetGenerationService           ★ 신규 — AI 생성 + 검증 재시도 루프
    generate(questionUuid, memberUuid, source) -> QuestionChoiceSet
        // 상세 의사코드는 §6.4 참조

SandboxValidator                     ★ 신규
    validate(choices, answerSql, schemaDdl, schemaSampleData) -> ValidationReport
        1. SandboxPool.acquire() → 임시 DB 획득
        2. DDL + sample data 적용 (실패 시 SANDBOX_SETUP_FAILED)
        3. answerSql 실행 → expected result set (실패 시 SANDBOX_ANSWER_SQL_FAILED)
        4. 각 choice.body 실행 → actual vs expected 비교 (정렬 무시 set)
        5. ValidationReport { correctCount, items: [{key, status, rows, elapsedMs, matchesExpected, error}] }
        6. finally: SandboxPool.release()

SandboxPool                          ★ 신규 (MVP는 단순 create/drop)
    acquire() -> String               // "sandbox_{nanoid8}" + CREATE DATABASE
    release(dbName)                    // DROP DATABASE

SandboxExecutor (기존 TODO → 구현)
    applyDdl(dbName, ddl)  -> void
    execute(dbName, sql)   -> ExecuteResult  // { status, rows, columns, errorMessage, elapsedMs }

QuizSessionService                   ★ 신규
    createSession(memberUuid, topicUuid?, difficultyRange?) -> QuizSession
        → Question 10개 픽 (is_active=true AND policy=AI_ONLY AND 필터)
        → 부족하면 CustomException(QUIZ_SESSION_INSUFFICIENT_QUESTIONS)
        → 순서 shuffle → JSON 저장
    getQuestionAt(sessionUuid, index) -> QuestionViewDto
        → 인덱스 검증 (QUIZ_SESSION_INDEX_OUT_OF_RANGE)
        → choiceSet = choiceSetResolver.resolveForUser(...)
        → prefetchService.prefetchNext(sessionUuid, index) 비동기 트리거
        → return { question, choiceSet }
    submitAnswer(sessionUuid, index, choiceSetUuid, choiceKey) -> SubmitResult
        → choiceSetUuid 가 현재 세션·인덱스와 일치하는지 검증 (QUIZ_SESSION_CHOICE_SET_MISMATCH)
        → SubmissionService.submit()
    completeSession(sessionUuid)

PrefetchService                      ★ 신규 @Async("aiTaskExecutor")
    @Async
    prefetchNext(sessionUuid, currentIndex) -> void
        try:
            nextIndex = currentIndex + 1
            if nextIndex >= totalQuestions: return
            if existsPrefetchedFor(nextQuestionUuid, memberUuid, status=OK): return
            choiceSetGenerationService.generate(nextQuestionUuid, memberUuid, source=AI_PREFETCH)
        catch CustomException e:
            log.warn("[prefetch] failed, runtime will regenerate: code={}", e.getErrorCode(), e)
        catch Exception e:
            log.error("[prefetch] unexpected", e)
        // 모든 예외 흡수 — 사용자 플로우 차단 금지
```

**Repository 신규/확장**

- `QuestionRepository` — `pickN(int n, filter)` 추가
- `QuestionChoiceSetRepository` 신규:
  - `findPrefetchedFor(questionUuid, memberUuid)` — `status=OK AND source=AI_PREFETCH AND generated_for_member_uuid=:uuid AND consumed_at IS NULL`
  - `existsPrefetchedFor(questionUuid, memberUuid, status)`
  - `findByQuestion(questionUuid, pageable)`
  - `findAllForAdmin(filter, pageable)` — source/status/기간 필터
- `QuestionChoiceSetItemRepository` 신규
- `QuizSessionRepository` 신규

**@Async 설정 (`AsyncConfig.java` 신규)**

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("aiTaskExecutor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor e = new ThreadPoolTaskExecutor();
        e.setCorePoolSize(4);
        e.setMaxPoolSize(8);
        e.setQueueCapacity(50);
        e.setThreadNamePrefix("ai-prefetch-");
        e.initialize();
        return e;
    }
}
```

### 3.4. Spring `PQL-Domain-Meta`

```
PromptService (기존 확장)
    getActiveByKeyName(keyName) -> PromptTemplate  // 없으면 PROMPT_NOT_FOUND
    listVersionsByKeyName(keyName) -> List<PromptTemplate>
    activateVersion(promptTemplateUuid)
        트랜잭션:
            1. 해당 uuid isActive=true
            2. 같은 keyName 다른 버전 isActive=false
```

### 3.5. Spring `PQL-Domain-Submission`

```
SubmissionService (기존 확장)
    submit(sessionUuid, questionUuid, choiceSetUuid, memberUuid, choiceKey, questionIndex)
        → choiceSetItemRepo.findByChoiceSetAndKey() (없으면 CHOICE_SET_NOT_FOUND)
        → isCorrect = item.isCorrect
        → Submission 저장
        → return { isCorrect, correctKey, rationales: Map<key, rationale> }
```

### 3.6. Spring `PQL-Web` — 컨트롤러

```
QuizController                        ★ 신규
    POST /quiz/start                                 → createSession → redirect q/0
    GET  /quiz/{sessionUuid}/q/{index}               → getQuestionAt → quiz/question.html
    POST /quiz/{sessionUuid}/q/{index}/submit        → submit → redirect result
    GET  /quiz/{sessionUuid}/q/{index}/result        → quiz/result.html
    GET  /quiz/{sessionUuid}/complete                → completeSession → quiz/complete.html

AdminQuestionController (기존 확장)
    GET  /admin/questions                            → 기존 목록
    GET  /admin/questions/new                        → 등록 폼 (question-new.html)
    POST /admin/questions/generate-full              → AI 생성 (JSON, preview용)
    POST /admin/questions                            → 저장 (Q + seed set)
    GET  /admin/questions/{uuid}                     → 상세
    GET  /admin/questions/{uuid}/choice-sets         → 이 문제의 모든 세트 이력

AdminChoiceSetController              ★ 신규
    GET  /admin/choice-sets                          → 전체 조회 (필터)
    GET  /admin/choice-sets/{uuid}                   → 세트 상세 (raw_response_json 포함)
    PUT  /admin/choice-sets/{uuid}/disable           → status=DISABLED
    PUT  /admin/choice-sets/{uuid}/promote           → source=ADMIN_CURATED, is_reusable=true

AdminPromptController (기존 확장)
    GET  /admin/prompts                              → 프롬프트 목록
    GET  /admin/prompts/{uuid}/test                  → 테스트 페이지 (prompt-test.html)
    POST /admin/prompts/{uuid}/test                  → AiGatewayClient.testPrompt
    PUT  /admin/prompts/{uuid}/activate              → 버전 활성화

AdminSandboxController                ★ 신규 (관리자 등록 폼의 [샌드박스 실행 테스트] 버튼용)
    POST /admin/sandbox/execute                      → { ddl, sampleData, sql } → ExecuteResult
```

### 3.7. 의존성 그래프

```
[Controllers]
QuizController                           AdminQuestionController
    │                                         │
    └──▶ QuizSessionService                   ├──▶ QuestionService
              │                               ├──▶ AiGatewayClient
              ├──▶ QuestionService            │        (generate-question-full)
              ├──▶ ChoiceSetResolver          └──▶ SandboxValidator
              │         │
              │         └──▶ ChoiceSetGenerationService
              │                    │
              │                    ├──▶ AiGatewayClient ★ 유일한 AI 진입점
              │                    │         │
              │                    │         ├──[1차] Python AI Server (HTTP)
              │                    │         │             │
              │                    │         │             └──▶ Gemini API
              │                    │         │
              │                    │         └──[fallback] GeminiFallbackClient
              │                    │                              │
              │                    │                              └──▶ GeminiClient
              │                    │                                          │
              │                    │                                          └──▶ Gemini API
              │                    │
              │                    ├──▶ SandboxValidator
              │                    │         │
              │                    │         └──▶ SandboxExecutor
              │                    │
              │                    └──▶ QuestionChoiceSetRepository
              │
              └──▶ PrefetchService (@Async)
                         │
                         └──▶ ChoiceSetGenerationService (재사용)
```

---

## 4. 프롬프트 설계

### 4.1. 프롬프트 키 목록 (Flyway 시드)

| keyName | 용도 | 호출 주체 | model | temperature | max_tokens |
|---|---|---|---|---|---|
| `generate_question_full` | 관리자 등록 시 stem+answer_sql+seed set | Admin 등록 폼 | gemini-2.5-flash-lite | 0.8 | 2048 |
| `generate_choice_set` | 사용자 풀이 진입 시 선택지 4개 세트 | QuizController / PrefetchService | gemini-2.5-flash-lite | 0.9 | 1536 |

### 4.2. `generate_question_full` 초안

**system_prompt:**
```
너는 SQL 교육용 4지선다 문제를 만드는 한국어 출제자야.
반드시 다음 규칙을 지켜:

1. 입력으로 주어진 DB 스키마(CREATE TABLE)와 샘플 데이터(INSERT)를 완전히 이해하고,
   그 데이터 상에서 실제로 실행 가능한 SQL 문제만 만든다.
2. 문제(stem)는 한국어로, 사용자가 정확히 어떤 결과를 원해야 하는지 명확히 서술한다.
3. 정답 SQL(answer_sql)은 주어진 스키마에 대해 실제로 실행되어 의도한 결과를 내는 쿼리여야 한다.
4. 선택지(seed_choices)는 정확히 4개(A, B, C, D)이며, 이 중 정확히 1개만 정답이다.
5. 오답 3개는 다음 중 하나 이상의 실수를 포함해야 한다:
   - 문법은 맞지만 논리가 잘못됨 (예: INNER JOIN ↔ LEFT JOIN 착각)
   - WHERE 조건의 경계값 오류
   - GROUP BY / HAVING 착각
   - 집계 함수 선택 오류 (SUM vs COUNT vs AVG)
   - 정렬 방향 오류
6. 각 선택지에는 rationale(왜 맞거나 틀린지 한국어 설명)을 반드시 포함한다.
7. 선택지들은 "비슷하게 보이지만 실행 결과가 다른" 형태로 만들어서
   학습자가 실수하기 쉬운 지점을 드러내야 한다.
8. 출력은 반드시 response_schema에 맞는 JSON 형식이어야 한다.
```

**user_template:**
```
[난이도] {difficulty}/5
[토픽] {topic}
[서브토픽] {subtopic}
[힌트 키워드] {hint}

[DB 스키마 - DDL]
{schema_ddl}

[샘플 데이터 - INSERT]
{schema_sample_data}

[스키마 의도 설명]
{schema_intent}

위 스키마와 데이터를 기반으로 난이도 {difficulty}에 맞는 SQL 문제를 1개 만들어줘.
문제(stem), 기준 정답 SQL(answer_sql), 선택지 4개(seed_choices)를 JSON으로 반환해.
```

**response_schema:**
```json
{
  "type": "object",
  "properties": {
    "stem": { "type": "string" },
    "answer_sql": { "type": "string" },
    "seed_choices": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "object",
        "properties": {
          "key":        { "type": "string", "enum": ["A","B","C","D"] },
          "body":       { "type": "string" },
          "is_correct": { "type": "boolean" },
          "rationale":  { "type": "string" }
        },
        "required": ["key","body","is_correct","rationale"]
      }
    }
  },
  "required": ["stem","answer_sql","seed_choices"]
}
```

### 4.3. `generate_choice_set` 초안

**system_prompt:**
```
너는 이미 주어진 SQL 문제와 정답에 대해, 학습자를 헷갈리게 할 4지선다 선택지 세트를 생성하는 출제자야.
반드시 다음 규칙을 지켜:

1. 주어진 문제(stem), 정답 SQL(answer_sql), DB 스키마, 샘플 데이터를 완전히 이해한다.
2. 정답 SQL과 "의미상 동일한 결과를 내지만 형태가 다른" SQL 1개를 정답(is_correct=true)으로 만든다.
   - 매번 호출할 때마다 서로 다른 정답 표현을 만들어라 (JOIN 순서, WHERE ↔ HAVING,
     서브쿼리 ↔ JOIN, EXISTS ↔ IN 등).
   - 단, 의미는 반드시 원본 answer_sql과 동일해야 한다 (실행 결과셋 동일).
3. 오답 3개는 다음 중 하나 이상의 실수를 포함:
   - 문법은 맞지만 논리가 잘못됨
   - 경계값·NULL·정렬 실수
   - 잘못된 집계/그룹핑
   - JOIN 타입 오류
4. 선택지 4개는 비슷해 보여야 한다 (학습자가 빠르게 읽으면 헷갈리도록).
5. 각 선택지에 rationale(한국어) 필수.
6. 출력은 response_schema에 맞는 JSON.
7. 매 호출마다 다른 선택지 세트가 나오도록 해라. 같은 표현을 반복하지 마라.
```

**user_template:**
```
[문제]
{stem}

[기준 정답 SQL - 이것과 결과가 같은 SQL이 정답]
{answer_sql}

[DB 스키마 - DDL]
{schema_ddl}

[샘플 데이터 - INSERT]
{schema_sample_data}

[스키마 의도]
{schema_intent}

[난이도] {difficulty}/5

위 문제에 대한 4지선다 선택지(A,B,C,D)를 새로 생성해줘.
정답 1개, 오답 3개. JSON 형식으로 반환.
```

**response_schema:**
```json
{
  "type": "object",
  "properties": {
    "choices": {
      "type": "array",
      "minItems": 4,
      "maxItems": 4,
      "items": {
        "type": "object",
        "properties": {
          "key":        { "type": "string", "enum": ["A","B","C","D"] },
          "body":       { "type": "string" },
          "is_correct": { "type": "boolean" },
          "rationale":  { "type": "string" }
        },
        "required": ["key","body","is_correct","rationale"]
      }
    }
  },
  "required": ["choices"]
}
```

### 4.4. 변수 치환 규칙

- Python `render_user_template(template, variables)` — 단순 `{변수명}` → 값 치환
- `variables` 에 없는 키가 템플릿에 있으면 **빈 문자열** 로 치환
- SQL 본문에 `{`, `}` 가 포함된 경우 `{{`, `}}` 이스케이프 필요

### 4.5. 토큰 예산 (Gemini 2.5 flash-lite 기준 개략치)

| 구분 | prompt | completion | 합계 |
|---|---|---|---|
| `generate_question_full` (1회) | ~1500 | ~800 | ~2300 |
| `generate_choice_set` (1회) | ~1200 | ~600 | ~1800 |
| 재시도 포함 평균 (≈1.3회) | — | — | ~2340 |

비용은 flash-lite 초저가라 공모전 데모 규모에선 부담 없음. 병목은 **지연**이며 프리페치로 숨김.

---

## 5. 화면 / UI

### 5.1. 사용자 퀴즈 플로우

**파일:**
```
templates/quiz/
    ├─ layout.html          — 공통 레이아웃 (진행바, 헤더)
    ├─ loading.html         — 첫 문제 로딩 연출 (AI 생성 단계 시각화)
    ├─ question.html        — 문제 풀이
    ├─ result.html          — 제출 결과 (정답/오답 + rationale)
    ├─ complete.html        — 세션 완료 요약
    └─ error/
        ├─ generation-failed.html    — CHOICE_SET_GENERATION_FAILED
        ├─ session-not-found.html    — QUIZ_SESSION_NOT_FOUND
        └─ ai-down.html              — AI_FALLBACK_FAILED
```

**첫 문제 로딩 연출** (공모전 셀링 포인트):

```
┌─────────────────────────────────────────────┐
│   AI가 당신을 위한 문제를 만들고 있어요       │
│                                             │
│   [1/4] 문제 맥락 이해 중...         ✓     │
│   [2/4] 선택지 4개 초안 생성 중...   ⏳    │
│   [3/4] 샌드박스에서 SQL 검증 중...        │
│   [4/4] 정답 판별 완료                     │
│                                             │
│   매번 새로운 선택지로 출제됩니다           │
└─────────────────────────────────────────────┘
```

MVP는 CSS 애니메이션으로 4단계 순차 체크 연출. 실제 서버 이벤트 push는 후속.

**문제 화면:** 진행바(10문제 중 현재), stem, DB 스키마 접기/펼치기, 샘플 데이터 접기/펼치기, 선택지 4개 라디오, 제출 버튼.

**결과 화면:** 내가 고른 답 / 정답 / 4개 선택지 각각 is_correct + rationale 표시 / [다음 문제] 버튼.

**완료 화면:** 정답 수, 소요 시간, 문제별 결과 요약 테이블.

### 5.2. 관리자 문제 등록 (`/admin/questions/new`)

3-Step 위저드 (단일 HTML + JS 탭 전환)

- **Step 1 입력:** 토픽 / 서브토픽 / 난이도 / schema_ddl / schema_sample_data / schema_intent? / hint? / choice_set_policy
- **Step 2:** 스피너 + "Gemini가 문제를 만들고 있어요..." (`POST /admin/questions/generate-full` AJAX)
- **Step 3 검수:** stem · answer_sql · seed 선택지 4개 편집, 각각 [샌드박스 실행 테스트] 버튼, [재생성] / [저장]

**파일:**
```
templates/admin/
    ├─ question-new.html       (신규)
    ├─ questions.html          (기존 수정 — "문제 등록" 버튼 + "선택지 세트 이력" 링크)
    └─ question-detail.html    (신규 또는 기존 확장)
```

### 5.3. 관리자 선택지 세트 이력 (`/admin/choice-sets`)

**목록 화면:** source / status / 기간 / 문제 필터 + 테이블(생성시각, 문제, 출처, 상태, 재시도, 모델, [상세])

**상세 화면:** 문제 링크, source, status, 생성 대상 멤버, 모델·temperature, 프롬프트 버전 링크, 재시도 횟수, 샌드박스 검증 여부, 총 소요, 선택지 4개 (각각 is_correct, sandbox 실행 결과, rationale), raw_response_json 뷰어, [비활성화], [재사용 풀 승격] 버튼.

**파일:**
```
templates/admin/
    ├─ choice-sets.html            (신규 — 목록 + 필터)
    └─ choice-set-detail.html      (신규 — 상세)
```

이 대시보드가 **공모전 발표 자료의 핵심** — "AI가 이렇게 많이 만들었고 이렇게 검증됐다"를 그대로 보여줄 수 있음.

### 5.4. 관리자 프롬프트 테스트 (`/admin/prompts/{uuid}/test`)

좌측 버전 히스토리 사이드바 + 우측 테스트 패널

- **사이드바:** keyName별 버전 목록, 활성 버전에 `●` 표시, 클릭 시 우측 로드
- **우측:** 선택된 프롬프트의 system_prompt / user_template readonly 표시, `{변수}` 자동 파싱해 입력 필드 생성, `[문제에서 불러오기]` 모달로 실제 문제 context 채우기, `[테스트 실행]` → 결과 표시, `[이 버전 활성화]` 버튼

**파일:**
```
templates/admin/
    ├─ prompts.html           (기존 수정 — 각 행에 [테스트] 버튼)
    └─ prompt-test.html       (신규)
```

### 5.5. 이번 스코프 명시적 제외

- 신고 UI — 스키마만 수용, 페이지 X
- CURATED_ONLY / HYBRID 정책 설정 UI — 등록 폼 드롭다운에만 옵션 존재
- 문제 목록 검색 고도화 — 기존 페이지네이션만
- 세션 히스토리 페이지 — 과거 푼 세션 다시 보기 X
- 통계 대시보드 — 정답률·실패율 차트 X

---

## 6. 에러 처리 — `CustomException` + `ErrorCode` 단일 규약

### 6.1. 규약 (절대 원칙)

- **모든 예외는 `com.passql.common.exception.CustomException` 하나만 사용**
- 구분은 **`ErrorCode` enum** 값으로
- 신규 도메인 예외 클래스 **금지** (`ChoiceSetGenerationFailedException` 같은 거 만들지 않음)
- 호출 코드는 `catch (CustomException e)` + `e.getErrorCode()` 로 분기
- 기존 `GlobalExceptionHandler` 가 `CustomException` → HttpStatus + 메시지로 응답 매핑

### 6.2. 신규 `ErrorCode` 추가

`server/PQL-Common/src/main/java/com/passql/common/exception/constant/ErrorCode.java` 에 추가:

```java
// === AI 생성 / 선택지 세트 (신규) ===
AI_SERVER_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버에 연결할 수 없습니다."),
AI_FALLBACK_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버와 대체 경로 모두 실패했습니다."),
AI_RESPONSE_PARSE_FAILED(HttpStatus.BAD_GATEWAY, "AI 응답을 해석할 수 없습니다."),
AI_STRUCTURED_SCHEMA_VIOLATION(HttpStatus.BAD_GATEWAY, "AI가 스키마에 맞지 않는 응답을 반환했습니다."),

CHOICE_SET_GENERATION_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "선택지 세트 생성에 실패했습니다. 다시 시도해주세요."),
CHOICE_SET_VALIDATION_NO_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 없습니다."),
CHOICE_SET_VALIDATION_MULTIPLE_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 여러 개입니다."),
CHOICE_SET_NOT_FOUND(HttpStatus.NOT_FOUND, "선택지 세트를 찾을 수 없습니다."),
CHOICE_SET_POLICY_NOT_IMPLEMENTED(HttpStatus.NOT_IMPLEMENTED, "해당 선택지 정책은 아직 지원되지 않습니다."),

// === 샌드박스 검증 (신규) ===
SANDBOX_SETUP_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "샌드박스 환경 구성에 실패했습니다."),
SANDBOX_ANSWER_SQL_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "기준 정답 SQL 실행에 실패했습니다."),

// === 퀴즈 세션 (신규) ===
QUIZ_SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈 세션을 찾을 수 없습니다."),
QUIZ_SESSION_ALREADY_COMPLETED(HttpStatus.CONFLICT, "이미 완료된 세션입니다."),
QUIZ_SESSION_INDEX_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "잘못된 문제 인덱스입니다."),
QUIZ_SESSION_CHOICE_SET_MISMATCH(HttpStatus.BAD_REQUEST, "제출한 선택지 세트가 현재 세션과 일치하지 않습니다."),
QUIZ_SESSION_INSUFFICIENT_QUESTIONS(HttpStatus.UNPROCESSABLE_ENTITY, "세션을 생성할 문제가 부족합니다."),

// === 관리자 문제 등록 (신규) ===
QUESTION_GENERATE_INPUT_INVALID(HttpStatus.BAD_REQUEST, "문제 생성 입력값이 올바르지 않습니다."),
```

기존 `AI_UNAVAILABLE`, `AI_TIMEOUT`, `QUESTION_NOT_FOUND`, `PROMPT_NOT_FOUND`, `SANDBOX_TIMEOUT`, `SQL_SYNTAX`, `SQL_SEMANTIC` 등은 **그대로 재사용**.

### 6.3. 에러 발생 지점 → ErrorCode 매핑

| 발생 위치 | 조건 | ErrorCode | 처리 |
|---|---|---|---|
| `AiGatewayClient` | Python 커넥션 거부·타임아웃 | (예외를 CircuitBreaker 가 감지) | Fallback 발동 |
| `AiGatewayClient` | Python HTTP 5xx | `AI_SERVER_UNAVAILABLE` throw | Fallback 발동 |
| `AiGatewayClient` | 응답 파싱 실패 | `AI_RESPONSE_PARSE_FAILED` throw | 재시도 루프 |
| Python `gemini_client` | structured output 스키마 위반 | (Python 500) → Spring `AI_STRUCTURED_SCHEMA_VIOLATION` | 재시도 루프 |
| `AiGatewayClient` fallback 메서드 | fallback 내부에서도 실패 | `AI_FALLBACK_FAILED` | 호출자로 전파 |
| `ChoiceSetGenerationService` | 재시도 3회 후 correctCount==0 | `CHOICE_SET_VALIDATION_NO_CORRECT` | 사용자 에러 토스트 |
| `ChoiceSetGenerationService` | 재시도 3회 후 correctCount>=2 | `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` | 동일 |
| `ChoiceSetGenerationService` | 완전 실패 (AI 경로 다운) | `CHOICE_SET_GENERATION_FAILED` | 동일 |
| `SandboxValidator` | 임시 DB 생성/DDL 적용 실패 | `SANDBOX_SETUP_FAILED` | 재시도 없이 전파 |
| `SandboxValidator` | 기준 answer_sql 실행 실패 | `SANDBOX_ANSWER_SQL_FAILED` | 재시도 없이 전파 |
| `SandboxExecutor` | SQL 타임아웃 | 기존 `SANDBOX_TIMEOUT` | 그대로 |
| `ChoiceSetResolver` | policy == CURATED_ONLY/HYBRID | `CHOICE_SET_POLICY_NOT_IMPLEMENTED` | 501 |
| `QuizSessionService.createSession` | 조건 만족 문제 < 10 | `QUIZ_SESSION_INSUFFICIENT_QUESTIONS` | 관리자 안내 |
| `QuizSessionService.getQuestionAt` | 세션 없음 | `QUIZ_SESSION_NOT_FOUND` | 404 |
| `QuizSessionService.getQuestionAt` | 인덱스 범위 밖 | `QUIZ_SESSION_INDEX_OUT_OF_RANGE` | 400 |
| `QuizSessionService.submitAnswer` | choiceSetUuid 불일치 | `QUIZ_SESSION_CHOICE_SET_MISMATCH` | 400 |
| `QuizSessionService.submitAnswer` | 세션 COMPLETED | `QUIZ_SESSION_ALREADY_COMPLETED` | 409 |
| `SubmissionService.submit` | choice set item 못 찾음 | `CHOICE_SET_NOT_FOUND` | 500 |
| `AdminQuestionController.generateFull` | 필수 입력 누락 | `QUESTION_GENERATE_INPUT_INVALID` | 400 |

### 6.4. ChoiceSetGenerationService 재시도 루프 (의사코드)

```java
public QuestionChoiceSet generate(UUID questionUuid, UUID memberUuid, ChoiceSetSource source) {
    Question question = questionService.getQuestion(questionUuid);
    PromptTemplate prompt = promptService.getActiveByKeyName("generate_choice_set");
    GenerateChoiceSetRequest req = buildRequest(question, prompt);

    ValidationReport lastReport = null;
    GenerateChoiceSetResult lastResult = null;
    ErrorCode lastErrorCode = null;
    int attempts = 0;

    for (attempts = 1; attempts <= 3; attempts++) {
        try {
            lastResult = aiGatewayClient.generateChoiceSet(req);
            lastReport = sandboxValidator.validate(
                lastResult.choices(), question.getAnswerSql(),
                question.getSchemaDdl(), question.getSchemaSampleData());

            if (lastReport.correctCount() == 1) {
                return saveSuccess(question, source, memberUuid, prompt,
                                   lastResult, lastReport, attempts);
            }

            lastErrorCode = (lastReport.correctCount() == 0)
                ? ErrorCode.CHOICE_SET_VALIDATION_NO_CORRECT
                : ErrorCode.CHOICE_SET_VALIDATION_MULTIPLE_CORRECT;
            log.info("[choice-gen] validation failed: code={}, attempt={}/3, questionUuid={}",
                     lastErrorCode, attempts, questionUuid);
            // loop continue

        } catch (CustomException e) {
            ErrorCode ec = e.getErrorCode();
            // 재시도 불가 에러는 즉시 실패 저장 후 throw
            if (ec == ErrorCode.SANDBOX_SETUP_FAILED
                || ec == ErrorCode.SANDBOX_ANSWER_SQL_FAILED
                || ec == ErrorCode.AI_FALLBACK_FAILED) {
                saveFailed(question, source, memberUuid, prompt, lastResult, attempts, ec);
                throw e;
            }
            // 재시도 가능 에러 (파싱 실패, 스키마 위반 등)
            lastErrorCode = ec;
            log.warn("[choice-gen] transient error, retrying: code={}, attempt={}/3",
                     ec, attempts, e);
        }
    }

    // 3회 다 실패
    saveFailed(question, source, memberUuid, prompt, lastResult, 3, lastErrorCode);
    throw new CustomException(
        lastErrorCode != null ? lastErrorCode : ErrorCode.CHOICE_SET_GENERATION_FAILED,
        "questionUuid=" + questionUuid + ", source=" + source);
}
```

**핵심:**
- 모든 throw는 `new CustomException(ErrorCode.XXX, detail)` 형태
- catch 는 `CustomException` 하나만, `e.getErrorCode()` 로 분기
- 성공·실패 모두 `QuestionChoiceSet` 을 DB에 저장 (FAILED는 관측·디버깅용)

### 6.5. PrefetchService 예외 처리

```java
@Async("aiTaskExecutor")
public void prefetchNext(UUID sessionUuid, int currentIndex) {
    try {
        // ... 생성 호출 ...
        choiceSetGenerationService.generate(nextQuestionUuid, memberUuid, ChoiceSetSource.AI_PREFETCH);
    } catch (CustomException e) {
        log.warn("[prefetch] failed, runtime will regenerate: code={}, sessionUuid={}, nextIndex={}",
                 e.getErrorCode(), sessionUuid, currentIndex + 1, e);
    } catch (Exception e) {
        log.error("[prefetch] unexpected", e);
    }
    // 모든 예외 흡수 — 사용자 플로우 차단 금지
}
```

### 6.6. 샌드박스 격리 전략

- 검증 1회당 임시 DB 생성/삭제: `sandbox_{nanoid8}` → DDL+샘플데이터 적용 → 검증 → DROP
- `SandboxPool.acquire()/release()` 인터페이스로 래핑 (MVP는 단순 create/drop, 풀링은 후속)
- 샌드박스 DB는 **별도 DataSource** (`sandboxDataSource`) — 메인 비즈니스 DB와 권한·커넥션 풀 격리
- `CREATE DATABASE`, `DROP DATABASE` 권한을 가진 전용 계정 사용
- `application-*.yml` 에 `passql.sandbox.datasource.*` 설정

### 6.7. 트랜잭션 경계

| 작업 | 트랜잭션 | 이유 |
|---|---|---|
| `createQuestionWithSeedSet` | **단일** (Question + ChoiceSet + Items) | 일관성 |
| `ChoiceSetGenerationService.generate` | **비트랜잭션** + save만 짧은 트랜잭션 | AI·샌드박스 호출이 수 초 걸림, 긴 트랜잭션 금지 |
| `submitAnswer` | **단일** (Submission 저장 + session 상태) | 정합성 |
| `PrefetchService.prefetchNext` | **@Async + 별도 트랜잭션** | 독립 실행 |
| `activatePrompt` | **단일** (activate + deactivate others) | 두 상태 동시 변경 |

### 6.8. 관측성

**로그 태그 컨벤션:**
```
[ai-gateway]  — AiGatewayClient 호출/응답/fallback 발동
[choice-gen]  — ChoiceSetGenerationService 생성 루프
[sandbox-val] — SandboxValidator 검증 결과
[prefetch]    — PrefetchService (async)
[quiz-session]— QuizSessionService
```

**DB 영구 메타데이터 (관측성 겸용):**

`question_choice_set` 테이블이 관측성 테이블 역할도 수행:
- `generation_attempts` / `total_elapsed_ms` / `sandbox_validation_passed`
- `raw_response_json` (Gemini 원본 응답 전체)
- `last_error_code` (실패 시 ErrorCode enum 값)
- `status` / `source`

→ `/admin/choice-sets` 대시보드에서 이걸 전부 조회 가능. 공모전 발표 자료로 그대로 사용.

Prometheus 메트릭 등 실시간 지표는 이번 스코프 X, 로그+DB로 충분.

---

## 7. 스코프 요약

### 이번 구현 범위 (IN-SCOPE)

- Flyway V0_0_28 (question 재정의, choice_set/item/quiz_session 신설, submission 확장, prompt 시드 2개)
- Python AI Server: gemini_client.py 신규, 엔드포인트 3개, pyproject.toml 의존성 추가
- Spring: AiGatewayClient + GeminiFallbackClient, ChoiceSetResolver, ChoiceSetGenerationService, SandboxValidator, SandboxExecutor 구현, SandboxPool, QuizSessionService, PrefetchService(@Async)
- Spring Controllers: QuizController 신규, AdminQuestionController 확장, AdminChoiceSetController 신규, AdminPromptController 확장, AdminSandboxController 신규
- Thymeleaf: quiz/* 템플릿, admin/question-new.html, admin/choice-sets.html + detail, admin/prompt-test.html
- ErrorCode 신규 값 추가, 전 코드 `CustomException` 통일

### 명시적 제외 (OUT-OF-SCOPE)

- 선택지 세트 신고 기능 (스키마만 수용)
- CURATED_ONLY / HYBRID 정책 실제 동작 (resolver는 throw)
- 관리자 직접 선택지 작성 UI
- 적응형 문제 추천 (세션 내 동적 선택)
- 세션 히스토리 / 통계 대시보드
- Ollama 임베딩 기반 유사 문제 검색 (별도 이슈)
- 기존 Python `explain-error` / `diff-explain` / `similar` 엔드포인트 구현 (별도 이슈)
- Prometheus 메트릭
- SSE/WebSocket 기반 실시간 생성 진행 push (CSS 연출로 대체)

---

## 8. 열린 결정 사항 (구현 중 최종 확정)

1. **샌드박스 DataSource 설정** — 메인 DB와 동일 MariaDB 인스턴스 내 별도 계정으로 할지, 별도 인스턴스로 할지. MVP는 동일 인스턴스 + 전용 계정 권장.
2. **프리페치 idempotency 키** — `(question_uuid, member_uuid, status=OK, source=AI_PREFETCH, consumed_at IS NULL)` 존재 시 skip. 경쟁 조건 (동시 두 호출) 은 DB UNIQUE 제약 아니라 애플리케이션 레벨로 허용 (중복 생성돼도 기능적 문제 없음, 한쪽만 소비됨).
3. **`schema_sample_data` 포맷 가이드** — 관리자가 입력할 때 INSERT 문 형식 강제. 검증은 Step 3 샌드박스 실행으로 자동 확인.
4. **문제 픽 필터** — `QuizSessionService.createSession` 에서 10문제 뽑는 기준. MVP는 `is_active=true AND choice_set_policy='AI_ONLY'` 그리고 topic/difficulty 필터. 중복 없이 랜덤 10개.
5. **세션 TTL** — `quiz_session` 이 계속 쌓이는데 만료 정책은? MVP는 TTL 없음, 후속 이슈에서 배치 정리.
