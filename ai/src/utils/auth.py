"""src.utils.auth
X-API-Key 헤더 인증 dependency
"""
import logging
from fastapi import Header, HTTPException
from src.core.config import settings

logger = logging.getLogger(__name__)


async def verify_api_key(x_api_key: str = Header(None)):
    """
    X-API-Key 헤더 검증 dependency

    Spring 서버가 AI 서버를 호출할 때 사용하는 API Key를 검증합니다.

    Args:
        x_api_key: 요청 헤더의 X-API-Key 값

    Raises:
        HTTPException: API Key가 없거나 일치하지 않을 때 401 반환
    """
    if not x_api_key or x_api_key != settings.AI_SERVER_API_KEY:
        logger.warning(f"인증 실패: 유효하지 않은 X-API-Key")
        raise HTTPException(status_code=401, detail="Unauthorized")
