"""src.services.ai_service
passQL AI 핵심 비즈니스 로직
- explain_error: SQL 오류 설명
- diff_explain: 선택지 diff 해설
- similar: 유사 문제 벡터 검색
"""
import logging
import time

from src.models.ai_request import (
    DiffExplainRequest,
    ExplainErrorRequest,
    GenerateChoiceSetRequest,
    GenerateQuestionFullRequest,
    TestPromptRequest,
)
from src.models.ai_response import (
    AiResponse,
    GeneratedChoice,
    GenerateChoiceSetResponse,
    GenerateQuestionFullResponse,
    GenerationMetadata,
    SimilarItem,
    SimilarResponse,
    TestPromptResponse,
)
from src.services.ollama_client import ollama_client
from src.services.qdrant_client import qdrant_search_client
from src.services.gemini_client import gemini_client
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

    # === 실시간 선택지 세트 생성 (신규) ===

    @staticmethod
    def _render(template: str, variables: dict) -> str:
        """단순 {var} 치환. 없는 키는 빈 문자열."""
        try:
            # 모든 format 실패 방지를 위해 수동 치환
            rendered = template
            for k, v in variables.items():
                rendered = rendered.replace("{" + k + "}", str(v) if v is not None else "")
            return rendered
        except Exception as e:
            raise CustomError(f"프롬프트 템플릿 치환 실패: {e}")

    async def generate_question_full(
        self, req: GenerateQuestionFullRequest
    ) -> GenerateQuestionFullResponse:
        """
        관리자 문제 등록용: stem + answer_sql + seed_choices(4) 생성.
        Spring 이 내려준 프롬프트 전문과 response_schema 를 그대로 Gemini 에 전달.
        """
        ctx = req.context
        cfg = req.llm_config
        variables = {
            "schema_ddl": ctx.schema_ddl,
            "schema_sample_data": ctx.schema_sample_data,
            "schema_intent": ctx.schema_intent or "",
            "topic": ctx.topic,
            "subtopic": ctx.subtopic or "",
            "difficulty": ctx.difficulty,
            "hint": ctx.hint or "",
        }
        user_prompt = self._render(cfg.user_template, variables)

        if not cfg.response_schema:
            raise CustomError("generate_question_full 은 response_schema 가 필수입니다")

        logger.info(f"[generate-question-full] topic={ctx.topic}, difficulty={ctx.difficulty}")
        started = time.monotonic()
        payload = await gemini_client.chat_structured(
            system_prompt=cfg.system_prompt,
            user_prompt=user_prompt,
            model=cfg.model,
            temperature=cfg.temperature,
            max_tokens=cfg.max_tokens,
            response_schema=cfg.response_schema,
        )
        elapsed_ms = int((time.monotonic() - started) * 1000)

        try:
            stem = payload["stem"]
            answer_sql = payload["answer_sql"]
            raw_choices = payload["seed_choices"]
            seed_choices = [GeneratedChoice(**c) for c in raw_choices]
        except (KeyError, TypeError, ValueError) as e:
            logger.error(f"generate_question_full 응답 스키마 위반: {e} payload={payload}")
            raise CustomError(f"AI 응답 스키마 위반: {e}")

        return GenerateQuestionFullResponse(
            stem=stem,
            answer_sql=answer_sql,
            seed_choices=seed_choices,
            metadata=GenerationMetadata(
                model=cfg.model,
                elapsed_ms=elapsed_ms,
                raw_response_json=payload,
            ),
        )

    async def generate_choice_set(
        self, req: GenerateChoiceSetRequest
    ) -> GenerateChoiceSetResponse:
        """
        사용자 풀이용: 기존 문제에 대한 선택지 4개 세트 생성.
        메인 트래픽 경로.
        """
        ctx = req.context
        cfg = req.llm_config
        variables = {
            "question_uuid": ctx.question_uuid,
            "stem": ctx.stem,
            "answer_sql": ctx.answer_sql,
            "schema_ddl": ctx.schema_ddl,
            "schema_sample_data": ctx.schema_sample_data,
            "schema_intent": ctx.schema_intent or "",
            "difficulty": ctx.difficulty,
        }
        user_prompt = self._render(cfg.user_template, variables)

        if not cfg.response_schema:
            raise CustomError("generate_choice_set 은 response_schema 가 필수입니다")

        logger.info(f"[generate-choice-set] question_uuid={ctx.question_uuid}")
        started = time.monotonic()
        payload = await gemini_client.chat_structured(
            system_prompt=cfg.system_prompt,
            user_prompt=user_prompt,
            model=cfg.model,
            temperature=cfg.temperature,
            max_tokens=cfg.max_tokens,
            response_schema=cfg.response_schema,
        )
        elapsed_ms = int((time.monotonic() - started) * 1000)

        try:
            raw_choices = payload["choices"]
            choices = [GeneratedChoice(**c) for c in raw_choices]
        except (KeyError, TypeError, ValueError) as e:
            logger.error(f"generate_choice_set 응답 스키마 위반: {e} payload={payload}")
            raise CustomError(f"AI 응답 스키마 위반: {e}")

        return GenerateChoiceSetResponse(
            choices=choices,
            metadata=GenerationMetadata(
                model=cfg.model,
                elapsed_ms=elapsed_ms,
                raw_response_json=payload,
            ),
        )

    async def test_prompt(self, req: TestPromptRequest) -> TestPromptResponse:
        """
        관리자 프롬프트 테스트: 임의 변수 dict 로 프롬프트 렌더 후 Gemini 호출.
        response_schema 가 있으면 structured, 없으면 일반 chat.
        """
        cfg = req.llm_config
        user_prompt = self._render(cfg.user_template, req.variables)

        logger.info(f"[test-prompt] model={cfg.model}")
        started = time.monotonic()
        if cfg.response_schema:
            payload = await gemini_client.chat_structured(
                system_prompt=cfg.system_prompt,
                user_prompt=user_prompt,
                model=cfg.model,
                temperature=cfg.temperature,
                max_tokens=cfg.max_tokens,
                response_schema=cfg.response_schema,
            )
            import json
            result_text = json.dumps(payload, ensure_ascii=False, indent=2)
        else:
            result_text = await gemini_client.chat(
                system_prompt=cfg.system_prompt,
                user_prompt=user_prompt,
                model=cfg.model,
                temperature=cfg.temperature,
                max_tokens=cfg.max_tokens,
            )
        elapsed_ms = int((time.monotonic() - started) * 1000)

        return TestPromptResponse(result=result_text, elapsed_ms=elapsed_ms)


# 싱글턴 인스턴스
ai_service = AiService()
