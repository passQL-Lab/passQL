"""src.apis.ai_router
passQL AI 기능 엔드포인트
- POST /api/ai/explain-error  : SQL 오류 설명
- POST /api/ai/diff-explain   : 선택지 diff 해설
- GET  /api/ai/similar/{question_id} : 유사 문제 검색
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from src.models.ai_request import ExplainErrorRequest, DiffExplainRequest
from src.models.ai_response import AiResponse, SimilarResponse
from src.services.ai_service import ai_service
from src.utils.auth import verify_api_key
from src.core.exceptions import CustomError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/explain-error", response_model=AiResponse, status_code=200)
async def explain_error(
    request: ExplainErrorRequest,
    _: None = Depends(verify_api_key),
):
    """
    SQL 오류 설명

    사용자가 작성한 SQL과 발생한 오류 메시지를 기반으로
    오류 원인과 수정 방법을 AI가 한국어로 설명합니다.

    - POST /api/ai/explain-error
    - Header: X-API-Key: {AI_SERVER_API_KEY}
    - Body: ExplainErrorRequest
    - 성공: 200 + AiResponse
    - 인증 실패: 401
    - 서버 오류: 500
    """
    logger.info(
        f"[explain-error] question_id={request.question_id}, user_uuid={request.user_uuid}"
    )
    try:
        result = await ai_service.explain_error(request)
        return result
    except CustomError as e:
        logger.error(f"[explain-error] 처리 실패: {e.message}")
        raise HTTPException(status_code=500, detail=e.message)
    except Exception as e:
        logger.error(f"[explain-error] 예기치 않은 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다")


@router.post("/diff-explain", response_model=AiResponse, status_code=200)
async def diff_explain(
    request: DiffExplainRequest,
    _: None = Depends(verify_api_key),
):
    """
    선택지 diff 해설

    사용자가 선택한 오답과 정답을 비교하여
    왜 틀렸는지, 정답이 왜 맞는지를 AI가 한국어로 설명합니다.

    - POST /api/ai/diff-explain
    - Header: X-API-Key: {AI_SERVER_API_KEY}
    - Body: DiffExplainRequest
    - 성공: 200 + AiResponse
    - 인증 실패: 401
    - 서버 오류: 500
    """
    logger.info(
        f"[diff-explain] question_id={request.question_id}, "
        f"selected={request.selected_key}, correct={request.correct_key}"
    )
    try:
        result = await ai_service.diff_explain(request)
        return result
    except CustomError as e:
        logger.error(f"[diff-explain] 처리 실패: {e.message}")
        raise HTTPException(status_code=500, detail=e.message)
    except Exception as e:
        logger.error(f"[diff-explain] 예기치 않은 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다")


@router.get("/similar/{question_id}", response_model=SimilarResponse, status_code=200)
async def similar(
    question_id: int,
    k: int = 3,
    _: None = Depends(verify_api_key),
):
    """
    유사 문제 검색 (Qdrant 벡터 검색)

    question_id에 해당하는 문제와 가장 유사한 k개의 문제를 반환합니다.
    Qdrant에 저장된 bge-m3 임베딩 벡터를 기반으로 검색합니다.

    - GET /api/ai/similar/{question_id}?k=3
    - Header: X-API-Key: {AI_SERVER_API_KEY}
    - 성공: 200 + SimilarResponse
    - 인증 실패: 401
    - 서버 오류: 500
    """
    logger.info(f"[similar] question_id={question_id}, k={k}")
    try:
        result = await ai_service.similar(question_id=question_id, k=k)
        return result
    except CustomError as e:
        logger.error(f"[similar] 처리 실패: {e.message}")
        raise HTTPException(status_code=500, detail=e.message)
    except Exception as e:
        logger.error(f"[similar] 예기치 않은 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다")
