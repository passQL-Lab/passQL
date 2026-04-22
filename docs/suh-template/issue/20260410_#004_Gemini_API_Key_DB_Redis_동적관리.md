# ⚙️[기능개선][AI/Settings] Gemini API Key를 DB/Redis에서 동적 관리

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- Gemini API Key가 환경변수(`application.yml`)에만 고정되어 있어, 키 변경 시 서버 재시작이 필요하다.
- AI 서버(`gemini_client.py`)가 시작 시점에 API Key를 고정 주입받아, 런타임에 키 교체가 불가능하다.
- 민감 정보(API Key)가 로그에 평문으로 노출될 위험이 있었다.

🛠️해결 방안 / 제안 기능
---

- `app_setting` DB 테이블에 `ai.gemini_api_key` 항목을 추가(`V0_0_29` 마이그레이션)하여 관리자 페이지에서 키를 관리할 수 있도록 한다.
- `AppInitializer`를 추가해 서버 시작 시 `application.yml`의 키를 DB/Redis로 초기 적재한다(값이 이미 있으면 스킵).
- AI 서버의 `GeminiClient`가 호출 시점마다 `redis_settings.get_gemini_api_key()`로 키를 동적 조회하도록 변경한다.
- Redis 설정 로그에서 `key`, `secret`, `password`, `token` 포함 키는 `***`로 마스킹한다.

⚙️작업 내용
---

- `V0_0_29__add_gemini_api_key_setting.sql` 마이그레이션 추가
- `AppInitializer.java` 신규 구현 (yml → DB/Redis 초기 적재)
- `redis_settings.py` — `get_gemini_api_key()` 추가, 민감 키 로그 마스킹
- `gemini_client.py` — `__init__` 고정 주입 → `_get_client()` 동적 조회 방식으로 변경

🙋‍♂️담당자
---

- 백엔드: 
- AI: 
