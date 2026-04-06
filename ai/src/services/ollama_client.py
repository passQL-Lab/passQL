"""src.services.ollama_client
Ollama API 클라이언트 (chat / embed)
"""
import logging
import httpx
from src.core.config import settings
from src.core.exceptions import CustomError

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    Ollama API 비동기 클라이언트

    ai.suhsaechan.kr 서버의 Ollama API를 호출합니다.
    - chat: qwen2.5:7b 모델로 텍스트 생성
    - embed: bge-m3 모델로 벡터 임베딩 생성
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_API_URL.rstrip("/")
        self.api_key = settings.OLLAMA_API_KEY
        self.timeout = settings.OLLAMA_TIMEOUT_SEC

    def _headers(self) -> dict:
        """공통 요청 헤더 반환"""
        return {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

    async def chat(
        self,
        model: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Ollama /api/chat 호출

        Args:
            model: 사용할 모델명 (예: "qwen2.5:7b")
            messages: [{"role": "user", "content": "..."}, ...] 형식의 메시지 목록
            temperature: 생성 온도 (0.0 ~ 1.0)
            max_tokens: 최대 생성 토큰 수

        Returns:
            str: 모델이 생성한 텍스트

        Raises:
            CustomError: API 호출 실패 또는 응답 파싱 실패 시
        """
        # TODO: 프롬프트 버전 관리 로직 추가
        # TODO: 재시도 로직 추가 (max_retries 파라미터)
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        logger.info(f"Ollama chat 호출: model={model}, messages_count={len(messages)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=self._headers())
                response.raise_for_status()
                data = response.json()

            content = data.get("message", {}).get("content", "")
            if not content:
                raise CustomError("Ollama chat 응답에 content가 없습니다")

            logger.info(f"Ollama chat 응답 수신: content_length={len(content)}")
            return content

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama chat HTTP 오류: {e.response.status_code} - {e.response.text}")
            raise CustomError(f"Ollama chat HTTP 오류: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Ollama chat 요청 오류: {e}")
            raise CustomError(f"Ollama chat 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Ollama chat 예기치 않은 오류: {e}")
            raise CustomError(f"Ollama chat 예기치 않은 오류: {e}")

    async def embed(self, model: str, text: str) -> list[float]:
        """
        Ollama /api/embed 호출

        Args:
            model: 임베딩 모델명 (예: "bge-m3")
            text: 임베딩할 텍스트

        Returns:
            list[float]: 임베딩 벡터

        Raises:
            CustomError: API 호출 실패 또는 응답 파싱 실패 시
        """
        # TODO: 배치 임베딩 지원 추가
        url = f"{self.base_url}/api/embed"
        payload = {
            "model": model,
            "input": text,
        }

        logger.info(f"Ollama embed 호출: model={model}, text_length={len(text)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=self._headers())
                response.raise_for_status()
                data = response.json()

            # Ollama /api/embed 응답: {"embeddings": [[...]], ...}
            embeddings = data.get("embeddings", [])
            if not embeddings or not embeddings[0]:
                raise CustomError("Ollama embed 응답에 embeddings가 없습니다")

            vector = embeddings[0]
            logger.info(f"Ollama embed 응답 수신: vector_dim={len(vector)}")
            return vector

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama embed HTTP 오류: {e.response.status_code} - {e.response.text}")
            raise CustomError(f"Ollama embed HTTP 오류: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Ollama embed 요청 오류: {e}")
            raise CustomError(f"Ollama embed 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Ollama embed 예기치 않은 오류: {e}")
            raise CustomError(f"Ollama embed 예기치 않은 오류: {e}")


# 싱글턴 인스턴스
ollama_client = OllamaClient()
