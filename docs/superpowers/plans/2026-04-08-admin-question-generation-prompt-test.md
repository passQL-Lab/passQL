# Admin 문제 등록(AI 생성) + 프롬프트 테스트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 DDL/토픽/힌트를 입력하면 AI(Gemini)가 문제+선택지 4개를 자동 생성하고, 관리자가 검토 후 저장하는 문제 등록 기능과, 프롬프트 버전별 테스트 및 활성화 페이지를 구현한다.

**Architecture:** Spring이 Python AI Server(FastAPI)에 문제 생성 요청 → Python이 Gemini API 호출 → 결과 반환. Python 다운 시 Spring GeminiClient로 직접 fallback. EXECUTABLE 문제는 SandboxExecutor로 선택지 SQL 실행하여 정답 자동 판별, CONCEPT_ONLY는 Gemini가 정답+rationale 포함. 프롬프트 테스트 페이지는 같은 AiGatewayClient를 통해 실제 AI를 호출하고 결과를 표시한다.

**Tech Stack:** Spring Boot 3 / Java 21, Thymeleaf, Python FastAPI, Google Gemini API (gemini-2.5-flash-lite), Resilience4j CircuitBreaker, MariaDB, Flyway

---

## 파일 구조

### 신규 생성 파일

**Spring — PQL-Domain-AI**
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java` — Python AI Server 호출 + fallback
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/QuestionGenerateRequest.java` — AI 생성 요청 DTO
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedQuestion.java` — AI 생성 결과 DTO
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedChoice.java` — 선택지 DTO
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestRequest.java` — 프롬프트 테스트 요청 DTO
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestResult.java` — 프롬프트 테스트 결과 DTO

**Spring — PQL-Domain-Question**
- `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/QuestionSaveRequest.java` — 문제 저장 요청 DTO
- `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/ChoiceSaveItem.java` — 선택지 저장 DTO
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionGenerateService.java` — AI 생성 + 저장 서비스

**Spring — PQL-Web**
- `server/PQL-Web/src/main/resources/templates/admin/question-new.html` — 문제 등록 페이지
- `server/PQL-Web/src/main/resources/templates/admin/prompt-test.html` — 프롬프트 테스트 페이지

**Python AI Server**
- `ai/src/routers/ai_router.py` — 기존 라우터에 신규 엔드포인트 추가 (또는 신규 파일)
- `ai/src/services/gemini_client.py` — Gemini API 클라이언트 (신규)
- `ai/src/services/question_generate_service.py` — 문제 생성 서비스 (신규)
- `ai/src/schemas/question_schema.py` — 요청/응답 Pydantic 스키마 (신규)

**DB Migration**
- `server/PQL-Web/src/main/resources/db/migration/V0_0_24__add_generate_prompt_templates.sql` — generate_question, validate_concept 프롬프트 시드

### 수정 파일

- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java` — new/generate/save/search 엔드포인트 추가
- `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminPromptController.java` — test/activate 엔드포인트 추가
- `server/PQL-Web/src/main/resources/templates/admin/questions.html` — "문제 등록" 버튼 + "프롬프트 테스트" 버튼 추가
- `server/PQL-Web/src/main/resources/templates/admin/prompts.html` — 버전 히스토리 사이드바 + 테스트 버튼 추가
- `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/PromptService.java` — activatePrompt() 메서드 추가
- `ai/src/routers/ai_router.py` — generate-question, test-prompt 라우트 추가

---

## Task 1: Python AI Server — Gemini 클라이언트 구현

**Files:**
- Create: `ai/src/services/gemini_client.py`

- [ ] **Step 1: gemini_client.py 작성**

```python
# ai/src/services/gemini_client.py
import time
import json
from typing import Any
import google.generativeai as genai
from core.config import settings
from core.exceptions import CustomError, ErrorCode

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)

    async def chat(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> tuple[str, int]:
        """Returns (response_text, elapsed_ms)"""
        start = time.monotonic()
        try:
            m = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            response = m.generate_content(user_prompt)
            elapsed_ms = int((time.monotonic() - start) * 1000)
            return response.text, elapsed_ms
        except Exception as e:
            raise CustomError(ErrorCode.AI_CALL_FAILED, detail=str(e))

    async def chat_structured(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict[str, Any],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> tuple[dict, int]:
        """Returns (parsed_json_dict, elapsed_ms)"""
        start = time.monotonic()
        try:
            m = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            response = m.generate_content(user_prompt)
            elapsed_ms = int((time.monotonic() - start) * 1000)
            return json.loads(response.text), elapsed_ms
        except Exception as e:
            raise CustomError(ErrorCode.AI_CALL_FAILED, detail=str(e))


gemini_client = GeminiClient()
```

- [ ] **Step 2: google-generativeai 의존성 확인**

```bash
cat ai/requirements.txt | grep google
```

없으면 추가:
```bash
echo "google-generativeai>=0.8.0" >> ai/requirements.txt
```

- [ ] **Step 3: CustomError/ErrorCode에 AI_CALL_FAILED 확인**

```bash
grep -r "AI_CALL_FAILED\|ErrorCode" ai/src/core/ --include="*.py"
```

없으면 `ai/src/core/exceptions.py`에 추가:
```python
class ErrorCode:
    AI_CALL_FAILED = "AI_CALL_FAILED"
    # ... 기존 코드 유지
```

- [ ] **Step 4: 커밋**

```bash
git add ai/src/services/gemini_client.py ai/requirements.txt
git commit -m "feat(ai): Gemini 클라이언트 구현 (chat, chat_structured)"
```

---

## Task 2: Python AI Server — 문제 생성 스키마 및 서비스

**Files:**
- Create: `ai/src/schemas/question_schema.py`
- Create: `ai/src/services/question_generate_service.py`

- [ ] **Step 1: Pydantic 스키마 작성**

```python
# ai/src/schemas/question_schema.py
from pydantic import BaseModel
from typing import Optional

class PromptTemplatePayload(BaseModel):
    system_prompt: str
    user_template: str
    model: str = "gemini-2.5-flash-lite"
    temperature: float = 0.7
    max_tokens: int = 2048

class QuestionGenerateRequest(BaseModel):
    topic: str
    subtopic: Optional[str] = None
    difficulty: int = 3
    execution_mode: str  # EXECUTABLE | CONCEPT_ONLY | RANDOM
    ddl: Optional[str] = None
    hint: Optional[str] = None
    prompt_template: PromptTemplatePayload

class ChoiceItem(BaseModel):
    key: str  # A | B | C | D
    body: str
    is_correct: bool
    rationale: str

class QuestionGenerateResponse(BaseModel):
    stem: str
    execution_mode: str
    choices: list[ChoiceItem]

class PromptTestRequest(BaseModel):
    system_prompt: str
    user_template: str
    model: str = "gemini-2.5-flash-lite"
    temperature: float = 0.7
    max_tokens: int = 2048
    variables: dict[str, str] = {}

class PromptTestResponse(BaseModel):
    result: str
    elapsed_ms: int
```

