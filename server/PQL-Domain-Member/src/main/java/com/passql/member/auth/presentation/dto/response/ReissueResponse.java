package com.passql.member.auth.presentation.dto.response;

import com.passql.member.auth.domain.Tokens;

public record ReissueResponse(String accessToken, String refreshToken) {

    public static ReissueResponse from(Tokens tokens) {
        return new ReissueResponse(tokens.accessToken(), tokens.refreshToken());
    }
}
