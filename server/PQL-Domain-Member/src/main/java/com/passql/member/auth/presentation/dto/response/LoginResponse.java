package com.passql.member.auth.presentation.dto.response;

import com.passql.member.auth.application.dto.result.LoginResult;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        boolean isNewMember,
        UUID memberUuid,
        String nickname
) {
    public static LoginResponse from(LoginResult result) {
        return new LoginResponse(
                result.tokens().accessToken(),
                result.tokens().refreshToken(),
                result.isNewMember(),
                result.member().getMemberUuid(),
                result.member().getNickname()
        );
    }
}
