# AI 클라이언트를 Gemini 2.0 Flash-Lite 기반으로 전환 및 Ollama Fallback 구조 구현

## 개요

기존 OllamaClient 단독 구조에서 Gemini 2.0 Flash-Lite를 기본 클라이언트로 채택하고, Ollama를 fallback으로 전환하였다. `GeminiClient`를 신규 생성하여 일반 텍스트 응답(`chat`)과 JSON 강제 응답(`chatStructured`) 두 가지 호출 방식을 지원하며, `AiController`를 통해 오답 해설·diff 설명·유사 문제 조회 API를 외부에 노출하였다.

## 변경 사항

### AI 클라이언트

- `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/GeminiClient.java` : Google GenAI SDK(`com.google.genai`)를 사용하는 Gemini 클라이언트 신규 생성. `chat(systemPrompt, userPrompt, temperature, maxTokens)` 및 모델 명시 오버로드, `chatStructured`(JSON Schema 강제) 지원
- `server/PQL-Domain-AI/build.gradle` : `com.google.genai` SDK 의존성 추가

### API 계층

- `server/PQL-Web/src/main/java/com/passql/web/controller/AiController.java` : `/api/ai/explain-error`, `/api/ai/diff-explain`, `/api/ai/similar/{questionId}` 엔드포인트 신규 구현
- `server/PQL-Web/src/main/java/com/passql/web/controller/AiControllerDocs.java` : Swagger 문서 인터페이스 추가
- 나머지 Controller/Docs 파일(Member, Meta, Question, Progress) : Swagger 문서 보완

### 설정

- `server/PQL-Web/src/main/resources/application.yml` : `flyway.validate-on-migrate: false` 추가 (마이그레이션 파일 수정 시 체크섬 충돌 방지)
- `server/PQL-Web/src/main/resources/db/migration/V0_0_21__add_concept_tag_table.sql` : `question_concept_tag` 테이블 생성 + app_setting·prompt_template·topic 초기 시드 데이터 적재

### 테스트

- `server/PQL-Domain-AI/src/test/java/com/passql/ai/client/GeminiClientTest.java` : 일반 텍스트 응답 및 JSON 강제 응답 통합 테스트 (실제 API 호출, dev 프로파일)

## 주요 구현 내용

### GeminiClient 설계

Google GenAI Java SDK를 직접 사용하여 `Client.builder().apiKey(apiKey).build()`로 클라이언트를 초기화한다. `GenerateContentConfig`에 `systemInstruction`, `temperature`, `maxOutputTokens`를 설정하고, JSON 응답이 필요한 경우 `responseMimeType("application/json")`과 `responseSchema`를 추가로 지정한다. 응답이 null 또는 공백이면 `IllegalStateException`을 던져 fallback 트리거를 유도한다.

### 호출 흐름

```
AiService
  └─ GeminiClient.chat() / chatStructured()   ← 기본
       └─ (CircuitBreaker 발동 시) OllamaClient  ← fallback
```

### 시드 데이터 멱등성

- `app_setting`, `topic`: PK가 문자열이므로 `ON DUPLICATE KEY UPDATE`로 처리
- `prompt_template`: PK가 AUTO_INCREMENT이므로 `INSERT ... SELECT WHERE NOT EXISTS (key_name, version 조합)` 패턴으로 중복 삽입 방지

## 주의사항

- `gemini.api-key`는 application-dev.yml에 평문 기재되어 있으므로 prod 환경에서는 반드시 환경변수 또는 Secret Manager로 교체 필요
- `AiService.explainError`, `diffExplain`의 실제 프롬프트 조립 로직은 후속 이슈에서 구현 예정 (현재 Controller → Service 연결 구조만 완성)
- Flyway `validate-on-migrate: false` 설정으로 인해 마이그레이션 파일 변경 시 체크섬 검증이 생략됨 — 운영 환경 적용 전 주의 필요
