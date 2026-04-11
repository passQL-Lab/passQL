"""src.models.ai_response
AI 기능 응답 모델 정의
"""
from typing import Any, Optional

from pydantic import BaseModel, Field


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


# === 실시간 선택지 세트 생성 (신규) ===


class GeneratedChoice(BaseModel):
    """생성된 선택지 한 개"""
    key: str   # "A" | "B" | "C" | "D"
    body: str
    is_correct: bool
    rationale: str


class GenerationMetadata(BaseModel):
    """AI 호출 메타데이터.
    Java GenerationMetadataDto와 snake_case 키로 1:1 매핑.
    model_name → Java modelName (SNAKE_CASE ObjectMapper 자동 변환)
    """
    model_name: str
    elapsed_ms: int
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    raw_response_json: Optional[dict[str, Any]] = None


class GenerateQuestionFullResponse(BaseModel):
    stem: str
    answer_sql: str
    seed_choices: list[GeneratedChoice] = Field(min_length=4, max_length=4)
    metadata: GenerationMetadata


class GenerateChoiceSetResponse(BaseModel):
    choices: list[GeneratedChoice] = Field(min_length=4, max_length=4)
    metadata: GenerationMetadata


class TestPromptResponse(BaseModel):
    result: str
    elapsed_ms: int