- [ ] **Step 2: 문제 생성 서비스 작성**

```python
# ai/src/services/question_generate_service.py
import re
from schemas.question_schema import (
    QuestionGenerateRequest, QuestionGenerateResponse, ChoiceItem
)
from services.gemini_client import gemini_client

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "stem": {"type": "string"},
        "choices": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
            "items": {
                "type": "object",
                "properties": {
                    "key": {"type": "string", "enum": ["A", "B", "C", "D"]},
                    "body": {"type": "string"},
                    "is_correct": {"type": "boolean"},
                    "rationale": {"type": "string"},
                },
                "required": ["key", "body", "is_correct", "rationale"],
            },
        },
    },
    "required": ["stem", "choices"],
}


def _build_user_prompt(req: QuestionGenerateRequest) -> str:
    template = req.prompt_template.user_template
    replacements = {
        "{topic}": req.topic,
        "{subtopic}": req.subtopic or "",
        "{difficulty}": str(req.difficulty),
        "{execution_mode}": req.execution_mode,
        "{ddl}": req.ddl or "없음",
        "{hint}": req.hint or "없음",
    }
    for k, v in replacements.items():
        template = template.replace(k, v)
    return template


async def generate_question(req: QuestionGenerateRequest) -> QuestionGenerateResponse:
    user_prompt = _build_user_prompt(req)
    result, _ = await gemini_client.chat_structured(
        model=req.prompt_template.model,
        system_prompt=req.prompt_template.system_prompt,
        user_prompt=user_prompt,
        response_schema=RESPONSE_SCHEMA,
        temperature=req.prompt_template.temperature,
        max_tokens=req.prompt_template.max_tokens,
    )
    return QuestionGenerateResponse(
        stem=result["stem"],
        execution_mode=req.execution_mode,
        choices=[ChoiceItem(**c) for c in result["choices"]],
    )


async def test_prompt(
    system_prompt: str,
    user_template: str,
    model: str,
    temperature: float,
    max_tokens: int,
    variables: dict[str, str],
) -> tuple[str, int]:
    user_prompt = user_template
    for k, v in variables.items():
        user_prompt = user_prompt.replace("{" + k + "}", v)
    return await gemini_client.chat(
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
    )
```

- [ ] **Step 3: 커밋**

```bash
git add ai/src/schemas/question_schema.py ai/src/services/question_generate_service.py
git commit -m "feat(ai): 문제 생성 스키마 및 서비스 구현"
```

---

## Task 3: Python AI Server — 라우터 엔드포인트 추가

**Files:**
- Modify: `ai/src/routers/ai_router.py`

- [ ] **Step 1: 기존 ai_router.py 확인**

```bash
cat ai/src/routers/ai_router.py
```

- [ ] **Step 2: generate-question, test-prompt 엔드포인트 추가**

기존 라우터 파일 하단에 추가 (기존 엔드포인트는 건드리지 않음):

```python
# ai/src/routers/ai_router.py 하단에 추가
from schemas.question_schema import (
    QuestionGenerateRequest, QuestionGenerateResponse,
    PromptTestRequest, PromptTestResponse,
)
from services.question_generate_service import generate_question, test_prompt

@router.post("/generate-question", response_model=QuestionGenerateResponse)
async def generate_question_endpoint(
    req: QuestionGenerateRequest,
    api_key: str = Depends(verify_api_key),
):
    return await generate_question(req)


@router.post("/test-prompt", response_model=PromptTestResponse)
async def test_prompt_endpoint(
    req: PromptTestRequest,
    api_key: str = Depends(verify_api_key),
):
    result, elapsed_ms = await test_prompt(
        system_prompt=req.system_prompt,
        user_template=req.user_template,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        variables=req.variables,
    )
    return PromptTestResponse(result=result, elapsed_ms=elapsed_ms)
```

- [ ] **Step 3: 커밋**

```bash
git add ai/src/routers/ai_router.py
git commit -m "feat(ai): generate-question, test-prompt 라우터 추가"
```

---

## Task 4: Spring — AiGatewayClient 및 DTO 구현

**Files:**
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/QuestionGenerateRequest.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedChoice.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedQuestion.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestRequest.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestResult.java`
- Create: `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java`

- [ ] **Step 1: DTO 작성 — QuestionGenerateRequest**

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/QuestionGenerateRequest.java
package com.passql.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionGenerateRequest(
    String topic,
    String subtopic,
    Integer difficulty,
    String executionMode,
    String ddl,
    String hint,
    PromptTemplatePayload promptTemplate
) {
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PromptTemplatePayload(
        String systemPrompt,
        String userTemplate,
        String model,
        Float temperature,
        Integer maxTokens
    ) {}
}
```

- [ ] **Step 2: DTO 작성 — GeneratedChoice, GeneratedQuestion**

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedChoice.java
package com.passql.ai.dto;

public record GeneratedChoice(
    String key,
    String body,
    Boolean isCorrect,
    String rationale,
    String executionResult  // nullable, 샌드박스 실행 후 Spring에서 채움
) {}
```

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GeneratedQuestion.java
package com.passql.ai.dto;

import java.util.List;

public record GeneratedQuestion(
    String stem,
    String executionMode,
    List<GeneratedChoice> choices
) {}
```

- [ ] **Step 3: DTO 작성 — PromptTestRequest, PromptTestResult**

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestRequest.java
package com.passql.ai.dto;

import java.util.Map;

public record PromptTestRequest(
    String systemPrompt,
    String userTemplate,
    String model,
    Float temperature,
    Integer maxTokens,
    Map<String, String> variables
) {}
```

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/PromptTestResult.java
package com.passql.ai.dto;

public record PromptTestResult(
    String result,
    Integer elapsedMs
) {}
```

- [ ] **Step 4: AiGatewayClient 작성**

