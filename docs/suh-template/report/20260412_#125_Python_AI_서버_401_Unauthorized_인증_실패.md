# ❗[버그][AI] Python AI 서버 401 Unauthorized 인증 실패 #125

## 개요

Python AI 서버(`config.py`)가 `ENVIRONMENT` 환경변수 기반으로 `.env.{env}` 파일을 로드하는데, 해당 파일이 존재하지 않을 경우 `AI_SERVER_API_KEY`가 빈 문자열로 로드되어 Spring이 전송한 `X-API-Key` 헤더와 불일치, 매 요청마다 401 Unauthorized가 발생하던 문제를 수정했다.

## 변경 사항

### Python AI 서버

- `ai/src/core/config.py`: `.env.{env}` 파일이 존재하지 않을 때 `.env`로 fallback하는 로직 추가

## 주요 구현 내용

**근본 원인:**

`config.py`는 `ENVIRONMENT` 환경변수(기본값: `dev`)를 읽어 `.env.dev` 또는 `.env.prod`를 로드한다.
- `prod` 환경: Dockerfile이 `COPY .env ./`로 `.env`만 복사하므로 `.env.prod`가 존재하지 않음
- `dev` 환경: 로컬에 `.env.dev`가 없으면 동일 문제 발생

결과적으로 `AI_SERVER_API_KEY`가 기본값인 빈 문자열(`""`)로 로드되어, Spring이 전송하는 `X-API-Key: {실제키}` 헤더와 불일치 → Python 서버에서 401 반환.

**수정 방식:**

```python
_env_file_primary = f".env.{_env}"
# .env.{env} 파일이 없으면 .env로 fallback
# prod: Dockerfile이 .env를 복사, dev: 로컬에서 .env.dev 사용
_env_file = _env_file_primary if os.path.exists(_env_file_primary) else ".env"
```

환경별 동작:
- `prod`: `ENVIRONMENT=prod` → `.env.prod` 없음 → `.env` fallback → 정상 로드
- `dev`: `ENVIRONMENT=dev` → `.env.dev` 있음 → `.env.dev` 로드 → 정상 로드

## 주의사항

- `.env`, `.env.dev`, `.env.prod` 모두 `.gitignore` 대상 — GitHub에 업로드되지 않으며 별도로 관리한다
- `AI_SERVER_API_KEY` 변경 시 Python 서버 재배포 필요 (현재 Redis/DB 기반 동적 관리 미적용)
