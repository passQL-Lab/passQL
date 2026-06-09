# passQL AI Server (Python / FastAPI)

passQL의 AI 기능 전담 서버. SQL 오류 설명, 오답 diff 해설, 유사 문제 검색을 담당한다.
**프론트(client/app)는 이 서버를 직접 호출하지 않는다** — 반드시 Spring 서버(`server/`)가
`x-api-key`로 프록시한다.

## Tech Stack

- **Python** >= 3.13
- **FastAPI** + **Uvicorn** (ASGI)
- **LLM**: Gemini (`gemini_client`) + Ollama fallback (`ollama_client`)
- **벡터 검색**: Qdrant (`qdrant_client`) — 유사 문제 검색
- **캐시/설정**: Redis (`redis_settings`)
- **패키지 관리**: `pyproject.toml` (uv/pip)

## Project Structure

```
src/
├── main.py                # FastAPI 앱 진입점
├── apis/                  # 라우터 (엔드포인트 정의)
│   ├── ai_router.py       # AI 기능 엔드포인트
│   └── health_router.py   # 헬스체크
├── core/                  # 설정·로깅·예외
│   ├── config.py          # 환경변수 기반 설정
│   ├── logging.py
│   └── exceptions.py
├── models/                # 요청/응답 스키마 (Pydantic)
│   ├── ai_request.py
│   └── ai_response.py
├── services/              # 비즈니스 로직 + 외부 클라이언트
│   ├── ai_service.py      # AI 오케스트레이션
│   ├── gemini_client.py   # Gemini 호출
│   ├── ollama_client.py   # Ollama fallback
│   ├── qdrant_client.py   # 벡터 검색
│   └── redis_settings.py  # Redis 설정/캐시
└── utils/
    └── auth.py            # x-api-key 인증
```

## 환경 변수

- `.env.dev`, `.env.prod` — **gitignore 처리됨. 절대 커밋 금지.**
- API 키(Gemini), Redis/Qdrant 접속 정보, `x-api-key` 등 민감 정보 포함.
- 설정 로딩은 `src/core/config.py` 경유.

## 인증

- 모든 AI 엔드포인트는 `x-api-key` 헤더 필수 (`src/utils/auth.py`).
- 이 키는 Spring 서버만 알고 있다. 외부 직접 호출 차단.

## Commands

```bash
# 로컬 실행 (dev)
uvicorn src.main:app --reload

# Docker 빌드/실행
docker build -t passql-ai .
docker run --env-file .env.dev -p 8000:8000 passql-ai
```

## 금지 규칙

- **민감 정보 커밋 금지** — `.env*`, API 키, 토큰을 git에 올리지 않는다.
- **답변은 항상 한국어로** — 코드/커맨드 제외.
- **모르면 모른다고 말하기** — 확실하지 않은 내용 추측 금지.