```java
// server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java
package com.passql.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passql.ai.dto.*;
import com.passql.meta.entity.PromptTemplate;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Component
public class AiGatewayClient {

    private final RestClient restClient;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public AiGatewayClient(
            @Value("${ai-server.base-url}") String baseUrl,
            @Value("${ai-server.api-key}") String apiKey,
            GeminiClient geminiClient,
            ObjectMapper objectMapper
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .build();
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    @CircuitBreaker(name = "ai", fallbackMethod = "generateQuestionFallback")
    public GeneratedQuestion generateQuestion(QuestionGenerateRequest req) {
        return restClient.post()
                .uri("/api/ai/generate-question")
                .body(req)
                .retrieve()
                .body(GeneratedQuestion.class);
    }

    public GeneratedQuestion generateQuestionFallback(QuestionGenerateRequest req, Throwable t) {
        log.warn("Python AI Server down, falling back to GeminiClient direct call: {}", t.getMessage());
        return generateQuestionDirect(req);
    }

    @CircuitBreaker(name = "ai", fallbackMethod = "testPromptFallback")
    public PromptTestResult testPrompt(PromptTestRequest req) {
        return restClient.post()
                .uri("/api/ai/test-prompt")
                .body(req)
                .retrieve()
                .body(PromptTestResult.class);
    }

    public PromptTestResult testPromptFallback(PromptTestRequest req, Throwable t) {
        log.warn("Python AI Server down, falling back to GeminiClient direct: {}", t.getMessage());
        return testPromptDirect(req);
    }

    private GeneratedQuestion generateQuestionDirect(QuestionGenerateRequest req) {
        var payload = req.promptTemplate();
        String userPrompt = payload.userTemplate()
                .replace("{topic}", req.topic())
                .replace("{subtopic}", req.subtopic() == null ? "" : req.subtopic())
                .replace("{difficulty}", String.valueOf(req.difficulty()))
                .replace("{execution_mode}", req.executionMode())
                .replace("{ddl}", req.ddl() == null ? "없음" : req.ddl())
                .replace("{hint}", req.hint() == null ? "없음" : req.hint());
        try {
            String json = geminiClient.chatStructured(
                    payload.model(), payload.systemPrompt(), userPrompt,
                    payload.temperature(), payload.maxTokens());
            return objectMapper.readValue(json, GeneratedQuestion.class);
        } catch (Exception e) {
            throw new RuntimeException("Gemini direct call failed: " + e.getMessage(), e);
        }
    }

    private PromptTestResult testPromptDirect(PromptTestRequest req) {
        String userPrompt = req.userTemplate();
        for (Map.Entry<String, String> entry : req.variables().entrySet()) {
            userPrompt = userPrompt.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        long start = Instant.now().toEpochMilli();
        String result = geminiClient.chat(req.model(), req.systemPrompt(), userPrompt,
                req.temperature(), req.maxTokens());
        int elapsed = (int) (Instant.now().toEpochMilli() - start);
        return new PromptTestResult(result, elapsed);
    }
}
```

- [ ] **Step 5: application-dev.yml에 ai-server 설정 추가 확인**

```bash
grep -n "ai-server" server/PQL-Web/src/main/resources/application-dev.yml
```

없으면 추가:
```yaml
# server/PQL-Web/src/main/resources/application-dev.yml 에 추가
ai-server:
  base-url: http://localhost:8001
  api-key: ${AI_SERVER_API_KEY:devkey}
```

- [ ] **Step 6: GeminiClient.chatStructured() 시그니처 확인 후 필요시 오버로드 추가**

```bash
grep -n "chatStructured\|public" server/PQL-Domain-AI/src/main/java/com/passql/ai/client/GeminiClient.java
```

`chatStructured(model, systemPrompt, userPrompt, temperature, maxTokens)` 시그니처가 없으면 GeminiClient.java에 추가:
```java
public String chatStructured(String model, String systemPrompt, String userPrompt,
                              Float temperature, Integer maxTokens) {
    // 기존 chatStructured 로직 - JSON string 반환
    var config = GenerateContentConfig.builder()
            .systemInstruction(systemPrompt)
            .temperature(temperature)
            .maxOutputTokens(maxTokens)
            .responseMimeType("application/json")
            .build();
    var client = new com.google.genai.Client.Builder()
            .apiKey(apiKey).build();
    var response = client.models.generateContent(model, userPrompt, config);
    return response.text();
}
```

- [ ] **Step 7: 커밋**

```bash
git add server/PQL-Domain-AI/src/main/java/com/passql/ai/
git commit -m "feat(spring): AiGatewayClient 및 AI DTO 구현"
```

---

## Task 5: Spring — QuestionGenerateService 및 저장 DTO

**Files:**
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/QuestionSaveRequest.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/dto/ChoiceSaveItem.java`
- Create: `server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionGenerateService.java`

- [ ] **Step 1: 저장 DTO 작성**

```java
// server/PQL-Domain-Question/src/main/java/com/passql/question/dto/ChoiceSaveItem.java
package com.passql.question.dto;

public record ChoiceSaveItem(
    String choiceKey,   // A | B | C | D
    String kind,        // SQL | TEXT
    String body,
    Boolean isCorrect,
    String rationale,
    Integer sortOrder
) {}
```

```java
// server/PQL-Domain-Question/src/main/java/com/passql/question/dto/QuestionSaveRequest.java
package com.passql.question.dto;

import java.util.List;
import java.util.UUID;

public record QuestionSaveRequest(
    UUID topicUuid,
    UUID subtopicUuid,      // nullable
    Integer difficulty,
    String executionMode,   // EXECUTABLE | CONCEPT_ONLY
    String dialect,         // mariadb
    String sandboxDbName,   // nullable, EXECUTABLE 시 필수
    String stem,
    String schemaDisplay,   // nullable
    String schemaDdl,       // nullable
    String explanationSummary, // nullable
    List<ChoiceSaveItem> choices
) {}
```

- [ ] **Step 2: QuestionGenerateService 작성**

```java
// server/PQL-Domain-Question/src/main/java/com/passql/question/service/QuestionGenerateService.java
package com.passql.question.service;

