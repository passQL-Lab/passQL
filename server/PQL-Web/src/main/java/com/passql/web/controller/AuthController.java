package com.passql.web.controller;

import com.passql.member.auth.application.AuthService;
import com.passql.member.auth.application.dto.result.LoginResult;
import com.passql.member.auth.domain.Tokens;
import com.passql.member.auth.presentation.dto.request.LoginRequest;
import com.passql.member.auth.presentation.dto.request.LogoutRequest;
import com.passql.member.auth.presentation.dto.request.ReissueRequest;
import com.passql.member.auth.presentation.dto.response.LoginResponse;
import com.passql.member.auth.presentation.dto.response.ReissueResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResult result = authService.login(request.toCommand());
        LoginResponse response = LoginResponse.from(result);
        return result.isNewMember()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.ok(response);
    }

    @PostMapping("/reissue")
    public ResponseEntity<ReissueResponse> reissue(@RequestBody @Valid ReissueRequest request) {
        Tokens tokens = authService.reissueTokens(request.refreshToken());
        return ResponseEntity.ok(ReissueResponse.from(tokens));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody @Valid LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }
}
