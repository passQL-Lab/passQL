"""src.services.qdrant_client
Qdrant 벡터 DB 클라이언트 (search / upsert)
"""
import logging
import httpx
from src.core.config import settings
from src.core.exceptions import CustomError

logger = logging.getLogger(__name__)


class QdrantSearchClient:
    """
    Qdrant REST API 비동기 클라이언트

    Qdrant 벡터 DB에 벡터를 저장하고 유사도 검색을 수행합니다.
    - search: 벡터 유사도 검색 (top_k 결과 반환)
    - upsert: 벡터 + payload 저장 (없으면 삽입, 있으면 갱신)
    """

    def __init__(self):
        self.base_url = settings.QDRANT_URL.rstrip("/")
        self.timeout = 30

    def _headers(self) -> dict:
        """공통 요청 헤더 반환"""
        return {
            "Content-Type": "application/json",
        }

    async def search(
        self,
        collection: str,
        vector: list[float],
        top_k: int = 3,
    ) -> list[dict]:
        """
        Qdrant 컬렉션에서 벡터 유사도 검색

        Args:
            collection: 검색할 컬렉션 이름
            vector: 쿼리 벡터
            top_k: 반환할 최대 결과 수

        Returns:
            list[dict]: [{"id": ..., "score": ..., "payload": {...}}, ...] 형식의 결과 목록

        Raises:
            CustomError: API 호출 실패 시
        """
        # TODO: with_payload, with_vectors 옵션 파라미터화
        # TODO: score_threshold 필터 추가
        url = f"{self.base_url}/collections/{collection}/points/search"
        payload = {
            "vector": vector,
            "limit": top_k,
            "with_payload": True,
        }

        logger.info(f"Qdrant search: collection={collection}, top_k={top_k}, vector_dim={len(vector)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=self._headers())
                response.raise_for_status()
                data = response.json()

            results = data.get("result", [])
            logger.info(f"Qdrant search 완료: 결과 수={len(results)}")
            return results

        except httpx.HTTPStatusError as e:
            logger.error(f"Qdrant search HTTP 오류: {e.response.status_code} - {e.response.text}")
            raise CustomError(f"Qdrant search HTTP 오류: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Qdrant search 요청 오류: {e}")
            raise CustomError(f"Qdrant search 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Qdrant search 예기치 않은 오류: {e}")
            raise CustomError(f"Qdrant search 예기치 않은 오류: {e}")

    async def upsert(
        self,
        collection: str,
        point_id: int | str,
        vector: list[float],
        payload: dict,
    ) -> None:
        """
        Qdrant 컬렉션에 벡터 + payload 저장 (upsert)

        Args:
            collection: 저장할 컬렉션 이름
            point_id: 포인트 ID (question_id 등)
            vector: 저장할 벡터
            payload: 저장할 메타데이터 딕셔너리

        Raises:
            CustomError: API 호출 실패 시
        """
        # TODO: 배치 upsert 지원 추가
        url = f"{self.base_url}/collections/{collection}/points"
        body = {
            "points": [
                {
                    "id": point_id,
                    "vector": vector,
                    "payload": payload,
                }
            ]
        }

        logger.info(f"Qdrant upsert: collection={collection}, id={point_id}, vector_dim={len(vector)}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.put(url, json=body, headers=self._headers())
                response.raise_for_status()

            logger.info(f"Qdrant upsert 완료: id={point_id}")

        except httpx.HTTPStatusError as e:
            logger.error(f"Qdrant upsert HTTP 오류: {e.response.status_code} - {e.response.text}")
            raise CustomError(f"Qdrant upsert HTTP 오류: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Qdrant upsert 요청 오류: {e}")
            raise CustomError(f"Qdrant upsert 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Qdrant upsert 예기치 않은 오류: {e}")
            raise CustomError(f"Qdrant upsert 예기치 않은 오류: {e}")


# 싱글턴 인스턴스
qdrant_search_client = QdrantSearchClient()
