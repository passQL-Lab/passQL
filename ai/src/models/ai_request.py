"""src.models.ai_request
AI 기능 요청 모델 정의
"""
from pydantic import BaseModel


class ExplainErrorRequest(BaseModel):
    """SQL 오류 설명 요청"""
    user_uuid: str
    question_id: int
    sql: str
    error_message: str


class DiffExplainRequest(BaseModel):
    """선택지 diff 해설 요청"""
    user_uuid: str
    question_id: int
    selected_key: str
    correct_key: str
    question_stem: str
    choice_bodies: dict  # key → body


class SimilarRequest(BaseModel):
    """유사 문제 검색 요청"""
    question_id: int
    k: int = 3
