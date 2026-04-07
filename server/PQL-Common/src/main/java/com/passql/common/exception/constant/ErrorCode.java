package com.passql.common.exception.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Global
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버에 문제가 발생했습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "유효하지 않은 입력값입니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근이 거부되었습니다."),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메소드입니다."),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 미디어 타입입니다."),
    DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "데이터베이스 오류가 발생했습니다."),

    // External
    EXTERNAL_API_ERROR(HttpStatus.BAD_GATEWAY, "외부 API 호출 중 오류가 발생했습니다."),
    NETWORK_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "네트워크 통신 오류가 발생했습니다."),

    // Sandbox
    SQL_SYNTAX(HttpStatus.BAD_REQUEST, "SQL 문법 오류입니다."),
    SQL_SEMANTIC(HttpStatus.BAD_REQUEST, "존재하지 않는 컬럼 또는 테이블입니다."),
    NOT_SELECT(HttpStatus.BAD_REQUEST, "SELECT 또는 WITH 구문만 허용됩니다."),
    MULTIPLE_STATEMENTS(HttpStatus.BAD_REQUEST, "여러 개의 SQL 문은 허용되지 않습니다."),
    TOO_LONG(HttpStatus.BAD_REQUEST, "SQL이 허용된 최대 길이를 초과했습니다."),
    SANDBOX_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, "쿼리 실행 시간이 초과되었습니다."),
    ROW_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "결과 행 수가 최대 한도를 초과했습니다."),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요."),

    // AI
    AI_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 기능이 일시적으로 사용 불가합니다."),
    AI_TIMEOUT(HttpStatus.REQUEST_TIMEOUT, "AI 응답 시간이 초과되었습니다."),

    // Domain
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "문제를 찾을 수 없습니다."),
    SANDBOX_DB_NOT_FOUND(HttpStatus.NOT_FOUND, "샌드박스 DB를 찾을 수 없습니다."),
    SETTING_NOT_FOUND(HttpStatus.NOT_FOUND, "설정값을 찾을 수 없습니다."),
    PROMPT_NOT_FOUND(HttpStatus.NOT_FOUND, "프롬프트 템플릿을 찾을 수 없습니다."),
    TOPIC_NOT_FOUND(HttpStatus.NOT_FOUND, "토픽을 찾을 수 없습니다."),

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    MEMBER_ALREADY_WITHDRAWN(HttpStatus.GONE, "이미 탈퇴한 회원입니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    NICKNAME_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "닉네임 생성에 실패했습니다.");

    private final HttpStatus status;
    private final String message;
}
