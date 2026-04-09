package com.passql.web.controller;

import com.passql.application.dto.GreetingResponse;
import com.passql.application.service.GreetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController implements HomeControllerDocs {

    private final GreetingService greetingService;

    @GetMapping("/greeting")
    public ResponseEntity<GreetingResponse> getGreeting(
            @RequestParam UUID memberUuid
    ) {
        return ResponseEntity.ok(greetingService.getGreeting(memberUuid));
    }
}
