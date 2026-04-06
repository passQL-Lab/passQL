package com.passql.common.exception;

import com.passql.common.exception.constant.ErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 커스텀 예외 클래스 ErrorCode enum을 사용하여 정의된 에러 코드와 메시지를 포함하는 예외
 */
@Getter
public class CustomException extends RuntimeException {

    private ErrorCode errorCode;
    private ErrorCodeBuilder errorCodeBuilder;
    private final String message;
    private final int httpStatusCode;

    /**
     * ErrorCode를 인자로 받는 생성자 에러 코드의 메시지를 상위 클래스의 메시지로 사용
     *
     * @param errorCode 예외와 관련된 에러 코드
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.message = errorCode.getMessage();
        this.httpStatusCode = errorCode.getStatus().value();
    }

    /**
     * ErrorCodeBuilder를 인자로 받는 생성자
     *
     * @param errorCodeBuilder 동적으로 생성된 에러 코드 빌더
     */
    public CustomException(ErrorCodeBuilder errorCodeBuilder) {
        super(errorCodeBuilder.getMessage());
        this.errorCodeBuilder = errorCodeBuilder;
        this.message = errorCodeBuilder.getMessage();
        this.httpStatusCode = errorCodeBuilder.getHttpStatus().value();
    }

    /**
     * HttpStatus 객체 반환 (GlobalExceptionHandler 호환성)
     *
     * @return HttpStatus 객체
     */
    public HttpStatus getStatus() {
        return HttpStatus.valueOf(this.httpStatusCode);
    }
}
