package com.passql.common.exception;

import com.passql.common.exception.constant.ErrorCode;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 프로젝트 전역 단일 비즈니스 예외.
 *
 * <p>모든 도메인은 이 예외 하나만 던진다. 도메인별 별도 예외 클래스는 만들지 않는다.
 * 구분은 {@link ErrorCode} enum으로 한다.
 *
 * <p>기본 사용:
 * <pre>{@code
 *   throw new CustomException(ErrorCode.MEMBER_NOT_FOUND);
 * }</pre>
 *
 * <p>추가 detail이 필요한 경우:
 * <pre>{@code
 *   throw new CustomException(ErrorCode.MEMBER_NOT_FOUND, "memberUuid=" + memberUuid);
 * }</pre>
 */
@Getter
public class CustomException extends RuntimeException {

    private final ErrorCode errorCode;

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, String detail) {
        super(errorCode.getMessage() + " - " + detail);
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }

    public CustomException(ErrorCode errorCode, String detail, Throwable cause) {
        super(errorCode.getMessage() + " - " + detail, cause);
        this.errorCode = errorCode;
    }

    /** GlobalExceptionHandler 호환성 */
    public HttpStatus getStatus() {
        return errorCode.getStatus();
    }
}
