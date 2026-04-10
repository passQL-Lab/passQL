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
    EXAM_SCHEDULE_NOT_FOUND(HttpStatus.NOT_FOUND, "시험 일정을 찾을 수 없습니다."),
    EXAM_SCHEDULE_DUPLICATE(HttpStatus.CONFLICT, "이미 등록된 시험 회차입니다."),
    DAILY_CHALLENGE_QUESTION_INACTIVE(HttpStatus.UNPROCESSABLE_ENTITY, "비활성 문제는 일일 챌린지로 배정할 수 없습니다."),

    // Member
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다."),
    MEMBER_ALREADY_WITHDRAWN(HttpStatus.GONE, "이미 탈퇴한 회원입니다."),
    MEMBER_SUSPENDED(HttpStatus.FORBIDDEN, "제재된 회원입니다."),
    INVALID_SUSPEND_UNTIL(HttpStatus.BAD_REQUEST, "제재 만료 시각이 유효하지 않습니다."),
    NICKNAME_DUPLICATE(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    NICKNAME_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "닉네임 생성에 실패했습니다."),

    // === AI Gateway / Choice Set Generation (신규: Sub-plan 1) ===
    AI_SERVER_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버에 연결할 수 없습니다."),
    AI_FALLBACK_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버와 대체 경로 모두 실패했습니다."),
    AI_RESPONSE_PARSE_FAILED(HttpStatus.BAD_GATEWAY, "AI 응답을 해석할 수 없습니다."),
    AI_STRUCTURED_SCHEMA_VIOLATION(HttpStatus.BAD_GATEWAY, "AI가 스키마에 맞지 않는 응답을 반환했습니다."),

    CHOICE_SET_GENERATION_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "선택지 세트 생성에 실패했습니다. 다시 시도해주세요."),
    CHOICE_SET_VALIDATION_NO_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 없습니다."),
    CHOICE_SET_VALIDATION_MULTIPLE_CORRECT(HttpStatus.UNPROCESSABLE_ENTITY, "생성된 선택지 중 정답이 여러 개입니다."),
    CHOICE_SET_NOT_FOUND(HttpStatus.NOT_FOUND, "선택지 세트를 찾을 수 없습니다."),
    CHOICE_SET_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 선택지를 찾을 수 없습니다."),
    CHOICE_SET_POLICY_NOT_IMPLEMENTED(HttpStatus.NOT_IMPLEMENTED, "해당 선택지 정책은 아직 지원되지 않습니다."),

    // === Sandbox Validation (신규: Sub-plan 1) ===
    SANDBOX_SETUP_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "샌드박스 환경 구성에 실패했습니다."),
    SANDBOX_ANSWER_SQL_FAILED(HttpStatus.UNPROCESSABLE_ENTITY, "기준 정답 SQL 실행에 실패했습니다."),

    // === Quiz Session (신규: Sub-plan 1) ===
    QUIZ_SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "퀴즈 세션을 찾을 수 없습니다."),
    QUIZ_SESSION_ALREADY_COMPLETED(HttpStatus.CONFLICT, "이미 완료된 세션입니다."),
    QUIZ_SESSION_INDEX_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "잘못된 문제 인덱스입니다."),
    QUIZ_SESSION_CHOICE_SET_MISMATCH(HttpStatus.BAD_REQUEST, "제출한 선택지 세트가 현재 세션과 일치하지 않습니다."),
    QUIZ_SESSION_INSUFFICIENT_QUESTIONS(HttpStatus.UNPROCESSABLE_ENTITY, "세션을 생성할 문제가 부족합니다."),

    // Admin Question Delete
    QUESTION_IN_ACTIVE_SESSION(HttpStatus.CONFLICT, "진행중인 퀴즈 세션에서 사용 중인 문제는 삭제할 수 없습니다."),

    // === Admin Question Generation (신규: Sub-plan 1) ===
    QUESTION_GENERATE_INPUT_INVALID(HttpStatus.BAD_REQUEST, "문제 생성 입력값이 올바르지 않습니다."),

    // === Import/Export ===
    IMPORT_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "한 번에 최대 100건까지 가져올 수 있습니다."),
    EXPORT_NO_DATA(HttpStatus.NOT_FOUND, "내보낼 문제가 없습니다.");

    private final HttpStatus status;
    private final String message;
}
