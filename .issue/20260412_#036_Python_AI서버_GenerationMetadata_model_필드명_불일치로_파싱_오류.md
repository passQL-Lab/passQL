# ❗[버그][AI] Python AI서버 GenerationMetadata model 필드명 불일치로 파싱 오류

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- Python AI 서버가 `GenerationMetadata`를 응답할 때 `"model"` 키를 사용하지만, Java `GenerationMetadataDto`는 `snakeCaseMapper`(SNAKE_CASE 전략)를 통해 `"model_name"` 키를 기대한다.
- 매핑 실패로 `UnrecognizedPropertyException`이 발생하고, Resilience4j CircuitBreaker가 Python AI 서버 호출을 실패로 처리해 Gemini fallback으로 우회된다.
- 결과적으로 Python AI 서버가 정상 응답을 보내도 파싱 단계에서 에러가 나며, fallback 결과에 의존하게 된다.

🔄재현 방법
---

1. `choiceSetPolicy=AI_ONLY`인 EXECUTABLE 문제 상세 페이지 진입
2. 선택지 생성 SSE 요청 발생
3. Python AI 서버가 응답한 JSON에서 `metadata.model` 필드 파싱 시 오류 발생
4. 백엔드 로그에서 아래 에러 확인:
   ```
   [AiGateway] Python AI 서버 호출 실패: Unrecognized field "model" (class GenerationMetadataDto),
   not marked as ignorable (7 known properties: "model_name", ...)
   ```
5. Gemini fallback으로 전환되어 처리됨

📸참고 자료
---

**에러 로그:**
```
ERROR [AiGateway] Python AI 서버 호출 실패: url=.../generate-choice-set,
error=Unrecognized field "model" (class com.passql.ai.dto.GenerationMetadataDto),
not marked as ignorable (7 known properties: "model_name", "prompt_template_uuid",
"attempts", "elapsed_ms", "completion_tokens", "raw_response_json", "prompt_tokens"])
```

**관련 파일:**
- `ai/src/models/ai_response.py` — `GenerationMetadata.model` 필드 정의
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/dto/GenerationMetadataDto.java` — `modelName` 필드 (snake_case 변환: `model_name`)
- `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java` — `snakeCaseMapper` 사용

✅예상 동작
---

- Python AI 서버 응답의 `metadata` 필드가 Java DTO로 파싱 오류 없이 정상 역직렬화되어야 한다.
- Gemini fallback에 의존하지 않고 Python AI 서버 응답을 직접 처리해야 한다.

⚙️환경 정보
---

- **OS**: 서버 환경 (Linux)
- **브라우저**: -
- **기기**: 서버

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
