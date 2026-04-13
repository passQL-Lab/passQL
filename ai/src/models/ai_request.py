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


# === RAG 기반 개인화 추천 ===


class IndexQuestionRequest(BaseModel):
    """문제 1개를 Qdrant에 임베딩 적재하는 요청"""
    question_uuid: str
    topic_display_name: str
    subtopic_display_name: Optional[str] = None
    difficulty: int = Field(ge=1, le=5)
    tag_keys: list[str] = Field(default_factory=list)
    stem: str


class IndexQuestionsBulkRequest(BaseModel):
    """여러 문제를 Qdrant에 일괄 적재하는 요청 (관리자 전체 재색인용)"""
    questions: list[IndexQuestionRequest]


class RecommendRequest(BaseModel):
    """사용자 신호 기반 개인화 문제 추천 요청

    Java가 Submission DB에서 사용자 신호를 집계하여 전달한다.
    Python은 임베딩 검색만 담당.
    """
    size: int = Field(default=3, ge=1, le=5)
    # 최근 오답 문제 UUID 목록 — 이 문제들의 벡터를 쿼리로 활용
    recent_wrong_question_uuids: list[str] = Field(default_factory=list)
    # 이미 푼 문제 UUID 목록 — Qdrant 필터로 제외
    solved_question_uuids: list[str] = Field(default_factory=list)


class IndexStatusRequest(BaseModel):
    """DB 전체 문제 UUID 목록 기반 색인 상태 확인 요청.

    Java가 DB에서 조회한 전체 문제 UUID를 전달하면
    Python이 Qdrant scroll과 비교하여 미색인 목록 반환.
    """
    # Java가 DB에서 조회한 전체 문제 UUID 목록
    question_uuids: list[str]
