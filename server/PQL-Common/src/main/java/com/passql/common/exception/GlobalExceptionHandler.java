package com.passql.common.exception;

import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러 애플리케이션에서 발생하는 다양한 예외를 처리하고 일관된 응답 형식으로 변환
 */
@Slf4j
@Hidden
@RestControllerAdvice(basePackages = "com.passql")
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e, HttpServletRequest request) {
        String errorCode = e.getErrorCode() != null ? e.getErrorCode().name() : null;
        log.error("[예외 처리] CustomException 발생: errorCode={}, message={}, path={}, method={}",
            errorCode, e.getMessage(), request.getRequestURI(), request.getMethod());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode(errorCode)
            .message(e.getMessage())
            .build();
        return ResponseEntity.status(e.getStatus()).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
        IllegalArgumentException e, HttpServletRequest request) {
        log.error("IllegalArgumentException 발생: {}", e.getMessage(), e);
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("ILLEGAL_ARGUMENT")
            .message(e.getMessage())
            .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException e, HttpServletRequest request) {
        String errorMessage = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.joining(", "));
        log.error("[예외 처리] Validation 실패: message={}, path={}, method={}",
            errorMessage, request.getRequestURI(), request.getMethod());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("VALIDATION_ERROR")
            .message(errorMessage)
            .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
        HttpMessageNotReadableException e, HttpServletRequest request) {
        log.error("HttpMessageNotReadableException 발생: {}", e.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("MESSAGE_NOT_READABLE")
            .message("요청 본문을 읽을 수 없습니다: " + e.getMessage())
            .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
        MissingServletRequestParameterException e, HttpServletRequest request)
        throws MissingServletRequestParameterException {
        log.error("MissingServletRequestParameterException 발생: {}", e.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("MISSING_PARAMETER")
            .message("필수 파라미터가 누락되었습니다: " + e.getParameterName())
            .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
        MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        log.error("MethodArgumentTypeMismatchException 발생: {}", e.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("TYPE_MISMATCH")
            .message(String.format("파라미터 '%s'의 값 '%s'가 올바른 형식이 아닙니다", e.getName(), e.getValue()))
            .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFoundException(
        NoHandlerFoundException e, HttpServletRequest request) throws NoHandlerFoundException {
        log.error("NoHandlerFoundException 발생: {}", e.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("NOT_FOUND")
            .message(String.format("요청하신 리소스를 찾을 수 없습니다: %s %s", e.getHttpMethod(), e.getRequestURL()))
            .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
        DataIntegrityViolationException e, HttpServletRequest request) {
        log.error("[예외 처리] DataIntegrityViolationException 발생: path={}, method={}",
            request.getRequestURI(), request.getMethod(), e);
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("DATA_INTEGRITY_VIOLATION")
            .message("데이터 무결성 제약을 위반했습니다")
            .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e, HttpServletRequest request) throws Exception {
        log.error("처리되지 않은 예외 발생: {}", e.getMessage(), e);
        ErrorResponse errorResponse = ErrorResponse.builder()
            .errorCode("INTERNAL_SERVER_ERROR")
            .message("서버 내부 오류가 발생했습니다")
            .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
