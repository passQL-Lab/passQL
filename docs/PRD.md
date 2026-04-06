# SQLD 학습 플랫폼 — Product Requirements Document

**작성일:** 2026-04-07  
**데드라인:** D+6 코드 프리즈 (이후 코드 수정 = 실격)  
**원칙:** 코드 프리즈 이후 모든 고도화는 DB(Thymeleaf 관리자 UI)에서만 수행

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [아키텍처](#2-아키텍처)
3. [데이터 모델](#3-데이터-모델)
4. [API 설계](#4-api-설계)
5. [Frontend (React)](#5-frontend-react)
6. [Backend (Spring Boot)](#6-backend-spring-boot)
7. [AI 서버](#7-ai-서버)
8. [일정 / 리스크 / 운영](#8-일정--리스크--운영)

---

## 1. 제품 개요

SQLD 자격증 학습 앱. 기존 교재/인강을 대체하는 것이 목표.

### 핵심 차별점

| 기능 | 설명 |
|------|------|
| SQL 실행 샌드박스 | 모든 선택지 SQL을 실제 MariaDB 샌드박스에 실행 → 결과/에러를 눈으로 확인 |
| AI 오답 해설 | 에러 발생 시 AI가 친절하게 번역 + RAG 기반 개인화 오답 해설 |
| 유사 문제 추천 | 임베딩(bge-m3) 기반 유사 문제 추천 |

### 사용자 모델

- 계정 없음. 브라우저 UUID로 식별, 닉네임 랜덤 생성.

### 성공 기준

- 사용자가 문제 리스트 → 상세 → 선택지 실행 → 제출 → AI 해설 → 유사문제까지 끊김 없이 사용 가능
- 에러 시 사용자가 무엇이 잘못됐는지 알 수 있음
- 데모 시연 중 크래시 0건

---

## 2. 아키텍처

### 2.1 시스템 구성

```
[React SPA (Vercel CDN)] ──HTTPS──> [Spring Boot 3 / JDK 21 (Synology NAS :8080)]
                                          │
                                          ├─ MariaDB sqld_app    (도메인/설정)
                                          ├─ MariaDB sqld_q###   (샌드박스 DB, 문제별)
                                          ├─ Qdrant              (bge-m3 1024-dim)
                                          ├─ Redis               (캐시/레이트리밋)
                                          └─ Ollama (ai.suhsaechan.kr, X-API-Key)
                                             ├─ qwen2.5:7b (chat)
                                             └─ bge-m3     (embed)
```

### 2.2 배포 토폴로지

| 컴포넌트 | 배포 위치 |
|---------|----------|
| Frontend (React) | Vercel (글로벌 CDN, Git push 자동 배포) |
| Backend (Spring Boot) | Synology NAS Docker (backend-api 컨테이너 1개) |
| Admin UI (Thymeleaf) | 백엔드와 동일 컨테이너 (/admin/**) |
| MariaDB / Qdrant / Redis / Ollama | Synology NAS (기존 인프라 재사용) |

### 2.3 기술 스택

#### Backend
| 영역 | 선택 | 이유 |
|------|------|------|
| Language/Runtime | Java 21 | 주력 언어 |
| Framework | Spring Boot 3 | 검증된 스택 |
| ORM/DB | HikariCP, Flyway | 마이그레이션 관리 |
| AI 통합 | RestClient (spring-ai 미사용) | X-API-Key 헤더 커스터마이징 비용 < 직접 구현 |
| 캐시 | Caffeine | AppSetting/Prompt 5초 TTL |
| 회복성 | Resilience4j (CB + TL) | AI 호출 폴백 |
| Vector DB | io.qdrant:client | 유사 문제 검색 |
| Admin 렌더링 | Thymeleaf | SSR, 코드 프리즈 후 콘텐츠 편집 |

#### Frontend
| 영역 | 선택 | 이유 |
|------|------|------|
| Build | Vite + TypeScript | 빠른 HMR, TS 기본 지원 |
| UI | React 18 | 생태계, 컴포넌트 재사용성 |
| 서버 상태 | TanStack Query v5 | staleTime 캐시 정책 제어 |
| 클라이언트 상태 | Zustand | 최소 보일러플레이트 |
| 라우팅 | React Router v7 | SPA 4탭 + 중첩 라우트 |
| SQL 하이라이팅 | CodeMirror 6 | readonly 모드, SQL dialect 지원 |
| 차트 | Recharts | 히트맵/바 차트 |
| 스타일링 | Tailwind CSS | 빠른 프로토타이핑 |
| 마크다운 | react-markdown | AI 응답 렌더링 |
| HTTP | fetch wrapper (커스텀) | 외부 의존성 최소화 |
| 배포 | Vercel | Git push 자동 배포 |

### 2.4 모노레포 구조

```
passQL/
├── docker-compose.yml          # backend-api 1개 서비스
├── server/                     # Spring Boot 3 백엔드
│   ├── Dockerfile
│   ├── build.gradle
│   └── src/main/
│       ├── java/com/passql/
│       │   ├── config/         # Security(permitAll), SandboxDataSourceConfig
│       │   ├── question/       # Question/Choice 도메인 + API
│       │   ├── sandbox/        # SandboxExecutor, SqlSafetyValidator
│       │   ├── submission/
│       │   ├── progress/
│       │   ├── ai/             # OllamaClient, QdrantSearcher, AiService
│       │   ├── prompt/         # PromptService (Caffeine)
│       │   ├── setting/        # AppSettingService (Caffeine)
│       │   ├── meta/           # topic / subtopic / tag
│       │   └── admin/          # Thymeleaf controllers
│       └── resources/
│           ├── application.yml / -dev.yml / -prod.yml
│           ├── templates/admin/
│           └── db/migration/   # V1__schema.sql, V2__bootstrap_meta.sql
├── client/                     # React (Vite + TypeScript) → Vercel 배포
│   ├── vercel.json             # SPA fallback + /api 리라이트
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                # fetch wrapper, API 함수
│       ├── hooks/              # TanStack Query 커스텀 훅
│       ├── stores/             # Zustand (uuid, ui 상태)
│       ├── pages/              # Home, Questions, QuestionDetail, Stats, Settings
│       ├── components/         # layout, question, result, stats
│       ├── types/              # TypeScript 인터페이스
│       └── utils/              # uuid.ts, nickname.ts
└── ai/                         # AI 서버 (필요 시)
```

### 2.5 docker-compose.yml

```yaml
services:
  backend-api:
    build: ./server
    image: passql/backend-api:latest
    ports: ["8080:8080"]
    environment:
      SPRING_PROFILES_ACTIVE: prod
    restart: unless-stopped
```

> 기존 MariaDB / Qdrant / Redis / Ollama는 Synology에서 IP:Port로 접근.  
> 프론트엔드는 Vercel에서 서빙 → Docker에 포함하지 않음.

### 2.6 vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<nas-domain>:8080/api/:path*" }
  ]
}
```

- `/api/*` 요청은 Vercel Edge에서 NAS 백엔드로 리라이트 → same-origin, CORS 불필요
- SPA fallback은 Vite 프레임워크 프리셋이 자동 처리
- **주의:** Vercel 리라이트 응답 제한 30초 → AI 호출(`/api/ai/*`)이 초과할 경우 백엔드에서 timeout을 25초로 설정하여 Vercel 제한 내 응답 보장

---

## 3. 데이터 모델

> "런타임 편집" 표시 항목은 관리자 UI(Thymeleaf)에서 전부 편집 가능. 이것이 코드 프리즈 원칙의 실제 구현.

### 3.1 문제 / 선택지

**question**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | |
| topic_code | VARCHAR FK → topic.code | |
| subtopic_code | VARCHAR FK → subtopic.code | nullable |
| difficulty | TINYINT | 1~5 |
| execution_mode | ENUM('executable','concept_only') | concept_only는 샌드박스 없음 |
| dialect | ENUM('mariadb') | Phase 2에서 oracle 추가 예정 |
| sandbox_db_name | VARCHAR | 예: sqld_q123 |
| stem | TEXT | 문제 지문 |
| schema_display | TEXT | 사용자에게 보여줄 스키마 텍스트 |
| schema_ddl | TEXT | 실제 샌드박스 생성용 DDL+INSERT |
| explanation_summary | TEXT | 전체 해설 |
| extra_meta_json | JSON | 확장용 |
| created_at / updated_at | DATETIME | |

**question_choice**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT PK | |
| question_id | FK | |
| choice_key | CHAR(1) | A~E |
| kind | ENUM('sql','text') | |
| body | TEXT | 선택지 본문 |
| is_correct | BOOLEAN | |
| rationale | TEXT | 왜 정답/오답인지 |
| sort_order | INT | |

**question_concept_tag** (M:N)

- `question_id` FK, `tag_key` FK

### 3.2 메타 (런타임 편집)

**topic**
- `code` PK, `display_name`, `sort_order`, `is_active`

**subtopic**
- `code` PK, `topic_code` FK, `display_name`, `sort_order`, `is_active`

**concept_tag**
- `tag_key` PK, `label_ko`, `category`, `description`, `is_active`, `sort_order`

**concept_doc** (런타임 편집, Qdrant 자동 동기화)
- `id`, `tag_key` FK, `title`, `body_md`, `embedding_version`, `is_active`, `updated_at`
- 저장 시 `body_md`를 bge-m3로 임베딩 → Qdrant upsert
- 실패 시 admin 화면에 에러 표시 + 재시도 버튼

### 3.3 AI / 설정 (런타임 편집)

**prompt_template**

| 컬럼 | 설명 |
|------|------|
| key_name | `explain_error`, `diff_explain`, `similar` |
| version | INT |
| is_active | BOOLEAN — key_name 당 1개만 활성 |
| model | 예: `qwen2.5:7b` |
| system_prompt | TEXT |
| user_template | TEXT (Mustache `{{var}}` 형식) |
| temperature | FLOAT |
| max_tokens | INT |
| note | 관리자 메모 |
| extra_params_json | JSON escape hatch |

> UNIQUE: `(key_name, version)`

**app_setting**

| 컬럼 | 설명 |
|------|------|
| setting_key | PK |
| value_type | `string\|int\|bool\|float` |
| value_text | 실제 값 |
| category | 그룹핑용 |
| description | 설명 |

캐시: Caffeine 5초 TTL + 저장 시 evict

#### app_setting 초기값 (V2__bootstrap_meta.sql)

| key | value |
|-----|-------|
| rag.concepts.top_k | 2 |
| rag.similar.top_k | 3 |
| sandbox.query_timeout_sec | 2 |
| sandbox.max_rows | 200 |
| sandbox.max_sql_length | 4000 |
| ratelimit.execute.per_minute | 60 |
| ratelimit.ai.per_minute | 20 |
| ollama.base_url | https://ai.suhsaechan.kr |
| ollama.embedding.model | bge-m3 |
| ollama.chat.model | qwen2.5:7b |
| ollama.timeout_sec | 60 |
| feature.ai_enabled | true |
| feature.execute_enabled | true |
| feature.similar_enabled | true |

### 3.4 사용자 활동

**submission**
- `id`, `user_uuid`, `question_id`, `selected_key`, `is_correct`, `submitted_at`

**execution_log**
- `id`, `user_uuid`, `question_id`, `choice_key`, `sql_text`, `status`, `error_code`, `error_message`, `row_count`, `elapsed_ms`, `executed_at`

### 3.5 샌드박스 DB 전략

- 문제 ID당 DB 1개: `sqld_q{id}`
- 관리자가 문제 등록 시 `SandboxProvisioner`가 DB 생성 → `schema_ddl` 실행
- 접근 계정: `sqld_runner` (GRANT SELECT ON `sqld_q%.*` TO sqld_runner)
- DDL은 별도 admin 계정으로만 실행
- HikariCP 풀은 최초 요청 시 lazy 생성

### 3.6 Flyway 범위 (코드 프리즈 원칙)

| 파일 | 내용 |
|------|------|
| V1__schema.sql | 전체 테이블/인덱스/FK |
| V2__bootstrap_meta.sql | app_setting 기본값, prompt_template 3종 v1, topic 10개, 샘플 concept_tag 20개 |

> `question` / `concept_doc` 본문은 Flyway에 없음 — 관리자 UI에서 등록

---

## 4. API 설계

### 4.1 Public API

| Method | Path | Body/Query | 응답 |
|--------|------|-----------|------|
| GET | `/api/meta/topics` | — | topic + subtopic 트리 |
| GET | `/api/meta/tags` | — | concept_tag 활성 목록 |
| GET | `/api/questions` | `topic, subtopic, difficulty, mode, page, size` | `Page<QuestionSummary>` |
| GET | `/api/questions/{id}` | — | Question 상세 + choices + schema_display |
| POST | `/api/questions/{id}/execute` | `{userUuid, choiceKey?, sql?}` | ExecuteResult |
| POST | `/api/questions/{id}/submit` | `{userUuid, selectedKey}` | `{isCorrect, rationale, correctKey}` |
| POST | `/api/ai/explain-error` | `{userUuid, questionId, sql, errorMessage}` | `{text, promptVersion}` |
| POST | `/api/ai/diff-explain` | `{userUuid, questionId, selectedKey}` | `{text, promptVersion, citedTags[]}` |
| GET | `/api/ai/similar/{questionId}?k=` | — | 유사 문제 목록 |
| GET | `/api/progress?userUuid=` | — | 진도 요약 |
| GET | `/api/progress/heatmap?userUuid=` | — | 토픽별 숙련도 |

### 4.2 응답 포맷 — 실행 결과

```json
{
  "status": "ok|error|blocked|timeout",
  "columns": ["id", "name"],
  "rows": [[1, "A"], [2, "B"]],
  "rowCount": 2,
  "elapsedMs": 34,
  "errorCode": "",
  "errorMessage": ""
}
```

#### 에러 코드 체계

| errorCode | 의미 |
|-----------|------|
| SQL_SYNTAX | 문법 오류 |
| SQL_SEMANTIC | 존재하지 않는 컬럼/테이블 등 |
| NOT_SELECT | SELECT/WITH 아님 (블록됨) |
| MULTIPLE_STATEMENTS | 세미콜론 여러 개 |
| TOO_LONG | max_sql_length 초과 |
| SANDBOX_TIMEOUT | max_statement_time 초과 |
| ROW_LIMIT_EXCEEDED | max_rows 초과 |
| RATE_LIMITED | 분당 호출 초과 |
| AI_UNAVAILABLE | Ollama 다운 (폴백) |
| AI_TIMEOUT | LLM 응답 지연 |
| INTERNAL | 기타 |

> 에러는 항상 `errorCode + errorMessage` 동반. 프론트엔드는 메시지 그대로 표시.

### 4.3 Admin API (Thymeleaf SSR, `/admin/**`)

| 경로 | 기능 |
|------|------|
| `/admin/questions` | CRUD + 선택지 편집 + 샌드박스 재프로비저닝 버튼 |
| `/admin/prompts` | 템플릿 CRUD, 버전 리스트, 활성 버전 전환, 테스트 실행 |
| `/admin/tags` | concept_tag CRUD |
| `/admin/topics` | topic/subtopic CRUD |
| `/admin/concepts` | concept_doc CRUD (저장 시 Qdrant 재임베딩) |
| `/admin/settings` | app_setting K-V 편집 |
| `/admin/monitor` | 최근 execution_log, AI 호출 로그, 에러율 |

> MVP: `permitAll` (데모 시연 용이성). Phase 2에서 Basic Auth 추가.

### 4.4 공통 규칙

- 모든 tunable은 `AppSettingService.get(key)` 경유. yml 하드코딩 금지.
- AI 호출은 `@CircuitBreaker(name="ai") + @TimeLimiter(name="ai")`
- 폴백 시 `errorCode=AI_UNAVAILABLE` + 서버 고정 메시지 반환
- 레이트리밋은 Redis 기반, 키: `rl:{user_uuid}:{bucket}`
- SQL 실행 전 `SqlSafetyValidator` 통과 필수 (SELECT/WITH만, 단일 문, 길이 제한)
- 샌드박스 실행은 MariaDB `max_statement_time` + HikariCP timeout 이중 방어

---

## 5. Frontend (React)

### 5.1 라우트 구조

```
BottomTabLayout
 ├─ /                    # 홈 (오늘의 문제, 연속일, 진도 요약)
 ├─ /questions           # 문제풀이 (토픽/난이도 필터 → 리스트)
 ├─ /questions/:id       # 문제 상세
 ├─ /stats               # 통계 (heatmap, 정답률, 최근 틀린 문제)
 └─ /settings            # 설정 (UUID, 닉네임 재생성)
```

### 5.2 문제 상세 화면 (/questions/:id)

```
Page
 ├─ Header (토픽/난이도 뱃지, 뒤로가기)
 ├─ Content (스크롤)
 │   ├─ StemCard               # 지문
 │   ├─ SchemaCard             # CodeMirror readonly SQL, 접기/펼치기
 │   ├─ ChoiceList (A~E)
 │   │   └─ ChoiceCard
 │   │       ├─ <input type="radio" />
 │   │       ├─ SqlCodeBlock ({ sql })       # CodeMirror readonly
 │   │       ├─ <button>실행</button>        # useMutation → executeChoice
 │   │       └─ ExecuteResultPanel ({ result })
 │   │           ├─ OK: <table> (동적 컬럼)
 │   │           ├─ Error: ErrorCard ({ errorCode, errorMessage })
 │   │           │         └─ <button>AI에게 물어보기</button>
 │   │           └─ Loading: <LoadingSpinner />
 │   └─ (제출 전) SubmitButton (sticky)
 └─ (제출 후) ResultSheet (dialog/bottom sheet)
     ├─ 정/오답 배지
     ├─ rationale 텍스트
     ├─ [왜 틀렸는지 AI에게] → AiExplainSheet (diff-explain)
     └─ [유사 문제 보기] → SimilarQuestionSheet

AiExplainSheet (dialog)
 ├─ <LoadingSpinner />
 ├─ <ReactMarkdown> (AI 응답)
 └─ <button>닫기</button>
```

### 5.3 상태 관리 / 네트워크

| 레이어 | 도구 | 역할 |
|--------|------|------|
| 서버 상태 | TanStack Query v5 | 캐시, 로딩/에러 자동 관리 |
| 클라이언트 상태 | Zustand | UUID, 닉네임, 현재 선택한 답, UI 토글 |
| HTTP | fetch wrapper | `/api/*` → Vercel 리라이트 → NAS 백엔드 |

#### 캐싱 전략

| 데이터 | staleTime | 무효화 |
|--------|-----------|--------|
| topics / tags | Infinity | 브라우저 새로고침 |
| 문제 목록 | 30_000ms | 필터 변경 시 자동 refetch |
| 문제 상세 | 0 | 탭 진입 시마다 재조회 (관리자 수정 즉시 반영) |
| 진도 | 0 | 탭 진입 시마다 재조회 |

### 5.4 API 클라이언트 (api/client.ts)

```typescript
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000); // Vercel 30초 제한 내

  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        body.errorCode ?? 'INTERNAL',
        body.errorMessage ?? `HTTP ${res.status}`,
        res.status,
      );
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 5.5 TypeScript 타입

```typescript
// types/question.ts
interface QuestionSummary {
  id: number;
  topicCode: string;
  difficulty: number;
  stemPreview: string;
  executionMode: 'executable' | 'concept_only';
}

interface Choice {
  key: string; // A~E
  kind: 'sql' | 'text';
  body: string;
  sortOrder: number;
}

// types/execute.ts
interface ExecuteResult {
  status: 'ok' | 'error' | 'blocked' | 'timeout';
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  elapsedMs: number;
  errorCode: string;
  errorMessage: string;
}

// types/submission.ts
interface SubmitResult {
  isCorrect: boolean;
  correctKey: string;
  rationale: string;
}

// types/ai.ts
interface AiResult {
  text: string;
  promptVersion: number;
}

interface SimilarQuestion {
  id: number;
  stem: string;
  topicCode: string;
  score: number;
}

// types/progress.ts
interface Progress {
  solved: number;
  correctRate: number;
  streakDays: number;
}

interface HeatmapEntry {
  topicCode: string;
  topicName: string;
  solved: number;
  correctRate: number;
}
```

### 5.6 에러/예외 UX

| 상황 | UI |
|------|----|
| 네트워크 실패 | 화면 중앙 ErrorScreen "연결 실패" + [재시도] |
| 서버 5xx | Toast "서버 오류 (errorCode)" |
| 샌드박스 실행 에러 | ChoiceCard 안의 ErrorCard (inline) |
| AI 실패 (AI_UNAVAILABLE) | AiExplainSheet에 "AI 기능이 일시 사용 불가" |
| RATE_LIMITED | Toast "잠시 후 다시 시도해 주세요" |
| Vercel 리라이트 timeout | Toast "응답 시간 초과 — 다시 시도해 주세요" |

### 5.7 E2E 학습자 시나리오

| # | 사용자 행동 | API |
|---|------------|-----|
| 1 | 첫 방문 | `crypto.randomUUID()` → localStorage |
| 2 | 앱 마운트 | GET /api/meta/topics, /api/meta/tags (staleTime: Infinity) |
| 3 | 토픽 JOIN 선택 | GET /api/questions?topic=join |
| 4 | 문제 진입 | GET /api/questions/123 |
| 5 | 선택지 B [실행] | POST /api/questions/123/execute {choiceKey:"B"} |
| 6 | 선택지 C [실행] → 에러 | 동일 (status:"error") |
| 7 | [AI에게 물어보기] | POST /api/ai/explain-error |
| 8 | C 선택 후 [제출] | POST /api/questions/123/submit |
| 9 | 오답 → [왜 틀렸는지] | POST /api/ai/diff-explain |
| 10 | [유사문제] | GET /api/ai/similar/123?k=3 |
| 11 | 통계 탭 | GET /api/progress, /api/progress/heatmap |

### 5.8 MVP 스코프

**포함:** 4탭, 문제 상세 풀 기능, AI 2종, 유사문제, 진도 요약, 반응형(모바일 우선)  
**제외 (Phase 2):** 온디바이스 LLM, 오프라인(Service Worker), 다크모드, 애니메이션, 소셜, 푸시, PWA 설치

---

## 6. Backend (Spring Boot)

### 6.1 핵심 서비스 상세

#### OllamaClient

```java
@Component
public class OllamaClient {
    private final RestClient client;

    public OllamaClient(
        @Value("${ollama.api-key}") String apiKey,
        AppSettingService settings
    ) {
        String baseUrl = settings.getString("ollama.base_url");
        this.client = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("X-API-Key", apiKey)
            .build();
    }

    public String chat(String model, List<Message> messages, float temp, int maxTokens) { ... }
    public float[] embed(String text) { ... }
}
```

> API Key는 환경변수(`OLLAMA_API_KEY`)로 주입, 그 외 모든 파라미터는 `app_setting` 경유.

#### AppSettingService (Caffeine)

- key: `setting_key` → 타입별 파싱된 값
- TTL 5초 + 저장 시 `evict`
- 타입 안전 메서드: `getInt`, `getBool`, `getFloat`, `getString`

#### SqlSafetyValidator (검증 순서)

1. 길이 ≤ `sandbox.max_sql_length`
2. 세미콜론으로 split → 1개여야 함 (끝 세미콜론은 허용)
3. 첫 토큰이 `SELECT` 또는 `WITH`여야 함
4. 블랙리스트 키워드 탐지 (대소문자 무시): `INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|CALL|LOAD|HANDLER|LOCK|UNLOCK|SET|RENAME|REPLACE|USE`
5. 주석을 이용한 우회 차단: `/* */`, `--`, `#` 주석 제거 후 재검사

#### SandboxExecutor

1. `sandbox_db_name`으로 HikariCP 풀 조회 (lazy 생성)
2. `SET SESSION max_statement_time = {app_setting}` 먼저 실행
3. SELECT 실행 → ResultSet → columns, rows, rowCount
4. `rowCount > max_rows` 초과 시 잘라냄
5. 레이트리밋: `ratelimit.execute.per_minute` (Redis)

#### AiService (Resilience4j)

```java
@Service
public class AiService {
    @CircuitBreaker(name = "ai", fallbackMethod = "explainErrorFallback")
    @TimeLimiter(name = "ai")
    public CompletableFuture<AiResult> explainError(ExplainErrorReq req) {
        // 1. PromptService.get("explain_error") → active template
        // 2. variables 주입 (stem, 선택지, 사용자 SQL, errorMessage)
        // 3. OllamaClient.chat(...)
    }

    private CompletableFuture<AiResult> explainErrorFallback(ExplainErrorReq req, Throwable t) {
        return CompletableFuture.completedFuture(
            AiResult.fallback("AI_UNAVAILABLE", "AI 기능이 일시적으로 사용 불가합니다.")
        );
    }
}
```

#### RAG 흐름 (diff-explain)

1. 선택한 오답 선택지와 정답 선택지의 `concept_tag` 차집합 구함
2. 해당 tag로 Qdrant 필터 검색 (`concept_doc` 컬렉션)
3. `rag.concepts.top_k`개 문서 선택
4. `PromptTemplate diff_explain`에 `{stem, correctChoice, wrongChoice, concepts[]}` 주입
5. Ollama chat → 응답

#### Similar Question

- 문제 등록/수정 시 `stem + schema_display` 임베딩 사전 계산 → Qdrant `question` 컬렉션에 upsert
- 요청 시: 해당 문제 벡터로 Qdrant 유사도 검색 → top-k 반환

---

## 7. AI 서버

현재 MVP에서는 별도 AI 서버 없이 Spring Boot 백엔드에서 Ollama 게이트웨이를 직접 호출.

| 항목 | 값 |
|------|-----|
| 게이트웨이 URL | `https://ai.suhsaechan.kr` |
| 인증 | `X-API-Key` 헤더 |
| Chat 모델 | `qwen2.5:7b` |
| Embedding 모델 | `bge-m3` (1024-dim) |

> `spring-ai` 미채택 사유: X-API-Key 헤더 커스터마이징 비용이 직접 RestClient 쓰는 것보다 크다.

---

## 8. 일정 / 리스크 / 운영

### 8.1 6일 개발 일정

| Day | 작업 | 완료 기준 |
|-----|------|----------|
| D1 | 모노레포, Dockerfile(backend), Flyway V1/V2, Spring 부팅, MariaDB/Qdrant/Ollama 연결 테스트, Vercel 프로젝트 연결 | 각 연결 ping 성공 |
| D2 | question/choice CRUD, SandboxProvisioner, SqlSafetyValidator, SandboxExecutor, `/questions/*`, `/execute` | execute 1회 성공 (ok + error 각 1건) |
| D3 | OllamaClient, PromptService(Caffeine), QdrantSearcher, AiService(CB/TL), concept_doc 자동 임베딩, `/ai/*` | `/api/ai/*` explain-error, diff-explain, similar 각 1회 성공 |
| D4 | Thymeleaf 7화면 + AppSettingService (React D1~D2 병행) | 각 화면 CRUD 1회씩 성공, 설정 변경 즉시 반영 확인 |
| D5 | React 4탭 + 문제상세 + AI 시트 + API 클라이언트 + UUID + Vercel 배포 확인 | React에서 문제 1개 끝까지 풀이 가능 |
| D6 | 문제 30~40개 입력, concept_doc 20개 작성, E2E 리허설, 버그픽스, 데모 배포 | 데모 시나리오 3회 무결점 실행 |

### 8.2 리스크

| 리스크 | 완화 |
|--------|------|
| Ollama 다운 | CircuitBreaker 폴백, errorCode 반환 |
| 샌드박스 오염 | sqld_runner SELECT-only, DDL 전용 계정 분리, DB명 prefix 검증 |
| D4 관리자 과부하 | monitor를 D6로 미룸, 공통 CRUD 템플릿 재사용 |
| 문제 수집 부족 | 자투리 시간 병행 입력, 최소 15문제로도 데모 성립 |
| Qdrant 재임베딩 실패 | 동기 호출 + admin 재시도 버튼 |
| 프리즈 후 튜닝 불가 지점 발견 | 코드 리뷰 체크리스트: 모든 숫자/문자열 → app_setting 이동 |
| Vercel 리라이트 30초 제한 | 백엔드에서 timeout 25초로 설정 |
| NAS HTTPS 미설정 | Vercel 리라이트 대상은 HTTPS 필수 → Let's Encrypt 인증서 필요 |

### 8.3 코드 프리즈 이후 가능한 운영

- 문제 추가/수정/삭제
- 프롬프트 수정 및 버전 전환
- concept_doc 추가 → Qdrant 자동 반영
- topic/subtopic/tag 재편성
- LLM 파라미터 조정 (top_k, temperature, timeout, rate limit)
- 기능 플래그 on/off (app_setting: feature.*)

### 8.4 Phase 2 (코드 프리즈 이후 차기 버전)

- PWA (Service Worker, 오프라인)
- 인증/계정 시스템
- Oracle dialect (PIVOT, CONNECT BY, REGEXP_LIKE)
- 다크모드
- 소셜/리더보드
- 푸시 알림 (학습 리마인더)
- 온디바이스 LLM (Gemma 3n 4B)
- ai_call_log 대시보드 고도화

---

## Open Questions (합의 필요)

| 항목 | 상태 |
|------|------|
| ai_call_log 테이블 추가 여부 | 모니터링 필요하나 D3~D4 부담 |
| Qdrant 스냅샷 관리자 트리거 | 운영 편의 vs 6일 구현 가능? |
| 관리자 인증 (MVP) | permitAll 확정이나 데모 환경 노출 우려 |
| 문제 import/export (JSON) | 대량 초기 입력 시 필요 여부 |
| 프롬프트 변수 렌더링 엔진 | Mustache 라이브러리 vs 단순 String.replace |
| execution_log 보존 기간 | — |
| 문제 리스트 페이지네이션 | 무한 스크롤 vs 페이지 버튼 |
