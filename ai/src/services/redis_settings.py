"""src.services.redis_settings
Spring과 공유하는 Redis에서 app_setting 값을 읽어오는 클라이언트.

Redis 키 형식: passql:settings:{setting_key}
값이 없으면 .env 기본값(fallback)을 사용한다.
"""
import logging
import redis
from src.core.config import settings

logger = logging.getLogger(__name__)

REDIS_PREFIX = "passql:settings:"

_redis_client: redis.Redis | None = None


def _get_redis() -> redis.Redis | None:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD or None,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            _redis_client.ping()
            logger.info(f"Redis 연결 성공: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception as e:
            logger.warning(f"Redis 연결 실패 — 기본값(fallback) 사용: {e}")
            _redis_client = None
    return _redis_client


def get_setting(key: str, fallback: str) -> str:
    """
    Redis에서 설정값을 읽어온다. 없거나 연결 실패 시 fallback 반환.

    Args:
        key: app_setting의 setting_key (예: 'ai.gemini_model')
        fallback: Redis 미연결 또는 키 없을 때 사용할 기본값

    Returns:
        str: 설정값
    """
    try:
        client = _get_redis()
        if client is None:
            return fallback
        value = client.get(REDIS_PREFIX + key)
        if value:
            logger.debug(f"Redis 설정 로드: {key}={value}")
            return value
    except Exception as e:
        logger.warning(f"Redis 설정 읽기 실패 ({key}) — fallback 사용: {e}")
    return fallback


def get_gemini_model() -> str:
    return get_setting("ai.gemini_model", settings.GEMINI_MODEL)


def get_ollama_chat_model() -> str:
    return get_setting("ai.ollama_chat_model", settings.OLLAMA_CHAT_MODEL)


def get_ollama_embed_model() -> str:
    return get_setting("ai.ollama_embed_model", settings.OLLAMA_EMBED_MODEL)
