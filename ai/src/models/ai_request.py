"""src.models.ai_request
AI 기능 요청 모델 정의
"""
from typing import Any, Optional

from pydantic import BaseModel, Field


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


# === 실시간 선택지 세트 생성 (신규) ===


class LlmConfig(BaseModel):
    """
    Spring 에서 프롬프트 전문·모델·response_schema 를 포함해 내려준다.
    Python 서버는 이것을 그대로 Gemini 에 넘긴다.
    """
    model: str
    system_prompt: str
    user_template: str
    temperature: float = 0.8
    max_tokens: int = 2048
    response_schema: Optional[dict[str, Any]] = None


class QuestionFullContext(BaseModel):
    """관리자 문제 등록용 — 전체 문제(stem+answer_sql+seed choices) 생성 컨텍스트"""
    schema_ddl: str
    schema_sample_data: str
    schema_intent: Optional[str] = None
    topic: str
    subtopic: Optional[str] = None
    difficulty: int = Field(ge=1, le=5)
    hint: Optional[str] = None


class ChoiceSetContext(BaseModel):
    """사용자 풀이용 — 기존 문제에 대한 선택지 4개 세트 생성 컨텍스트"""
    question_uuid: str
    stem: str
    answer_sql: str
    schema_ddl: str
    schema_sample_data: str
    schema_intent: Optional[str] = None
    difficulty: int = Field(ge=1, le=5)


class GenerateQuestionFullRequest(BaseModel):
    context: QuestionFullContext
    llm_config: LlmConfig


class GenerateChoiceSetRequest(BaseModel):
    context: ChoiceSetContext
    llm_config: LlmConfig


class TestPromptRequest(BaseModel):
    llm_config: LlmConfig
    variables: dict[str, str] = Field(default_factory=dict)