import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.*;
import com.passql.meta.entity.PromptTemplate;
import com.passql.meta.service.PromptService;
import com.passql.question.constant.ChoiceKind;
import com.passql.question.constant.ExecutionMode;
import com.passql.question.dto.ChoiceSaveItem;
import com.passql.question.dto.QuestionSaveRequest;
import com.passql.question.entity.Question;
import com.passql.question.entity.QuestionChoice;
import com.passql.question.repository.QuestionChoiceRepository;
import com.passql.question.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionGenerateService {

    private final AiGatewayClient aiGatewayClient;
    private final PromptService promptService;
    private final SandboxExecutor sandboxExecutor;
    private final QuestionRepository questionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;

    public GeneratedQuestion generate(
            String topicCode, String subtopicCode,
            Integer difficulty, String executionMode,
            String ddl, String hint
    ) {
        PromptTemplate pt = promptService.getActivePrompt("generate_question");

        String resolvedMode = "RANDOM".equals(executionMode)
                ? (Math.random() < 0.5 ? "EXECUTABLE" : "CONCEPT_ONLY")
                : executionMode;

        var req = QuestionGenerateRequest.builder()
                .topic(topicCode)
                .subtopic(subtopicCode)
                .difficulty(difficulty)
                .executionMode(resolvedMode)
                .ddl(ddl)
                .hint(hint)
                .promptTemplate(QuestionGenerateRequest.PromptTemplatePayload.builder()
                        .systemPrompt(pt.getSystemPrompt())
                        .userTemplate(pt.getUserTemplate())
                        .model(pt.getModel())
                        .temperature(pt.getTemperature())
                        .maxTokens(pt.getMaxTokens())
                        .build())
                .build();

        GeneratedQuestion generated = aiGatewayClient.generateQuestion(req);

        // EXECUTABLE이면 샌드박스 실행하여 executionResult 채우기
        if ("EXECUTABLE".equals(resolvedMode) && ddl != null && !ddl.isBlank()) {
            String sandboxDb = "sqld_preview_" + UUID.randomUUID().toString().substring(0, 8);
            List<GeneratedChoice> enriched = new ArrayList<>();
            for (GeneratedChoice choice : generated.choices()) {
                try {
                    var result = sandboxExecutor.execute(sandboxDb, ddl, choice.body());
                    enriched.add(new GeneratedChoice(
                            choice.key(), choice.body(), choice.isCorrect(),
                            choice.rationale(), result.status() + ": " + result.output()));
                } catch (Exception e) {
                    enriched.add(new GeneratedChoice(
                            choice.key(), choice.body(), choice.isCorrect(),
                            choice.rationale(), "ERROR: " + e.getMessage()));
                }
            }
            return new GeneratedQuestion(generated.stem(), resolvedMode, enriched);
        }

        return generated;
    }

    @Transactional
    public UUID createQuestion(QuestionSaveRequest req) {
        Question question = Question.builder()
                .topicUuid(req.topicUuid())
                .subtopicUuid(req.subtopicUuid())
                .difficulty(req.difficulty())
                .executionMode(ExecutionMode.valueOf(req.executionMode()))
                .dialect(req.dialect() != null ? req.dialect() : "mariadb")
                .sandboxDbName(req.sandboxDbName())
                .stem(req.stem())
                .schemaDisplay(req.schemaDisplay())
                .schemaDdl(req.schemaDdl())
                .explanationSummary(req.explanationSummary())
                .isActive(true)
                .build();
        questionRepository.save(question);

        int order = 1;
        for (ChoiceSaveItem item : req.choices()) {
            QuestionChoice choice = QuestionChoice.builder()
                    .questionUuid(question.getQuestionUuid())
                    .choiceKey(item.choiceKey())
                    .kind(ChoiceKind.valueOf(item.kind()))
                    .body(item.body())
                    .isCorrect(item.isCorrect())
                    .rationale(item.rationale())
                    .sortOrder(order++)
                    .build();
            questionChoiceRepository.save(choice);
        }
        return question.getQuestionUuid();
    }
}
```

- [ ] **Step 3: Question 엔티티에 builder 확인**

```bash
grep -n "@Builder\|@NoArgsConstructor\|@AllArgsConstructor" \
  server/PQL-Domain-Question/src/main/java/com/passql/question/entity/Question.java
```

`@Builder`가 없으면 추가. `@Builder`와 `@NoArgsConstructor`가 함께 있으려면 `@AllArgsConstructor`도 필요:
```java
// Question.java 클래스 어노테이션에 추가
@Builder
@NoArgsConstructor
@AllArgsConstructor
```

- [ ] **Step 4: 커밋**

```bash
git add server/PQL-Domain-Question/src/main/java/com/passql/question/
git commit -m "feat(spring): QuestionGenerateService 및 저장 DTO 구현"
```

---

## Task 6: Spring — PromptService에 activatePrompt() 추가

**Files:**
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/service/PromptService.java`
- Modify: `server/PQL-Domain-Meta/src/main/java/com/passql/meta/repository/PromptTemplateRepository.java`

- [ ] **Step 1: Repository에 메서드 추가**

```java
// PromptTemplateRepository.java 에 추가
List<PromptTemplate> findByKeyName(String keyName);
```

- [ ] **Step 2: PromptService에 activatePrompt() 추가**

```java
// PromptService.java 에 추가
@Transactional
@CacheEvict(value = "prompts", allEntries = true)
public void activatePrompt(UUID promptTemplateUuid) {
    PromptTemplate target = promptTemplateRepository.findById(promptTemplateUuid)
            .orElseThrow(() -> new CustomException(ErrorCode.PROMPT_NOT_FOUND));
    // 같은 keyName의 모든 버전 비활성화
    promptTemplateRepository.findByKeyName(target.getKeyName())
            .forEach(pt -> pt.setIsActive(false));
    // 선택된 버전만 활성화
    target.setIsActive(true);
}

// findByKeyNameOrderByVersionDesc 이미 존재 - 히스토리 조회용
public List<PromptTemplate> findByKeyName(String keyName) {
    return promptTemplateRepository.findByKeyNameOrderByVersionDesc(keyName);
}
```

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Domain-Meta/src/main/java/com/passql/meta/
git commit -m "feat(spring): PromptService에 activatePrompt, findByKeyName 추가"
```

---

## Task 7: Flyway 마이그레이션 — generate_question, validate_concept 프롬프트 시드

**Files:**
- Create: `server/PQL-Web/src/main/resources/db/migration/V0_0_24__add_generate_prompt_templates.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- V0_0_24__add_generate_prompt_templates.sql

-- generate_question: 문제 + 선택지 4개 생성용
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT
    UUID(),
    'generate_question', 1, 1, 'gemini-2.5-flash-lite',
    '당신은 SQLD(SQL 개발자) 자격증 시험 문제를 출제하는 전문가입니다. 주어진 조건에 맞춰 정확하고 교육적인 SQL 문제를 생성하세요. 반드시 JSON 형식으로만 응답하세요.',
    '토픽: {topic}\n서브토픽: {subtopic}\n난이도: {difficulty}/5\n실행모드: {execution_mode}\n\nDDL:\n{ddl}\n\n출제 힌트: {hint}\n\n위 조건으로 SQLD 시험 스타일의 4지선다 문제를 생성하세요.\n- stem: 문제 지문 (예: "다음 중 올바른 SQL은?", "다음 중 틀린 것은?")\n- choices: A,B,C,D 4개 선택지\n  - EXECUTABLE이면 각 선택지는 실행 가능한 SQL문\n  - CONCEPT_ONLY이면 개념 설명 텍스트\n- is_correct: 정답은 반드시 1개\n- rationale: 각 선택지가 정답/오답인 이유',
    0.7, 2048, 'SQLD 문제 생성 프롬프트 v1',
    NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template WHERE key_name = 'generate_question' AND version = 1
);

