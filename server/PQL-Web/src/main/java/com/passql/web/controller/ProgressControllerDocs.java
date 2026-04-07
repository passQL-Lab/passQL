package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.submission.dto.HeatmapEntry;
import com.passql.submission.dto.ProgressSummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

@Tag(name = "Progress", description = "학습 진도 조회")
public interface ProgressControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "진도 요약 조회 API 추가"),
  })
  @Operation(
      summary = "진도 요약 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 헤더
          - **`X-User-UUID`**: 회원 UUID

          ## 반환값 (ProgressSummary)
          - 총 제출 수, 정답 수, 정답률, 난이도별 통계 등
          """
  )
  ResponseEntity<ProgressSummary> getSummary(
      @RequestHeader(value = "X-User-UUID") String userUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "히트맵 조회 API 추가"),
  })
  @Operation(
      summary = "히트맵 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 헤더
          - **`X-User-UUID`**: 회원 UUID

          ## 반환값 (List<HeatmapEntry>)
          - 날짜별 제출 횟수 (GitHub 잔디 형태)
          """
  )
  ResponseEntity<List<HeatmapEntry>> getHeatmap(
      @RequestHeader(value = "X-User-UUID") String userUuid
  );
}
