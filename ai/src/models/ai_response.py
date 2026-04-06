"""src.models.ai_response
AI 기능 응답 모델 정의
"""
from pydantic import BaseModel


class AiResponse(BaseModel):
    """일반 AI 텍스트 응답"""
    text: str
    prompt_version: int = 0


class SimilarItem(BaseModel):
    """유사 문제 단일 항목"""
    question_id: int
    score: float


class SimilarResponse(BaseModel):
    """유사 문제 검색 응답"""
    items: list[SimilarItem]
