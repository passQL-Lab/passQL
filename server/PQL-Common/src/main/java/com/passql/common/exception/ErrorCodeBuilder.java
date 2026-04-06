package com.passql.common.exception;

import com.passql.common.exception.constant.ErrorMessageTemplate.BusinessStatus;
import com.passql.common.exception.constant.ErrorMessageTemplate.Subject;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 동적 에러 코드 빌더 클래스 ErrorCode 열거형과 동일한 인터페이스 제공하며 Factory 기능 포함
 */
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ErrorCodeBuilder {

    private HttpStatus httpStatus;
    private String message;

    /**
     * 상태 기반 에러 코드 생성 BusinessStatus의 기본 HttpStatus를 사용
     */
    public static ErrorCodeBuilder businessStatus(Subject subject, BusinessStatus businessStatus) {
        String message = businessStatusMessage(subject, businessStatus);
        return new ErrorCodeBuilder(businessStatus.getHttpStatus(), message);
    }

    /**
     * 상태 기반 에러 코드 생성 (HttpStatus 오버라이드 버전) 명시적으로 HttpStatus를 지정하여 기본값을 오버라이드할 수 있음
     */
    public static ErrorCodeBuilder businessStatus(
        Subject subject, BusinessStatus businessStatus, HttpStatus httpStatus) {
        String message = businessStatusMessage(subject, businessStatus);
        return new ErrorCodeBuilder(httpStatus, message);
    }

    /**
     * 커스텀 에러 코드 생성
     */
    public static ErrorCodeBuilder custom(HttpStatus httpStatus, String message) {
        return new ErrorCodeBuilder(httpStatus, message);
    }

    /**
     * ErrorCode 열거형과 호환성을 위한 메서드
     *
     * @return 현재 객체 그대로 반환
     */
    public ErrorCodeBuilder getErrorCode() {
        return this;
    }

    /**
     * 상태별 메시지 생성
     *
     * @param subject        메시지 주체 (명사)
     * @param businessStatus 메시지 상태
     * @return 생성된 상태 메시지
     */
    public static String businessStatusMessage(Subject subject, BusinessStatus businessStatus) {
        switch (businessStatus) {
            case NOT_FOUND:
                return String.format("%s을(를) 찾을 수 없습니다.", subject.getValue());
            case DUPLICATE:
                return String.format("이미 존재하는 %s입니다.", subject.getValue());
            case INVALID:
                return String.format("유효하지 않은 %s입니다.", subject.getValue());
            case UNAUTHORIZED:
                return String.format("%s 인증이 필요합니다.", subject.getValue());
            case FORBIDDEN:
                return String.format("%s에 대한 접근 권한이 없습니다.", subject.getValue());
            case ALREADY_EXISTS:
                return String.format("%s이(가) 이미 존재합니다.", subject.getValue());
            case DISABLED:
                return String.format("%s이(가) 비활성화되었습니다.", subject.getValue());
            default:
                return String.format("%s이(가) %s 상태입니다.", subject.getValue(), businessStatus.getValue());
        }
    }
}
