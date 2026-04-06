"""src.apis.health_router
헬스체크 엔드포인트
"""
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/health", status_code=200)
async def health_check():
    """
    서버 상태 확인

    - GET /health
    - 성공: 200 + {"status": "ok"}
    """
    return {"status": "ok"}