-- validate_concept: CONCEPT_ONLY 정답 검증용
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT
    UUID(),
    'validate_concept', 1, 1, 'gemini-2.5-flash-lite',
    '당신은 SQL 및 데이터베이스 전문가입니다. 주어진 문제와 선택지를 분석하여 정답과 오답 이유를 명확히 설명하세요.',
    '문제: {stem}\n\n선택지:\nA. {choice_a}\nB. {choice_b}\nC. {choice_c}\nD. {choice_d}\n\n위 문제에서 정답을 판별하고 각 선택지의 정답/오답 이유를 설명하세요.',
    0.3, 1024, 'CONCEPT_ONLY 정답 검증 프롬프트 v1',
    NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template WHERE key_name = 'validate_concept' AND version = 1
);
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/db/migration/V0_0_24__add_generate_prompt_templates.sql
git commit -m "feat(db): generate_question, validate_concept 프롬프트 템플릿 시드 추가"
```

---

## Task 8: Spring — AdminQuestionController 엔드포인트 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java`

- [ ] **Step 1: AdminQuestionController 수정**

```java
// AdminQuestionController.java 전체 교체
package com.passql.web.controller.admin;

import com.passql.ai.dto.GeneratedQuestion;
import com.passql.meta.service.MetaService;
import com.passql.question.dto.QuestionSaveRequest;
import com.passql.question.service.QuestionGenerateService;
import com.passql.question.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Controller
@RequestMapping("/admin/questions")
@RequiredArgsConstructor
public class AdminQuestionController {

    private final QuestionService questionService;
    private final QuestionGenerateService questionGenerateService;
    private final MetaService metaService;

    // 기존 목록 조회
    @GetMapping
    public String list(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Integer difficulty,
            @RequestParam(required = false) String executionMode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Model model
    ) {
        size = Math.min(size, 100);
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        model.addAttribute("questions", questionService.getQuestions(topic, null, difficulty, executionMode, pageable));
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 관리");
        return "admin/questions";
    }

    // 문제 등록 폼 렌더링
    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("topics", metaService.getTopicTree());
        model.addAttribute("currentMenu", "questions");
        model.addAttribute("pageTitle", "문제 등록");
        return "admin/question-new";
    }

    // AI 문제 생성 (AJAX JSON)
    @PostMapping("/generate")
    @ResponseBody
    public ResponseEntity<GeneratedQuestion> generate(
            @RequestParam String topicCode,
            @RequestParam(required = false) String subtopicCode,
            @RequestParam(defaultValue = "3") Integer difficulty,
            @RequestParam(defaultValue = "EXECUTABLE") String executionMode,
            @RequestParam(required = false) String ddl,
            @RequestParam(required = false) String hint
    ) {
        GeneratedQuestion result = questionGenerateService.generate(
                topicCode, subtopicCode, difficulty, executionMode, ddl, hint);
        return ResponseEntity.ok(result);
    }

    // 문제 저장
    @PostMapping
    public String save(@ModelAttribute QuestionSaveRequest req) {
        UUID uuid = questionGenerateService.createQuestion(req);
        return "redirect:/admin/questions/" + uuid;
    }

    // 프롬프트 테스트용 문제 검색 (AJAX JSON)
    @GetMapping("/search")
    @ResponseBody
    public ResponseEntity<?> search(@RequestParam(required = false) String q) {
        var pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
        var result = questionService.getQuestions(null, null, null, null, pageable);
        return ResponseEntity.ok(result.getContent());
    }
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminQuestionController.java
git commit -m "feat(spring): AdminQuestionController new/generate/save/search 엔드포인트 추가"
```

---

## Task 9: Spring — AdminPromptController test/activate 추가

**Files:**
- Modify: `server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminPromptController.java`

- [ ] **Step 1: AdminPromptController 수정**

기존 파일 하단에 추가 (기존 GET/POST/PUT은 건드리지 않음):

```java
// AdminPromptController.java 에 import 추가
import com.passql.ai.client.AiGatewayClient;
import com.passql.ai.dto.PromptTestRequest;
import com.passql.ai.dto.PromptTestResult;

// 필드 추가
private final AiGatewayClient aiGatewayClient;

// 생성자에 AiGatewayClient 추가 (Lombok @RequiredArgsConstructor 사용 중이면 자동)

// 메서드 추가
@GetMapping("/{uuid}/test")
public String testPage(@PathVariable UUID uuid, 
                       @RequestParam(required = false) String questionUuid,
                       Model model) {
    var prompt = promptService.findById(uuid)
            .orElseThrow(() -> new RuntimeException("Prompt not found"));
    var allPrompts = promptService.findAll();
    var historyByKey = promptService.findByKeyName(prompt.getKeyName());
    model.addAttribute("prompt", prompt);
    model.addAttribute("allPrompts", allPrompts);
    model.addAttribute("history", historyByKey);
    model.addAttribute("selectedQuestionUuid", questionUuid);
    model.addAttribute("currentMenu", "prompts");
    model.addAttribute("pageTitle", "프롬프트 테스트");
    return "admin/prompt-test";
}

@PostMapping("/{uuid}/test")
@ResponseBody
public ResponseEntity<PromptTestResult> runTest(
        @PathVariable UUID uuid,
        @RequestBody PromptTestRequest req
) {
    PromptTestResult result = aiGatewayClient.testPrompt(req);
    return ResponseEntity.ok(result);
}

@PutMapping("/{uuid}/activate")
@ResponseBody
public ResponseEntity<Void> activate(@PathVariable UUID uuid) {
    promptService.activatePrompt(uuid);
    return ResponseEntity.ok().build();
}
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/java/com/passql/web/controller/admin/AdminPromptController.java
git commit -m "feat(spring): AdminPromptController test/activate 엔드포인트 추가"
```

---

