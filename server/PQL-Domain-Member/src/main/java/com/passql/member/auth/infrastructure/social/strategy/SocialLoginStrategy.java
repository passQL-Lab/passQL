package com.passql.member.auth.infrastructure.social.strategy;

import com.passql.member.constant.AuthProvider;

public interface SocialLoginStrategy {

    /** idToken(또는 accessToken)을 검증하고 provider의 고유 사용자 ID를 반환한다. */
    String validateAndGetSocialId(String idToken);

    AuthProvider getAuthProvider();
}
