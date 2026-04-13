# ⚙️[기능개선][AI] AI 클라이언트를 Gemini 2.0 Flash-Lite 기반으로 전환 및 Ollama Fallback 구조 구현

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- 현재 AI 기능 전체가 `OllamaClient`만을 사용하도록 설계되어 있으나, 문제 생성(Question Generation) 등 고난도 추론이 필요한 기능에서 로컬 LLM(Ollama)의 성능이 부족함
- `AiService`의 `explainError`, `diffExplain` 등 핵심 메서드가 `UnsupportedOperationException("TODO")` 상태로 미구현
- 상용 API 없이는 문제 생성 품질을 보장할 수 없음

🛠️해결 방안 / 제안 기능
---

- **기본 LLM 클라이언트를 Gemini 2.0 Flash-Lite (`gemini-2.0-flash-lite`)로 교체**
  - 입력 $0.075/1M tokens, 출력 $0.30/1M tokens로 최저가 상용 모델
  - Google AI Studio에서 API Key 발급 완료 (`gen-lang-client-0346934729` 프로젝트)
- **Fallback 구조 유지**: 기존 `OllamaClient`는 Fallback 용도로 활용 (ResilienceJ4 CircuitBreaker 연계)
- **역할 분리**:
  - Gemini 2.0 Flash-Lite: 문제 생성, 오류 설명(`explainError`), diff 설명(`diffExplain`) 등 고품질 응답이 필요한 기능
  - Ollama (로컬 LLM): 간단한 개념 질의 (개념 태그 유사도, 힌트 요청 등 경량 작업)
- **환경변수 추가** (`application-dev.yml`, `application-prod.yml`):
  - `gemini.api-key`
  - `gemini.base-url` (Google Generative AI REST endpoint)
  - `gemini.model` (기본값: `gemini-2.0-flash-lite`)
- **`GeminiClient` 신규 생성** (`PQL-Domain-AI/client/GeminiClient.java`)
  - `chat(model, systemPrompt, userPrompt, temperature, maxTokens)` 메서드 구현

⚙️작업 내용
---

- `GeminiClient` 클래스 신규 생성 (`PQL-Domain-AI/src/main/java/com/passql/ai/client/GeminiClient.java`)
- `OllamaClient` — Fallback 전용으로 역할 재정의
- `AiService` — Gemini 기본, Ollama fallback 구조로 실제 로직 구현
- `application-dev.yml`, `application-prod.yml` — `gemini.*` 환경변수 추가
- CircuitBreaker fallback 흐름: Gemini 실패 → Ollama → 최종 실패 메시지

🙋‍♂️담당자
---

- 백엔드: 
- 프론트엔드: 
- 디자인: 
