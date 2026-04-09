"""src.services.gemini_client
Google Gemini API 클라이언트 (google-genai SDK)
"""
import logging
from typing import Any, Optional

from google import genai
from google.genai import types

from src.core.config import settings
from src.core.exceptions import CustomError
from src.services.redis_settings import get_gemini_api_key

logger = logging.getLogger(__name__)


class GeminiClient:
    """
    Google Gemini API 래퍼.

    - chat: 일반 텍스트 응답
    - chat_structured: response_schema(JSON mode) 강제 응답
    """

    def _get_client(self) -> genai.Client:
        api_key = get_gemini_api_key()
        if not api_key:
            raise CustomError("Gemini API Key 미설정 — Redis(DB) 또는 환경변수를 확인하세요")
        return genai.Client(api_key=api_key)

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """
        일반 텍스트 응답.

        Raises:
            CustomError: Gemini 호출 실패 또는 빈 응답
        """
        logger.debug(f"Gemini chat: model={model}, max_tokens={max_tokens}")
        try:
            client = self._get_client()
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            response = client.models.generate_content(
                model=model,
                contents=user_prompt,
                config=config,
            )
            text = response.text
            if not text or not text.strip():
                raise CustomError(f"Gemini returned empty response (model={model})")
            return text
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Gemini chat 실패: {e}", exc_info=True)
            raise CustomError(f"Gemini API 호출 실패: {e}")

    async def chat_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_tokens: int,
        response_schema: dict[str, Any],
    ) -> dict[str, Any]:
        """
        JSON 강제 응답.

        response_schema 는 JSON Schema dict. google-genai 가 이를 따라
        반드시 스키마에 맞는 JSON 을 반환한다.

        Returns:
            파싱된 dict

        Raises:
            CustomError: Gemini 호출 실패, 빈 응답, JSON 파싱 실패
        """
        import json

        logger.debug(f"Gemini chat_structured: model={model}, max_tokens={max_tokens}")
        try:
            client = self._get_client()
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                max_output_tokens=max_tokens,
                response_mime_type="application/json",
                response_schema=response_schema,
            )
            response = client.models.generate_content(
                model=model,
                contents=user_prompt,
                config=config,
            )
            text = response.text
            if not text or not text.strip():
                raise CustomError(f"Gemini returned empty response (model={model})")
            try:
                return json.loads(text)
            except json.JSONDecodeError as e:
                logger.error(f"Gemini 응답 JSON 파싱 실패: {text[:500]}")
                raise CustomError(f"Gemini structured 응답 JSON 파싱 실패: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Gemini chat_structured 실패: {e}", exc_info=True)
            raise CustomError(f"Gemini API 호출 실패: {e}")


# 싱글턴
gemini_client = GeminiClient()
