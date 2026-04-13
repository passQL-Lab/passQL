"""src.core.config
ENVIRONMENT 환경변수에 따라 .env.dev 또는 .env.prod를 로드합니다.
우선순위: 시스템 환경변수 > .env.{env} 파일
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_env = os.getenv("ENVIRONMENT", "dev")
_env_file_primary = f".env.{_env}"
# .env.{env} 파일이 없으면 .env로 fallback
# prod: Dockerfile이 .env를 복사, dev: 로컬에서 .env.dev 사용
_env_file = _env_file_primary if os.path.exists(_env_file_primary) else ".env"


def _read_raw(key: str) -> str:
    """
    pydantic 이스케이프 없이 raw 값을 읽는다.
    우선순위: 시스템 환경변수 > .env 파일 직접 파싱
    백슬래시 등 특수문자가 포함된 값(Qdrant API 키 등)에 사용한다.
    """
    val = os.environ.get(key)
    if val is not None:
        return val
    try:
        with open(_env_file, "rb") as f:
            for line in f:
                line = line.rstrip(b"\n").rstrip(b"\r")
                prefix = f"{key}=".encode()
                if line.startswith(prefix):
                    return line[len(prefix):].decode()
    except FileNotFoundError:
        pass
    return ""


class Settings(BaseSettings):
    # Ollama 설정
    OLLAMA_API_URL: str = "https://ai.suhsaechan.kr"
    OLLAMA_API_KEY: str = ""
    OLLAMA_CHAT_MODEL: str = "qwen2.5:7b"
    OLLAMA_EMBED_MODEL: str = "qwen3-embedding:4b"
    OLLAMA_TIMEOUT_SEC: int = 60

    # Qdrant 설정 (API 키는 pydantic 우회 — _read_raw로 직접 읽음)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "passql_questions"

    # AI 서버 인증
    AI_SERVER_API_KEY: str = ""

    # Google Gemini 설정 (API Key는 환경변수 전용)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"

    # Redis 설정 (Spring과 공유 - 모델명 등 수정 가능한 설정값)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # 환경 설정
    ENVIRONMENT: str = "dev"

    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")


settings = Settings()

# 백슬래시 등 특수문자가 포함되어 pydantic이 이스케이프 처리하는 키는 직접 노출
# qdrant_client.py 등에서 settings.QDRANT_API_KEY 대신 이 값을 사용한다
QDRANT_API_KEY: str = _read_raw("QDRANT_API_KEY")