## Task 10: Thymeleaf — 문제 등록 페이지 (question-new.html)

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/question-new.html`

- [ ] **Step 1: question-new.html 작성**

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{admin/layout :: head('문제 등록')}"></head>
<body>
<div th:replace="~{admin/layout :: sidebar}"></div>
<main class="ml-64 p-8">
  <h1 class="text-2xl font-bold mb-6">문제 등록</h1>

  <!-- Step 1: 기본 설정 -->
  <div id="step1" class="card bg-base-100 shadow p-6 mb-6">
    <h2 class="text-lg font-semibold mb-4">1. 기본 설정</h2>
    <div class="grid grid-cols-2 gap-4">
      <!-- 토픽 -->
      <div class="form-control">
        <label class="label"><span class="label-text">토픽 *</span></label>
        <select id="topicCode" class="select select-bordered" onchange="loadSubtopics(this.value)">
          <option value="">선택하세요</option>
          <option th:each="t : ${topics}" th:value="${t.code()}" th:text="${t.displayName()}"></option>
        </select>
      </div>
      <!-- 서브토픽 -->
      <div class="form-control">
        <label class="label"><span class="label-text">서브토픽</span></label>
        <select id="subtopicCode" class="select select-bordered">
          <option value="">없음</option>
        </select>
      </div>
      <!-- 난이도 -->
      <div class="form-control">
        <label class="label"><span class="label-text">난이도: <span id="diffVal">3</span></span></label>
        <input type="range" id="difficulty" min="1" max="5" value="3" class="range range-primary"
               oninput="document.getElementById('diffVal').textContent=this.value">
      </div>
      <!-- 실행모드 -->
      <div class="form-control">
        <label class="label"><span class="label-text">실행 모드</span></label>
        <div class="flex gap-4 mt-2">
          <label class="cursor-pointer flex items-center gap-1">
            <input type="radio" name="executionMode" value="EXECUTABLE" class="radio radio-primary" checked> EXECUTABLE
          </label>
          <label class="cursor-pointer flex items-center gap-1">
            <input type="radio" name="executionMode" value="CONCEPT_ONLY" class="radio radio-primary"> CONCEPT_ONLY
          </label>
          <label class="cursor-pointer flex items-center gap-1">
            <input type="radio" name="executionMode" value="RANDOM" class="radio radio-primary"> 랜덤
          </label>
        </div>
      </div>
    </div>
    <!-- DDL -->
    <div class="form-control mt-4">
      <label class="label"><span class="label-text">DDL (EXECUTABLE 시 필수)</span></label>
      <textarea id="ddl" class="textarea textarea-bordered font-mono" rows="6"
                placeholder="CREATE TABLE orders (&#10;  id INT PRIMARY KEY,&#10;  ...&#10;);"></textarea>
    </div>
    <!-- 힌트 -->
    <div class="form-control mt-4">
      <label class="label"><span class="label-text">힌트 키워드 (선택)</span></label>
      <input id="hint" type="text" class="input input-bordered"
             placeholder="예: OUTER JOIN 함정, NULL 처리">
    </div>
    <div class="mt-6 flex gap-3">
      <button onclick="generateQuestion()" class="btn btn-primary" id="generateBtn">
        AI 생성
      </button>
    </div>
  </div>

  <!-- Step 3: 검토 & 저장 (AI 생성 후 표시) -->
  <div id="step3" class="hidden">
    <div class="card bg-base-100 shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">2. 생성 결과 검토</h2>
      <form id="saveForm" method="post" th:action="@{/admin/questions}">
        <!-- hidden fields -->
        <input type="hidden" name="topicUuid" id="f_topicUuid">
        <input type="hidden" name="subtopicUuid" id="f_subtopicUuid">
        <input type="hidden" name="difficulty" id="f_difficulty">
        <input type="hidden" name="executionMode" id="f_executionMode">
        <input type="hidden" name="dialect" value="mariadb">
        <input type="hidden" name="schemaDdl" id="f_schemaDdl">

        <!-- stem -->
        <div class="form-control mb-4">
          <label class="label"><span class="label-text font-semibold">문제 지문</span></label>
          <textarea id="f_stem" name="stem" class="textarea textarea-bordered" rows="4"></textarea>
        </div>

        <!-- 선택지 A~D -->
        <div id="choicesContainer" class="space-y-4"></div>

        <div class="mt-6 flex gap-3">
          <button type="button" onclick="resetForm()" class="btn btn-outline">재생성</button>
          <button type="submit" class="btn btn-success">저장</button>
        </div>
      </form>
    </div>
  </div>
</main>

<script th:inline="javascript">
  const topicsData = /*[[${topics}]]*/ [];

  function loadSubtopics(topicCode) {
    const topic = topicsData.find(t => t.code === topicCode);
    const sel = document.getElementById('subtopicCode');
    sel.innerHTML = '<option value="">없음</option>';
    if (topic && topic.subtopics) {
      topic.subtopics.forEach(s => {
        sel.innerHTML += `<option value="${s.code}">${s.displayName}</option>`;
      });
    }
  }

  async function generateQuestion() {
    const topicCode = document.getElementById('topicCode').value;
    if (!topicCode) { alert('토픽을 선택하세요'); return; }

    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.textContent = 'AI 생성 중...';

    const params = new URLSearchParams({
      topicCode,
      subtopicCode: document.getElementById('subtopicCode').value,
      difficulty: document.getElementById('difficulty').value,
      executionMode: document.querySelector('input[name=executionMode]:checked').value,
      ddl: document.getElementById('ddl').value,
      hint: document.getElementById('hint').value,
    });

    try {
      const res = await fetch('/admin/questions/generate', { method: 'POST', body: params });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      renderResult(data, topicCode);
    } catch (e) {
      alert('AI 생성 실패: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'AI 생성';
    }
  }

  function renderResult(data, topicCode) {
    // hidden fields 채우기
    document.getElementById('f_stem').value = data.stem;
    document.getElementById('f_executionMode').value = data.executionMode;
    document.getElementById('f_schemaDdl').value = document.getElementById('ddl').value;
    document.getElementById('f_difficulty').value = document.getElementById('difficulty').value;

    // 선택지 렌더링
    const container = document.getElementById('choicesContainer');
    container.innerHTML = '';
    data.choices.forEach((c, i) => {
      const executionBadge = c.executionResult
        ? `<span class="badge ${c.executionResult.startsWith('ERROR') ? 'badge-error' : 'badge-success'} ml-2 text-xs">${c.executionResult.substring(0, 40)}</span>`
        : '';
      container.innerHTML += `
        <div class="card bg-base-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <label class="cursor-pointer flex items-center gap-2">
              <input type="radio" name="choices[${i}].isCorrect" value="true"
                     ${c.isCorrect ? 'checked' : ''} class="radio radio-success">
              <span class="font-bold">${c.key}</span>
            </label>
            <input type="hidden" name="choices[${i}].choiceKey" value="${c.key}">
            <input type="hidden" name="choices[${i}].kind" value="${data.executionMode === 'EXECUTABLE' ? 'SQL' : 'TEXT'}">
            <input type="hidden" name="choices[${i}].sortOrder" value="${i+1}">
            ${executionBadge}
          </div>
          <textarea name="choices[${i}].body" class="textarea textarea-bordered w-full font-mono mb-2" rows="3">${c.body}</textarea>
          <textarea name="choices[${i}].rationale" class="textarea textarea-bordered w-full text-sm" rows="2" placeholder="해설...">${c.rationale}</textarea>
        </div>`;
    });

    document.getElementById('step3').classList.remove('hidden');
    document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    document.getElementById('step3').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>
</body>
</html>
```

