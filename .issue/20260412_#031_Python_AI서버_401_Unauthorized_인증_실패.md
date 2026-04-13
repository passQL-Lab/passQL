# ❗[버그][AI] Python AI 서버 401 Unauthorized 인증 실패

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- Python AI 서버(`https://ai.passql.suhsaechan.kr`) 호출 시 매 요청마다 `401 Unauthorized` 에러가 발생한다.
- `AiGatewayClient`는 `X-API-Key` 헤더에 `passql.ai-server.api-key` 설정값을 담아 전송하나, Python 서버에서 인증 실패로 응답한다.
- 현재는 `GeminiFallbackClient`로 자동 우회되어 서비스는 유지되지만, 주 AI 서버가 동작하지 않는 비정상 상태다.

🔄재현 방법
---

1. `http://localhost:8080/api/questions/{questionUuid}/generate-choices` POST 요청
2. 서버 로그에서 아래 에러 확인:
   ```
   ERROR [AiGateway] Python AI 서버 호출 실패: url=https://ai.passql.suhsaechan.kr/api/ai/generate-choice-set, error=401 Unauthorized on POST request
   WARN  [AiGateway] generateChoiceSet fallback 진입: AI 서버에 연결할 수 없습니다.
   ```

📸참고 자료
---

- 관련 파일: `server/PQL-Domain-AI/src/main/java/com/passql/ai/client/AiGatewayClient.java`
- API 키 설정 위치: `server/PQL-Web/src/main/resources/application-dev.yml` → `passql.ai-server.api-key`

✅예상 동작
---

- Python AI 서버로 요청 시 `200 OK` 응답을 받아야 한다.
- fallback 없이 주 AI 서버가 정상적으로 선택지를 생성해야 한다.

⚙️환경 정보
---

- **서버**: Spring Boot (PQL-Domain-AI)
- **외부 서버**: `https://ai.passql.suhsaechan.kr`
- **인증 방식**: `X-API-Key` 헤더

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
