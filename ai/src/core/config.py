"""src.core.config
.env 파일에서 설정값을 로드합니다.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # 환경 설정
    ENVIRONMENT: str = "dev"  # dev: 로컬, prod: 서버환경

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
