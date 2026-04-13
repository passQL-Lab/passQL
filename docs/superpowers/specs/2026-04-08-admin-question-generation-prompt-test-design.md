# Admin 문제 등록 (AI 생성) + 프롬프트 테스트 설계

**작성일:** 2026-04-08
**이슈:** #22 Entity 스키마 보강 + 관리자 문제 등록/프롬프트 테스트 기능
**범위:** 문제 등록 폼 (AI 생성) + 프롬프트 테스트 페이지 + 버전 히스토리 UI

---

## 1. 전체 아키텍처

### AI 호출 구조

```
관리자 브라우저
    │
    ▼
Spring AdminQuestionController (POST /admin/questions/generate)
    │
    ├─ 1차: Python AI Server (ai.passql.suhsaechan.kr:8001)
    │       POST /api/ai/generate-question
    │       { topic, ddl, hint, mode } → Gemini API 호출
    │
    └─ fallback: Spring GeminiClient 직접 호출 (이미 구현됨)
            (Python AI Server 다운 시 @CircuitBreaker 작동)

생성 결과 반환 → 관리자 검토/수정
    │
    ▼
EXECUTABLE → SandboxExecutor로 4개 SQL 실행 → 정답 자동 판별
CONCEPT_ONLY → Gemini가 이미 정답 + rationale 포함해서 반환
    │
    ▼
관리자 확인 후 저장 → QuestionService.createQuestion()
```

### AI 우선순위

| 순위 | 경로 | 조건 |
|------|------|------|
| 1 | Spring → Python AI Server → Gemini API | 정상 |
| 2 | Spring → GeminiClient 직접 | Python AI Server 다운 |
| 3 | 에러 응답 + 관리자 토스트 | Gemini 완전 실패 |

### 선택지 정책

- 선택지는 **4개 고정 (A~D)**
- EXECUTABLE: 샌드박스 실행 결과로 정답 자동 판별 (관리자 수정 가능)
- CONCEPT_ONLY: Gemini가 정답 + rationale 판별 (관리자 수정 가능)

---

## 2. 문제 등록 페이지 (`/admin/questions/new`)

### 페이지 플로우

```
Step 1: 기본 설정          Step 2: AI 생성            Step 3: 검토 & 저장
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ 토픽/서브토픽    │        │ AI 생성 중...    │        │ stem 편집       │
│ 실행모드 선택    │ ──→   │ (로딩 스피너)    │ ──→   │ 선택지 4개 편집  │
│ DDL 입력        │        │                 │        │ 정답 표시        │
│ 힌트 키워드     │        │                 │        │ 재생성 | 저장   │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### Step 1 — 기본 설정 입력

- 토픽 드롭다운 (MetaService로 활성 topic 목록 조회)
- 서브토픽 드롭다운 (토픽 선택 시 JS 동적 로드)
- 난이도 슬라이더 (1~5)
- 실행모드 라디오: `EXECUTABLE` / `CONCEPT_ONLY` / `랜덤`
- DDL textarea (EXECUTABLE 선택 시 필수, 나머지 선택적)
- 힌트 키워드 입력 (선택적, 예: "OUTER JOIN 함정")
- **[AI 생성]** 버튼

### Step 2 — AI 생성 중

- 버튼 비활성화 + 로딩 스피너
- `POST /admin/questions/generate` 호출 (AJAX)
- 실패 시 에러 토스트 표시

### Step 3 — 검토 & 저장

- stem textarea (수정 가능)
- 선택지 A~D 각각:
  - body textarea (수정 가능)
  - rationale textarea (수정 가능)
  - 정답 라디오 (EXECUTABLE은 샌드박스 결과로 자동 표시)
- EXECUTABLE이면 각 선택지 옆 실행 결과 뱃지 (✅ OK / ❌ ERROR)
- **[재생성]** 버튼 → Step 1로 돌아가되 입력값 유지
- **[저장]** 버튼 → `POST /admin/questions`

---

## 3. 프롬프트 테스트 페이지 (`/admin/prompts/{uuid}/test`)

### 레이아웃

```
┌─────────────────────┬──────────────────────────────────────┐
│   왼쪽: 버전 히스토리 │   오른쪽: 테스트 패널               │
│                     │                                      │
│  explain_error      │  [문제 선택] 버튼                    │
│  ├ v3 (active) ●   │  → 선택된 문제: stem 미리보기        │
│  ├ v2              │                                      │
│  └ v1              │  변수 입력 (userTemplate 파싱)       │
│                     │  {sql}: ________________             │
│  diff_explain       │  {error}: ______________             │
│  ├ v2 (active) ●   │                                      │
│  └ v1              │  [테스트 실행] 버튼                  │
│                     │                                      │
│                     │  ── 결과 ──────────────────         │
│                     │  AI 응답 (텍스트)                    │
│                     │  응답시간: 1.2s                      │
│                     │                                      │
│                     │  [이 버전 활성화] 버튼               │
└─────────────────────┴──────────────────────────────────────┘
```

### 문제 선택 3가지 진입점

**① 문제 목록에서 바로 진입**
- `/admin/questions` 목록 각 행에 [프롬프트 테스트] 버튼 추가
- 클릭 시 `/admin/prompts/test?questionUuid=xxx` 로 이동 → 문제 자동 선택

**② 테스트 페이지 내 모달 검색**
- [문제 선택] 버튼 → 모달 오픈
- stem 키워드 검색 (`GET /admin/questions/search?q=키워드`)
- 결과 리스트에서 클릭 선택

**③ UUID 직접 입력**
- 모달 상단 UUID 직접 입력 필드

### 버전 히스토리 사이드바

- 같은 keyName의 모든 버전 목록 (`findByKeyNameOrderByVersionDesc`)
- 활성 버전에 `●` 표시
- 클릭 시 오른쪽 패널이 해당 버전 내용으로 교체
- [이 버전 활성화] → `PUT /admin/prompts/{uuid}/activate`
  - 해당 uuid `isActive=true`
  - 같은 keyName 나머지 버전 `isActive=false` 자동 처리

### 변수 입력 자동 감지

- `userTemplate`에서 `{변수명}` 패턴 파싱 → 자동으로 입력 필드 생성
- 문제 선택 시 `stem`, `schemaDisplay` 등은 자동 채워짐

### 테스트 실행 흐름

```
POST /admin/prompts/{uuid}/test
{ questionUuid, variables: { sql, error, ... } }
    │
    ├─ Python AI Server → Gemini
    └─ fallback: Spring GeminiClient 직접
    ▼
{ result: "markdown 텍스트", elapsed_ms: 1240 }
```

---

## 4. 백엔드 컴포넌트

### Spring 신규 엔드포인트

**AdminQuestionController**
```
GET  /admin/questions/new           → 등록 폼 렌더링
POST /admin/questions/generate      → AI 문제 생성 (JSON)
POST /admin/questions               → 저장
GET  /admin/questions/search        → 문제 검색 (?q=키워드)
```

**AdminPromptController**
```
GET  /admin/prompts/{uuid}/test     → 테스트 페이지 렌더링
POST /admin/prompts/{uuid}/test     → 테스트 실행 (JSON)
PUT  /admin/prompts/{uuid}/activate → 버전 활성화
```

### Spring 신규 클래스

**QuestionGenerateService** (PQL-Domain-Question)
```
generate(QuestionGenerateRequest)   → AiGatewayClient 호출
validateChoices(draft, sandboxDb)   → EXECUTABLE 시 샌드박스 실행
createQuestion(QuestionSaveRequest) → DB 저장 (Question + QuestionChoice 트랜잭션)
```

**AiGatewayClient** (PQL-Domain-AI)
```
generateQuestion(req)              → Python AI Server 호출
                                     @CircuitBreaker fallback → GeminiClient 직접
