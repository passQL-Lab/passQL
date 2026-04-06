package com.passql.common.exception;

import com.passql.common.exception.constant.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * API 에러 응답을 표현하는 클래스 에러 코드와 메시지를 포함
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private String errorCode;
    private String message;

    /**
     * ErrorCode enum으로부터 에러 응답 객체를 생성하는 정적 팩토리 메소드
     */
    public static ErrorResponse getResponse(ErrorCode errorCode) {
        return ErrorResponse.builder()
            .errorCode(errorCode.name())
            .message(errorCode.getMessage())
            .build();
    }

    /**
     * ErrorCode enum과 추가 메시지를 결합하여 에러 응답 객체를 생성하는 정적 팩토리 메소드
     */
    public static ErrorResponse getResponse(ErrorCode errorCode, String additionalMessage) {
        return ErrorResponse.builder()
            .errorCode(errorCode.name())
            .message(errorCode.getMessage() + " - " + additionalMessage)
            .build();
    }

    /**
     * ErrorCodeBuilder로부터 에러 응답 객체를 생성하는 정적 팩토리 메소드
     */
    public static ErrorResponse getResponse(ErrorCodeBuilder errorCodeBuilder) {
        return ErrorResponse.builder()
            .errorCode(null)
            .message(errorCodeBuilder.getMessage())
            .build();
    }
}
