package com.passql.member.auth.infrastructure.social.strategy;

import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.passql.common.exception.CustomException;
import com.passql.common.exception.constant.ErrorCode;
import lombok.RequiredArgsConstructor;

/** Google, Apple 등 Firebase SDK로 idToken을 검증하는 전략의 공통 추상 클래스. */
@RequiredArgsConstructor
public abstract class FirebaseLoginStrategy implements SocialLoginStrategy {

    private final FirebaseAuth firebaseAuth;

    @Override
    public String validateAndGetSocialId(String idToken) {
        try {
            FirebaseToken firebaseToken = firebaseAuth.verifyIdToken(idToken);
            return firebaseToken.getUid();
        } catch (FirebaseAuthException e) {
            AuthErrorCode errorCode = e.getAuthErrorCode();
            throw switch (errorCode) {
                case EXPIRED_ID_TOKEN -> new CustomException(ErrorCode.EXPIRED_FIREBASE_TOKEN);
                case INVALID_ID_TOKEN, REVOKED_ID_TOKEN -> new CustomException(ErrorCode.INVALID_FIREBASE_TOKEN);
                default -> new CustomException(ErrorCode.FIREBASE_SERVER_ERROR);
            };
        }
    }
}
