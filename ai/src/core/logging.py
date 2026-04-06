"""src.core.logging
Python 표준 logging 모듈 설정
"""
import logging
import sys
from pathlib import Path
from logging.handlers import TimedRotatingFileHandler
from src.core.config import settings


def setup_logging(log_level: str = "INFO", log_file: str = "logs/app.log"):
    """
    애플리케이션 로깅 설정

    Args:
        log_level: 로그 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: 로그 파일 경로 (dev 환경에서는 사용되지 않음)
    """
    # 포맷터 정의
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 콘솔 핸들러 (모든 환경에서 사용)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # 기존 핸들러 제거 (중복 방지)
    root_logger.handlers.clear()

    # 핸들러 추가
    root_logger.addHandler(console_handler)

    # 환경별 파일 핸들러 설정
    environment = getattr(settings, 'ENVIRONMENT', 'dev').lower()

    if environment == 'prod':
        # 프로덕션 환경: 파일 로그 저장
        log_dir = Path('/mnt/passql/ai/logs')
        log_dir.mkdir(parents=True, exist_ok=True)

        # 일반 로그 파일 핸들러 (모든 레벨)
        general_log_file = log_dir / 'passql.log'
        general_handler = TimedRotatingFileHandler(
            filename=str(general_log_file),
            when='midnight',
            interval=1,
            backupCount=30,
            encoding='utf-8'
        )
        general_handler.setFormatter(formatter)
        root_logger.addHandler(general_handler)

        # 에러 로그 파일 핸들러 (ERROR 이상만)
        error_log_file = log_dir / 'passql.error.log'
        error_handler = TimedRotatingFileHandler(
            filename=str(error_log_file),
            when='midnight',
            interval=1,
            backupCount=30,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        root_logger.addHandler(error_handler)

        logging.info(f"로깅 시스템 초기화 완료 (환경: {environment}, 로그 경로: {log_dir})")
    else:
        # 개발 환경: 콘솔만 출력
        logging.info(f"로깅 시스템 초기화 완료 (환경: {environment}, 파일 로그 비활성화)")


def get_logger(name: str) -> logging.Logger:
    """
    모듈별 로거 반환

    Args:
        name: 로거 이름 (보통 __name__ 사용)

    Returns:
        logging.Logger: 설정된 로거
    """
    return logging.getLogger(name)
