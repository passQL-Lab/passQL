package com.passql.common.exception;

import com.passql.common.exception.constant.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * API 에러 응답 표준 형식.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private String errorCode;
    private String message;

    public static ErrorResponse getResponse(ErrorCode errorCode) {
        return ErrorResponse.builder()
            .errorCode(errorCode.name())
            .message(errorCode.getMessage())
            .build();
    }

    public static ErrorResponse getResponse(ErrorCode errorCode, String additionalMessage) {
        return ErrorResponse.builder()
            .errorCode(errorCode.name())
            .message(errorCode.getMessage() + " - " + additionalMessage)
            .build();
    }
}
