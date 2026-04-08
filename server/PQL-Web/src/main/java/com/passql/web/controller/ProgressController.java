package com.passql.web.controller;

import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController implements ProgressControllerDocs {

    private final ProgressService progressService;

    @GetMapping
    public ResponseEntity<ProgressResponse> getProgress(
        @RequestParam UUID memberUuid
    ) {
        return ResponseEntity.ok(progressService.getProgress(memberUuid));
    }
}
