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
    IndexQuestionRequest,
    IndexQuestionsBulkRequest,
    IndexStatusRequest,
    RecommendRequest,
    TestPromptRequest,
)
from src.models.ai_response import (
    AiResponse,
    GeneratedChoice,
    GenerateChoiceSetResponse,
    GenerateQuestionFullResponse,
    GenerationMetadata,
    IndexQuestionResponse,
    IndexQuestionsBulkResponse,
    IndexStatusResponse,
    RecommendedQuestion,
    RecommendResponse,
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
                model_name=cfg.model,
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
                model_name=cfg.model,
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


    # === RAG 기반 개인화 추천 ===

    # Qdrant 컬렉션명 상수
    QUESTION_COLLECTION = "passql_questions"
    # bge-m3 임베딩 차원
    EMBED_DIM = 1024

    def _build_embed_text(self, req: IndexQuestionRequest) -> str:
        """
        문제 임베딩용 텍스트를 조합한다.
        토픽/서브토픽/난이도/태그/문제 본문 앞 300자를 구조화된 형태로 결합.
        """
        topic_path = req.topic_display_name
        if req.subtopic_display_name:
            topic_path = f"{req.topic_display_name} > {req.subtopic_display_name}"

        tags_str = ", ".join(req.tag_keys) if req.tag_keys else "없음"
        stem_preview = req.stem[:300] if len(req.stem) > 300 else req.stem

        return (
            f"[TOPIC] {topic_path}\n"
            f"[DIFFICULTY] {req.difficulty}/5\n"
            f"[TAGS] {tags_str}\n"
            f"[STEM] {stem_preview}"
        )

    async def index_question(self, req: IndexQuestionRequest) -> IndexQuestionResponse:
        """
        문제 1개를 bge-m3으로 임베딩하여 Qdrant passql_questions 컬렉션에 적재.

        컬렉션이 없으면 자동 생성한다.

        Args:
            req: IndexQuestionRequest

        Returns:
            IndexQuestionResponse: 적재 결과 (created 여부)

        Raises:
            CustomError: 임베딩 생성 또는 Qdrant 저장 실패 시
        """
        logger.info(f"[index-question] question_uuid={req.question_uuid}")

        # 컬렉션 없으면 자동 생성
        await qdrant_search_client.create_collection_if_not_exists(
            self.QUESTION_COLLECTION, self.EMBED_DIM
        )

        # 기존 벡터 존재 여부로 created 판단
        existing = await qdrant_search_client.get_vector(self.QUESTION_COLLECTION, req.question_uuid)
        created = existing is None

        # 임베딩 텍스트 생성 → bge-m3으로 임베딩
        embed_text = self._build_embed_text(req)
        vector = await ollama_client.embed(model=settings.OLLAMA_EMBED_MODEL, text=embed_text)

        # Qdrant upsert (question_uuid를 point_id로 사용)
        payload = {
            "question_uuid": req.question_uuid,
            "topic": req.topic_display_name,
            "subtopic": req.subtopic_display_name or "",
            "difficulty": req.difficulty,
            "tag_keys": req.tag_keys,
        }
        await qdrant_search_client.upsert(
            collection=self.QUESTION_COLLECTION,
            point_id=req.question_uuid,
            vector=vector,
            payload=payload,
        )

        logger.info(f"[index-question] 적재 완료: question_uuid={req.question_uuid}, created={created}")
        return IndexQuestionResponse(question_uuid=req.question_uuid, created=created)

    async def index_questions_bulk(self, req: IndexQuestionsBulkRequest) -> IndexQuestionsBulkResponse:
        """
        여러 문제를 순차적으로 임베딩 적재 (관리자 전체 재색인용).

        개별 실패는 스킵하고 계속 진행하며 실패 목록을 반환한다.

        Args:
            req: IndexQuestionsBulkRequest

        Returns:
            IndexQuestionsBulkResponse: 성공/실패 집계

        Raises:
            CustomError: 치명적 오류 시
        """
        logger.info(f"[index-questions-bulk] 총 {len(req.questions)}개 처리 시작")

        succeeded = 0
        failed_uuids: list[str] = []

        for q in req.questions:
            try:
                await self.index_question(q)
                succeeded += 1
            except Exception as e:
                logger.warning(f"[index-questions-bulk] 개별 실패: question_uuid={q.question_uuid}, err={e}")
                failed_uuids.append(q.question_uuid)

        logger.info(f"[index-questions-bulk] 완료: succeeded={succeeded}, failed={len(failed_uuids)}")
        return IndexQuestionsBulkResponse(
            total=len(req.questions),
            succeeded=succeeded,
            failed=len(failed_uuids),
            failed_uuids=failed_uuids,
        )

    async def recommend(self, req: RecommendRequest) -> RecommendResponse:
        """
        사용자의 최근 오답 문제 벡터를 기반으로 유사 문제를 추천.

        흐름:
        1. recent_wrong_question_uuids로 Qdrant에서 각 문제의 벡터 조회
        2. 조회된 벡터들의 평균을 쿼리 벡터로 사용
        3. solved_question_uuids를 must_not 필터로 Qdrant 검색
        4. 벡터가 없으면 빈 결과 반환 (Java에서 RANDOM fallback 처리)

        Args:
            req: RecommendRequest

        Returns:
            RecommendResponse: 추천 문제 목록

        Raises:
            CustomError: Qdrant 검색 실패 시
        """
        logger.info(
            f"[recommend] size={req.size}, wrong_count={len(req.recent_wrong_question_uuids)}, "
            f"solved_count={len(req.solved_question_uuids)}"
        )

        # 오답 문제 벡터 수집
        source_vectors: list[list[float]] = []
        for uuid in req.recent_wrong_question_uuids:
            vec = await qdrant_search_client.get_vector(self.QUESTION_COLLECTION, uuid)
            if vec:
                source_vectors.append(vec)

        # 쿼리에 사용할 오답 벡터가 없으면 빈 결과 — Java에서 RANDOM fallback 적용
        if not source_vectors:
            logger.info("[recommend] 쿼리 벡터 없음 — 빈 결과 반환 (Java RANDOM fallback 예정)")
            return RecommendResponse(items=[], query_source_count=0)

        # 여러 벡터를 단순 평균하여 쿼리 벡터 합성
        dim = len(source_vectors[0])
        query_vector = [
            sum(v[i] for v in source_vectors) / len(source_vectors)
            for i in range(dim)
        ]

        # 이미 푼 문제 제외하여 Qdrant 검색
        results = await qdrant_search_client.search(
            collection=self.QUESTION_COLLECTION,
            vector=query_vector,
            top_k=req.size,
            must_not_ids=req.solved_question_uuids if req.solved_question_uuids else None,
        )

        items = [
            RecommendedQuestion(
                question_uuid=r["payload"]["question_uuid"],
                score=r["score"],
            )
            for r in results
            if r.get("payload", {}).get("question_uuid")
        ]

        logger.info(f"[recommend] 추천 완료: {len(items)}개")
        return RecommendResponse(items=items, query_source_count=len(source_vectors))

    async def get_index_status(self, req: IndexStatusRequest) -> IndexStatusResponse:
        """
        DB 전체 문제 UUID와 Qdrant 색인 UUID를 비교하여 미색인 목록 반환.

        흐름:
        1. Qdrant scroll_all_ids로 컬렉션의 모든 포인트 UUID 수집
        2. DB UUID 집합과 차집합 계산 → 미색인 UUID 목록 도출

        Args:
            req: IndexStatusRequest (Java에서 전달한 DB 전체 문제 UUID 목록)

        Returns:
            IndexStatusResponse: 컬렉션 포인트 수, DB 문제 수, 미색인 수, 미색인 UUID 목록
        """
        logger.info(f"[index-status] 요청: db_uuid_count={len(req.question_uuids)}")

        # Qdrant에서 현재 색인된 모든 UUID 수집
        qdrant_ids = await qdrant_search_client.scroll_all_ids(self.QUESTION_COLLECTION)
        qdrant_uuid_set = set(qdrant_ids)
        db_uuid_set = set(req.question_uuids)

        # 차집합: DB에 있지만 Qdrant에 없는 UUID = 미색인
        unindexed = list(db_uuid_set - qdrant_uuid_set)

        logger.info(
            f"[index-status] 결과: db={len(db_uuid_set)}, qdrant={len(qdrant_uuid_set)}, "
            f"미색인={len(unindexed)}"
        )
        # 미색인 UUID 앞 10개만 DEBUG 출력 (목록이 길 경우 로그 폭발 방지)
        logger.debug(
            f"[index-status] 미색인 UUID (앞 10개): "
            f"{unindexed[:10]}{'...' if len(unindexed) > 10 else ''}"
        )

        return IndexStatusResponse(
            collection_points_count=len(qdrant_uuid_set),
            db_question_count=len(db_uuid_set),
            unindexed_count=len(unindexed),
            unindexed_uuids=unindexed,
        )


# 싱글턴 인스턴스
ai_service = AiService()
