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

    async def create_collection_if_not_exists(
        self,
        collection: str,
        vector_size: int = 1024,
    ) -> bool:
        """
        Qdrant 컬렉션이 없으면 생성 (있으면 스킵)

        Args:
            collection: 생성할 컬렉션 이름
            vector_size: 벡터 차원 수 (bge-m3 기본값 1024)

        Returns:
            bool: True=신규 생성, False=이미 존재

        Raises:
            CustomError: API 호출 실패 시
        """
        check_url = f"{self.base_url}/collections/{collection}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(check_url, headers=self._headers())
                if resp.status_code == 200:
                    logger.info(f"Qdrant 컬렉션 이미 존재: {collection}")
                    return False

            # 컬렉션 없음 → 생성
            create_url = f"{self.base_url}/collections/{collection}"
            body = {
                "vectors": {
                    "size": vector_size,
                    "distance": "Cosine",
                }
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.put(create_url, json=body, headers=self._headers())
                resp.raise_for_status()

            logger.info(f"Qdrant 컬렉션 생성 완료: {collection}, dim={vector_size}")
            return True

        except httpx.HTTPStatusError as e:
            logger.error(f"Qdrant create_collection HTTP 오류: {e.response.status_code}")
            raise CustomError(f"Qdrant 컬렉션 생성 실패: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Qdrant create_collection 요청 오류: {e}")
            raise CustomError(f"Qdrant 컬렉션 생성 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Qdrant create_collection 예기치 않은 오류: {e}")
            raise CustomError(f"Qdrant 컬렉션 생성 예기치 않은 오류: {e}")

    async def get_vector(
        self,
        collection: str,
        point_id: int | str,
    ) -> list[float] | None:
        """
        Qdrant에서 특정 point의 벡터를 조회

        Args:
            collection: 컬렉션 이름
            point_id: 포인트 ID

        Returns:
            list[float] | None: 벡터 (없으면 None)

        Raises:
            CustomError: API 호출 실패 시
        """
        url = f"{self.base_url}/collections/{collection}/points/{point_id}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    params={"with_vector": "true"},
                    headers=self._headers(),
                )
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                data = response.json()

            vector = data.get("result", {}).get("vector")
            return vector

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            logger.error(f"Qdrant get_vector HTTP 오류: {e.response.status_code}")
            raise CustomError(f"Qdrant get_vector HTTP 오류: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"Qdrant get_vector 요청 오류: {e}")
            raise CustomError(f"Qdrant get_vector 요청 오류: {e}")
        except CustomError:
            raise
        except Exception as e:
            logger.error(f"Qdrant get_vector 예기치 않은 오류: {e}")
            raise CustomError(f"Qdrant get_vector 예기치 않은 오류: {e}")

    async def search(
        self,
        collection: str,
        vector: list[float],
        top_k: int = 3,
        must_not_ids: list[str] | None = None,
    ) -> list[dict]:
        """
        Qdrant 컬렉션에서 벡터 유사도 검색

        Args:
            collection: 검색할 컬렉션 이름
            vector: 쿼리 벡터
            top_k: 반환할 최대 결과 수
            must_not_ids: 결과에서 제외할 question_uuid 목록 (이미 푼 문제 제외)

        Returns:
            list[dict]: [{"id": ..., "score": ..., "payload": {...}}, ...] 형식의 결과 목록

        Raises:
            CustomError: API 호출 실패 시
        """
        url = f"{self.base_url}/collections/{collection}/points/search"
        payload: dict = {
            "vector": vector,
            "limit": top_k,
            "with_payload": True,
        }

        # 이미 푼 문제 제외 필터 — question_uuid payload 값 기준
        if must_not_ids:
            payload["filter"] = {
                "must_not": [
                    {
                        "key": "question_uuid",
                        "match": {"any": must_not_ids},
                    }
                ]
            }

        logger.info(f"Qdrant search: collection={collection}, top_k={top_k}, vector_dim={len(vector)}, must_not_count={len(must_not_ids) if must_not_ids else 0}")

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