- [ ] **Step 2: layout fragment 확인**

```bash
grep -r "fragment.*sidebar\|fragment.*head" \
  server/PQL-Web/src/main/resources/templates/admin/ --include="*.html" -l
```

기존 questions.html과 동일한 layout fragment 사용 중인지 확인. layout 파일명이 다르면 `th:replace` 경로 수정.

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/question-new.html
git commit -m "feat(ui): 문제 등록 페이지 (AI 생성) 구현"
```

---

## Task 11: Thymeleaf — 프롬프트 테스트 페이지 (prompt-test.html)

**Files:**
- Create: `server/PQL-Web/src/main/resources/templates/admin/prompt-test.html`

- [ ] **Step 1: prompt-test.html 작성**

```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head th:replace="~{admin/layout :: head('프롬프트 테스트')}"></head>
<body>
<div th:replace="~{admin/layout :: sidebar}"></div>
<main class="ml-64 p-8">
  <h1 class="text-2xl font-bold mb-6">프롬프트 테스트</h1>

  <div class="flex gap-6">
    <!-- 왼쪽: 버전 히스토리 -->
    <div class="w-64 shrink-0">
      <div class="card bg-base-100 shadow p-4">
        <h3 class="font-semibold mb-3">버전 히스토리</h3>
        <div th:each="pt : ${history}" class="mb-1">
          <a th:href="@{/admin/prompts/{uuid}/test(uuid=${pt.promptTemplateUuid})}"
             th:classappend="${pt.promptTemplateUuid == prompt.promptTemplateUuid} ? 'bg-primary text-primary-content' : 'hover:bg-base-200'"
             class="flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm">
            <span th:text="'v' + ${pt.version}">v1</span>
            <span th:if="${pt.isActive}" class="badge badge-success badge-xs">active</span>
          </a>
        </div>
      </div>
    </div>

    <!-- 오른쪽: 테스트 패널 -->
    <div class="flex-1">
      <div class="card bg-base-100 shadow p-6">

        <!-- 현재 프롬프트 정보 -->
        <div class="flex items-center gap-3 mb-4">
          <span class="badge badge-outline" th:text="${prompt.keyName}">keyName</span>
          <span class="badge badge-outline" th:text="'v' + ${prompt.version}">v1</span>
          <span class="badge badge-outline" th:text="${prompt.model}">model</span>
          <span th:if="${prompt.isActive}" class="badge badge-success">active</span>
        </div>

        <!-- 문제 선택 -->
        <div class="form-control mb-4">
          <label class="label"><span class="label-text font-semibold">테스트할 문제 선택</span></label>
          <div class="flex gap-2">
            <input id="questionUuidInput" type="text" class="input input-bordered flex-1"
                   placeholder="문제 UUID 직접 입력 또는 아래 검색"
                   th:value="${selectedQuestionUuid}">
            <button onclick="openSearchModal()" class="btn btn-outline">검색</button>
          </div>
          <div id="questionPreview" class="mt-2 p-3 bg-base-200 rounded text-sm hidden"></div>
        </div>

        <!-- 변수 입력 (userTemplate에서 자동 파싱) -->
        <div class="form-control mb-4">
          <label class="label"><span class="label-text font-semibold">변수 입력</span></label>
          <div id="variableFields" class="space-y-2">
            <!-- JS로 동적 생성 -->
          </div>
        </div>

        <!-- 테스트 실행 버튼 -->
        <div class="flex gap-3 mb-6">
          <button onclick="runTest()" id="testBtn" class="btn btn-primary">테스트 실행</button>
          <button th:unless="${prompt.isActive}"
                  onclick="activateVersion()" class="btn btn-success">이 버전 활성화</button>
        </div>

        <!-- 결과 -->
        <div id="resultSection" class="hidden">
          <div class="divider">결과</div>
          <div class="flex items-center gap-3 mb-2">
            <span class="text-sm text-base-content/60">응답시간: <span id="elapsedMs">-</span>ms</span>
          </div>
          <div id="resultText" class="p-4 bg-base-200 rounded whitespace-pre-wrap text-sm font-mono"></div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- 문제 검색 모달 -->
<dialog id="searchModal" class="modal">
  <div class="modal-box w-11/12 max-w-3xl">
    <h3 class="font-bold text-lg mb-4">문제 검색</h3>
    <input id="searchInput" type="text" class="input input-bordered w-full mb-4"
           placeholder="stem 키워드 검색" oninput="searchQuestions(this.value)">
    <div id="searchResults" class="space-y-2 max-h-96 overflow-y-auto"></div>
    <div class="modal-action">
      <button onclick="document.getElementById('searchModal').close()" class="btn">닫기</button>
    </div>
  </div>
</dialog>

