package com.passql.common.exception.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 메시지 구성 요소들을 정의하는 클래스
 */
public class ErrorMessageTemplate {

    /**
     * 메시지의 주체(명사) 정의
     */
    @Getter
    @AllArgsConstructor
    public enum Subject {
        USER("사용자"),
        AUTH("인증"),
        QUESTION("문제"),
        SANDBOX("샌드박스"),
        SETTING("설정"),
        PROMPT("프롬프트"),
        TOPIC("토픽"),
        ;

        private final String value;
    }

    /**
     * 메시지의 결과 상태 정의
     */
    @Getter
    @AllArgsConstructor
    public enum BusinessStatus {
        SUCCESS("성공", HttpStatus.OK),
        FAIL("실패", HttpStatus.BAD_REQUEST),
        NOT_FOUND("찾을 수 없음", HttpStatus.NOT_FOUND),
        DUPLICATE("중복", HttpStatus.CONFLICT),
        INVALID("유효하지 않음", HttpStatus.BAD_REQUEST),
        EXPIRED("만료됨", HttpStatus.UNAUTHORIZED),
        DENIED("거부됨", HttpStatus.FORBIDDEN),
        UNAUTHORIZED("인증되지 않음", HttpStatus.UNAUTHORIZED),
        FORBIDDEN("접근 권한 없음", HttpStatus.FORBIDDEN),
        ALREADY_EXISTS("이미 존재함", HttpStatus.CONFLICT),
        DISABLED("비활성화됨", HttpStatus.FORBIDDEN),
        ;

        private final String value;
        private final HttpStatus httpStatus;
    }
}
