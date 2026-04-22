package com.passql.web.controller;

import com.passql.application.dto.GreetingResponse;
import com.passql.application.service.GreetingService;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController implements HomeControllerDocs {

    private final GreetingService greetingService;

    @GetMapping("/greeting")
    public ResponseEntity<GreetingResponse> getGreeting(
            @AuthMember LoginMember loginMember
    ) {
        return ResponseEntity.ok(greetingService.getGreeting(loginMember.memberUuid()));
    }
}
