package com.passql.member.auth.presentation.dto.request;

import com.passql.member.auth.application.dto.command.LoginCommand;
import com.passql.member.constant.AuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(

        @NotNull(message = "소셜 플랫폼 정보는 필수입니다.")
        AuthProvider authProvider,

        @NotBlank(message = "소셜 인증 토큰(ID Token)은 필수입니다.")
        String idToken
) {
    public LoginCommand toCommand() {
        return new LoginCommand(authProvider, idToken);
    }
}
