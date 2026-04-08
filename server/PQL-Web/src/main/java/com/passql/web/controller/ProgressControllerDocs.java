package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.submission.dto.ProgressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@Tag(name = "Progress", description = "학습 진도 조회")
public interface ProgressControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 4, description = "진도 요약 조회 API"),
  })
  @Operation(summary = "진도 요약 조회")
  ResponseEntity<ProgressResponse> getProgress(
      @RequestParam UUID memberUuid
  );
}
