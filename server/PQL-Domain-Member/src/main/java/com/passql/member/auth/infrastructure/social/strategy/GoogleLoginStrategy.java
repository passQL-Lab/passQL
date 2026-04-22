package com.passql.member.auth.infrastructure.social.strategy;

import com.google.firebase.auth.FirebaseAuth;
import com.passql.member.constant.AuthProvider;
import org.springframework.stereotype.Component;

@Component
public class GoogleLoginStrategy extends FirebaseLoginStrategy {

    public GoogleLoginStrategy(FirebaseAuth firebaseAuth) {
        super(firebaseAuth);
    }

    @Override
    public AuthProvider getAuthProvider() {
        return AuthProvider.GOOGLE;
    }
}
