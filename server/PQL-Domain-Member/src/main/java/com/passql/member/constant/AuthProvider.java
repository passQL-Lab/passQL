package com.passql.member.constant;

/**
 * 인증 제공자.
 *
 * <p>D2 단계에서는 {@link #ANONYMOUS}만 사용한다. 향후 OAuth 연동 시 나머지 값이 활성화된다.
 */
public enum AuthProvider {

    ANONYMOUS,
    GOOGLE,
    KAKAO,
    NAVER,
    APPLE,
    GITHUB
}