testPrompt(promptUuid, variables)  → Python AI Server 호출
                                     @CircuitBreaker fallback → GeminiClient 직접
```

### Python AI Server 신규 엔드포인트

**`POST /api/ai/generate-question`**

Request:
```json
{
  "topic": "JOIN",
  "subtopic": "INNER JOIN",
  "difficulty": 3,
  "execution_mode": "EXECUTABLE",
  "ddl": "CREATE TABLE orders (...);",
  "hint": "OUTER JOIN 함정",
  "prompt_template": {
    "system_prompt": "...",
    "user_template": "...",
    "model": "gemini-2.5-flash-lite",
    "temperature": 0.7,
    "max_tokens": 2048
  }
}
```

Response:
```json
{
  "stem": "다음 중 올바른 SQL은?",
  "execution_mode": "EXECUTABLE",
  "choices": [
    { "key": "A", "body": "SELECT ...", "is_correct": true,  "rationale": "..." },
    { "key": "B", "body": "SELECT ...", "is_correct": false, "rationale": "..." },
    { "key": "C", "body": "SELECT ...", "is_correct": false, "rationale": "..." },
    { "key": "D", "body": "SELECT ...", "is_correct": false, "rationale": "..." }
  ]
}
```

**`POST /api/ai/test-prompt`**

Request:
```json
{
  "system_prompt": "...",
  "user_template": "...",
  "model": "gemini-2.5-flash-lite",
  "temperature": 0.7,
  "max_tokens": 2048,
  "variables": { "sql": "SELECT ...", "error": "..." }
}
```

Response:
```json
{
  "result": "AI 응답 텍스트 (markdown)",
  "elapsed_ms": 1240
}
```

### Gemini 구조화 출력 (generate-question)

`chatStructured()` 사용으로 JSON 파싱 실패 방지:

```python
response_schema = {
  "type": "object",
  "properties": {
    "stem": { "type": "string" },
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
        "required": ["key", "body", "is_correct", "rationale"]
      }
    }
  },
  "required": ["stem", "choices"]
}
```

### PromptTemplate 신규 keyName (Flyway 시드 추가)

| keyName | 용도 |
|---------|------|
| `generate_question` | 문제 + 선택지 4개 생성 |
| `validate_concept` | CONCEPT_ONLY 정답 검증 |

---

## 5. 데이터 변경사항

### QuestionChoice 선택지 수 변경
- 기존: A~E (5개)
- 변경: **A~D (4개) 고정**

### 신규 DTO

**QuestionGenerateRequest** (Spring)
```
topicUuid, subtopicUuid, difficulty, executionMode, ddl, hint
```

**GeneratedQuestion** (Spring)
```
stem, executionMode, choices: List<GeneratedChoice>
GeneratedChoice: key, body, isCorrect, rationale, executionResult(nullable)
```

**QuestionSaveRequest** (Spring)
```
topicUuid, subtopicUuid, difficulty, executionMode, dialect,
sandboxDbName, stem, schemaDisplay, schemaDdl, explanationSummary,
choices: List<ChoiceSaveItem>
```

---

## 6. 미결 사항

- `sandboxDbName` 자동 채번 방식 (예: `sqld_q{auto_increment}`) — 저장 시점에 결정
- EXECUTABLE 정답 판별 기준 확정 필요 (에러 없이 실행되면 정답 후보? 결과셋 비교?)
- `validate_concept` 프롬프트 초안 작성 필요
- `generate_question` 프롬프트 초안 작성 필요