<script th:inline="javascript">
  const promptUuid = /*[[${prompt.promptTemplateUuid}]]*/ '';
  const userTemplate = /*[[${prompt.userTemplate}]]*/ '';
  const systemPrompt = /*[[${prompt.systemPrompt}]]*/ '';
  const model = /*[[${prompt.model}]]*/ 'gemini-2.5-flash-lite';
  const temperature = /*[[${prompt.temperature}]]*/ 0.7;
  const maxTokens = /*[[${prompt.maxTokens}]]*/ 2048;

  // userTemplate에서 {변수명} 파싱 → 입력 필드 자동 생성
  function parseVariables(template) {
    const matches = [...new Set(template.match(/\{([^}]+)\}/g) || [])];
    return matches.map(m => m.slice(1, -1));
  }

  function renderVariableFields() {
    const vars = parseVariables(userTemplate);
    const container = document.getElementById('variableFields');
    container.innerHTML = '';
    vars.forEach(v => {
      container.innerHTML += `
        <div class="flex items-center gap-2">
          <label class="w-32 text-sm font-mono">{${v}}</label>
          <textarea id="var_${v}" class="textarea textarea-bordered flex-1 text-sm" rows="2"
                    placeholder="${v}"></textarea>
        </div>`;
    });
    if (vars.length === 0) {
      container.innerHTML = '<p class="text-sm text-base-content/60">변수 없음</p>';
    }
  }

  async function runTest() {
    const btn = document.getElementById('testBtn');
    btn.disabled = true;
    btn.textContent = '실행 중...';

    const vars = parseVariables(userTemplate);
    const variables = {};
    vars.forEach(v => {
      variables[v] = document.getElementById('var_' + v)?.value || '';
    });

    try {
      const res = await fetch(`/admin/prompts/${promptUuid}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt, userTemplate, model, temperature, maxTokens, variables
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      document.getElementById('elapsedMs').textContent = data.elapsedMs;
      document.getElementById('resultText').textContent = data.result;
      document.getElementById('resultSection').classList.remove('hidden');
    } catch (e) {
      alert('테스트 실패: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '테스트 실행';
    }
  }

  async function activateVersion() {
    if (!confirm('이 버전을 활성화하시겠습니까?')) return;
    const res = await fetch(`/admin/prompts/${promptUuid}/activate`, { method: 'PUT' });
    if (res.ok) location.reload();
    else alert('활성화 실패');
  }

  function openSearchModal() {
    document.getElementById('searchModal').showModal();
    searchQuestions('');
  }

  async function searchQuestions(q) {
    const res = await fetch(`/admin/questions/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const container = document.getElementById('searchResults');
    container.innerHTML = data.map(q => `
      <div class="p-3 bg-base-200 rounded cursor-pointer hover:bg-base-300"
           onclick="selectQuestion('${q.questionUuid}', '${(q.stem||'').substring(0,80).replace(/'/g,"\\'")}')">
        <div class="text-xs text-base-content/60 mb-1">${q.questionUuid}</div>
        <div class="text-sm">${(q.stem||'').substring(0, 100)}</div>
      </div>`).join('');
  }

  function selectQuestion(uuid, stemPreview) {
    document.getElementById('questionUuidInput').value = uuid;
    document.getElementById('questionPreview').textContent = stemPreview;
    document.getElementById('questionPreview').classList.remove('hidden');
    document.getElementById('searchModal').close();
    // stem을 question 변수로 자동 채우기
    const stemField = document.getElementById('var_question_stem') || document.getElementById('var_question');
    if (stemField) stemField.value = stemPreview;
  }

  // 초기화
  renderVariableFields();

  // selectedQuestionUuid가 있으면 미리 표시
  const initUuid = document.getElementById('questionUuidInput').value;
  if (initUuid) {
    document.getElementById('questionPreview').textContent = 'UUID: ' + initUuid;
    document.getElementById('questionPreview').classList.remove('hidden');
  }
</script>
</body>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/prompt-test.html
git commit -m "feat(ui): 프롬프트 테스트 페이지 구현 (버전 히스토리 + 테스트 + 활성화)"
```

---

## Task 12: Thymeleaf — 기존 페이지 버튼 추가

**Files:**
- Modify: `server/PQL-Web/src/main/resources/templates/admin/questions.html`
- Modify: `server/PQL-Web/src/main/resources/templates/admin/prompts.html`

- [ ] **Step 1: questions.html — "문제 등록" + "프롬프트 테스트" 버튼 추가**

기존 questions.html 필터 폼 위에 버튼 추가:
```html
<!-- 기존 <form> 태그 위에 추가 -->
<div class="flex justify-end mb-4">
  <a th:href="@{/admin/questions/new}" class="btn btn-primary">+ 문제 등록</a>
</div>
```

기존 테이블 액션 컬럼에 "프롬프트 테스트" 버튼 추가:
```html
<!-- 기존 수정 버튼 옆에 추가 -->
<a th:href="@{/admin/prompts/test(questionUuid=${q.questionUuid})}"
   class="btn btn-xs btn-ghost">프롬프트 테스트</a>
```

- [ ] **Step 2: prompts.html — 테스트 버튼 추가**

기존 프롬프트 목록 각 항목 옆에 추가:
```html
<!-- 기존 항목 링크 옆에 추가 -->
<a th:href="@{/admin/prompts/{uuid}/test(uuid=${pt.promptTemplateUuid})}"
   class="btn btn-xs btn-outline ml-1">테스트</a>
```

- [ ] **Step 3: 커밋**

```bash
git add server/PQL-Web/src/main/resources/templates/admin/questions.html
git add server/PQL-Web/src/main/resources/templates/admin/prompts.html
git commit -m "feat(ui): 문제 목록/프롬프트 목록에 테스트/등록 버튼 추가"
```

---

## Task 13: 빌드 검증 및 연기 처리

- [ ] **Step 1: Spring 빌드 확인**

```bash
cd server && ./gradlew :PQL-Web:build -x test 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

컴파일 에러 시 주요 원인:
- `AiGatewayClient`에서 `GeminiClient` 메서드 시그니처 불일치 → Task 4 Step 6 참고
- `QuestionGenerateService`에서 `SandboxExecutor.execute()` 시그니처 확인:
  ```bash
  grep -n "public.*execute" server/PQL-Domain-Question/src/main/java/com/passql/question/service/SandboxExecutor.java
  ```
- `Question` 엔티티 builder 어노테이션 누락 → Task 5 Step 3 참고

- [ ] **Step 2: application-dev.yml ai-server 설정 확인**

```bash
grep -A3 "ai-server" server/PQL-Web/src/main/resources/application-dev.yml
```

- [ ] **Step 3: Python AI Server 로컬 실행 확인**

```bash
cd ai && pip install -r requirements.txt
cd src && python main.py &
curl -X POST http://localhost:8001/api/ai/test-prompt \
  -H "Content-Type: application/json" \
  -H "X-API-Key: devkey" \
  -d '{"system_prompt":"테스트","user_template":"안녕","model":"gemini-2.5-flash-lite","temperature":0.7,"max_tokens":100,"variables":{}}'
```

Expected: `{"result": "...", "elapsed_ms": ...}`

- [ ] **Step 4: Spring 서버 실행 후 페이지 접근 확인**

```bash
# 별도 터미널에서 서버 실행
cd server && ./gradlew :PQL-Web:bootRun --args='--spring.profiles.active=dev'
```

브라우저에서 확인:
- `http://localhost:8080/admin/questions` → 목록 + "문제 등록" 버튼 확인
- `http://localhost:8080/admin/questions/new` → 문제 등록 폼 확인
- `http://localhost:8080/admin/prompts` → 프롬프트 목록 + "테스트" 버튼 확인
- `http://localhost:8080/admin/prompts/{uuid}/test` → 테스트 페이지 확인

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: 관리자 문제 등록(AI 생성) + 프롬프트 테스트 페이지 전체 구현"
```

---

## 미결 사항 (구현 중 결정 필요)

1. **EXECUTABLE 정답 판별 기준**: 현재 구현은 Gemini가 `is_correct`를 반환하고 샌드박스 실행은 참고용 배지로만 표시. 실행 결과로 자동 override할지는 관리자가 결정.
2. **sandboxDbName 채번**: `QuestionGenerateService.generate()`에서 preview용 임시 DB명 생성 (`sqld_preview_xxx`). 실제 저장 시 관리자가 입력하거나 auto-increment UUID 사용.
3. **프롬프트 테스트에서 문제 선택 없이 실행**: 변수 직접 입력으로 충분히 테스트 가능 (문제 선택은 선택사항).
