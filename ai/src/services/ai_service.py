"""src.services.ai_service
passQL AI 핵심 비즈니스 로직
- explain_error: SQL 오류 설명
- diff_explain: 선택지 diff 해설
- similar: 유사 문제 벡터 검색
"""
import logging
from src.models.ai_request import ExplainErrorRequest, DiffExplainRequest
from src.models.ai_response import AiResponse, SimilarItem, SimilarResponse
from src.services.ollama_client import ollama_client
from src.services.qdrant_client import qdrant_search_client
from src.core.config import settings
from src.core.exceptions import CustomError

logger = logging.getLogger(__name__)


class AiService:
    """
    passQL AI 서비스

    Ollama LLM 및 Qdrant 벡터 검색을 사용하여
    SQL 학습 관련 AI 기능을 제공합니다.
    """

    async def explain_error(self, req: ExplainErrorRequest) -> AiResponse:
        """
        SQL 오류 설명

        사용자가 작성한 SQL과 발생한 오류 메시지를 기반으로
        오류 원인과 수정 방법을 한국어로 설명합니다.

        Args:
            req: ExplainErrorRequest (user_uuid, question_id, sql, error_message)

        Returns:
            AiResponse: LLM이 생성한 오류 설명 텍스트

        Raises:
            CustomError: Ollama API 호출 실패 시
        """
        # TODO: 프롬프트 템플릿 버전 관리 (prompt_version 반환값 반영)
        # TODO: user_uuid 기반 개인화 로직 추가
        # TODO: question_id 기반 문제 컨텍스트 조회 로직 추가
        logger.info(
            f"explain_error 요청: user_uuid={req.user_uuid}, question_id={req.question_id}"
        )

        raise CustomError("explain_error 아직 구현되지 않았습니다")

    async def diff_explain(self, req: DiffExplainRequest) -> AiResponse:
        """
        선택지 diff 해설

        사용자가 선택한 오답과 정답을 비교하여
        왜 틀렸는지, 정답이 왜 맞는지를 한국어로 설명합니다.

        Args:
            req: DiffExplainRequest
                (user_uuid, question_id, selected_key, correct_key,
                 question_stem, choice_bodies)

        Returns:
            AiResponse: LLM이 생성한 diff 해설 텍스트

        Raises:
            CustomError: Ollama API 호출 실패 시
        """
        # TODO: 프롬프트 템플릿 버전 관리
        # TODO: selected_key == correct_key 정답 케이스 처리
        # TODO: choice_bodies에서 선택지 본문 포맷팅 로직 추가
        logger.info(
            f"diff_explain 요청: user_uuid={req.user_uuid}, question_id={req.question_id}, "
            f"selected={req.selected_key}, correct={req.correct_key}"
        )

        raise CustomError("diff_explain 아직 구현되지 않았습니다")

    async def similar(self, question_id: int, k: int) -> SimilarResponse:
        """
        유사 문제 벡터 검색

        question_id에 해당하는 문제의 임베딩 벡터를 Qdrant에서 조회하여
        가장 유사한 k개의 문제를 반환합니다.

        Args:
            question_id: 기준 문제 ID
            k: 반환할 유사 문제 수 (기본값 3)

        Returns:
            SimilarResponse: 유사 문제 목록 (question_id + score)

        Raises:
            CustomError: 벡터 조회 또는 Qdrant 검색 실패 시
        """
        # TODO: question_id로 해당 문제의 벡터를 Qdrant에서 조회하는 로직 구현
        # TODO: 자기 자신(question_id)을 결과에서 제외하는 필터 추가
        # TODO: Qdrant 컬렉션에 문제 벡터가 없을 경우 on-demand 임베딩 생성 로직 추가
        logger.info(f"similar 요청: question_id={question_id}, k={k}")

        raise CustomError("similar 아직 구현되지 않았습니다")


# 싱글턴 인스턴스
ai_service = AiService()
