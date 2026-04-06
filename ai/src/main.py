"""src.main
FastAPI 애플리케이션 진입점
"""
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from src.core.logging import setup_logging
from src.apis.ai_router import router as ai_router
from src.apis.health_router import router as health_router

# 로깅 초기화
setup_logging(log_level="INFO")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    애플리케이션 수명주기 관리

    앱 시작 시: 필요한 초기화 수행
    앱 종료 시: 리소스 정리 (필요 시)
    """
    # ========== 시작 단계 ==========
    logger.info("=== passQL AI 서버 시작: 초기화 중 ===")

    logger.info("=== passQL AI 서버 준비 완료 ===")

    yield  # 애플리케이션 실행

    # ========== 종료 단계 ==========
    logger.info("=== passQL AI 서버 종료 중 ===")


# FastAPI 앱 생성 (lifespan 컨텍스트 적용)
app = FastAPI(
    title="passQL AI Server",
    description="passQL의 SQL 오류 설명, diff 해설, 유사 문제 검색 AI 서버입니다.",
    version="0.0.1",
    lifespan=lifespan,
    docs_url="/docs/swagger",
    redoc_url="/docs/redoc"
)

# 라우터 등록
app.include_router(ai_router)
app.include_router(health_router)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """요청 처리 시간 측정 미들웨어"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # 응답 헤더에 처리 시간 추가
    response.headers["X-Process-Time"] = f"{process_time:.4f}"

    # 로깅
    logger.info(
        f"요청 처리 완료: {request.method} {request.url.path} - {process_time:.4f}초"
    )

    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, loop="asyncio")
