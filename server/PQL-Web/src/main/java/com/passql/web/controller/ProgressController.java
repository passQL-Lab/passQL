package com.passql.web.controller;

import com.passql.submission.dto.HeatmapEntry;
import com.passql.submission.dto.ProgressSummary;
import com.passql.submission.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController implements ProgressControllerDocs {

    private final ProgressService progressService;

    @GetMapping
    public ResponseEntity<ProgressSummary> getSummary(
        @RequestHeader(value = "X-User-UUID") String userUuid
    ) {
        return ResponseEntity.ok(progressService.getSummary(userUuid));
    }

    @GetMapping("/heatmap")
    public ResponseEntity<List<HeatmapEntry>> getHeatmap(
        @RequestHeader(value = "X-User-UUID") String userUuid
    ) {
        return ResponseEntity.ok(progressService.getHeatmap(userUuid));
    }
}
