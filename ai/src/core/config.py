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


class Settings(BaseSettings):
    # Ollama 설정
    OLLAMA_API_URL: str = "https://ai.suhsaechan.kr"
    OLLAMA_API_KEY: str = ""
    OLLAMA_CHAT_MODEL: str = "qwen2.5:7b"
    OLLAMA_EMBED_MODEL: str = "bge-m3"
    OLLAMA_TIMEOUT_SEC: int = 60

    # Qdrant 설정
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "passql_concepts"

    # AI 서버 인증
    AI_SERVER_API_KEY: str = ""

    # Google Gemini 설정 (API Key는 환경변수 전용)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"  # fallback 기본값

    # Redis 설정 (Spring과 공유 - 모델명 등 수정 가능한 설정값)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # 환경 설정
    ENVIRONMENT: str = "dev"  # dev: 로컬, prod: 서버환경

    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")


settings = Settings()
