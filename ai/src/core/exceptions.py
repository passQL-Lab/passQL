"""src.core.exceptions
커스텀 예외 정의 (Spring CustomException 스타일)
"""


class CustomError(Exception):
    """
    커스텀 예외 (Spring의 CustomException 스타일)

    간단하게 에러 메시지만 전달하여 사용합니다.

    Examples:
        >>> raise CustomError("Ollama 응답 생성에 실패했습니다")
        >>> raise CustomError("Qdrant 벡터 검색에 실패했습니다")

    Usage:
        try:
            result = await ollama_client.chat(...)
        except CustomError as e:
            logger.error(f"처리 실패: {e.message}", exc_info=True)
    """

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

    def __str__(self):
        return self.message
