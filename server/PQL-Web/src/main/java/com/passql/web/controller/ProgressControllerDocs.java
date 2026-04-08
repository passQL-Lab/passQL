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
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Submission PK 를 UUID 로 재작성. memberUuid(UUID) 기준 집계. 응답 DTO: ProgressResponse{solvedCount, correctRate(0.0~1.0 둘째자리 반올림), streakDays(하루 그레이스)}"),
  })
  @Operation(
      summary = "진도 요약 조회",
      description = """
          ## 인증(JWT): **불필요** (추후 헤더 전환 예정)

          ## 요청 파라미터
          - memberUuid (UUID, required): 회원 식별자

          ## 반환값 (ProgressResponse)
          - solvedCount: 푼 문제 수 (distinct questionUuid 기준)
          - correctRate: 정답률 (0.0~1.0, 마지막 시도 기준, 소수 둘째자리 반올림)
          - streakDays: 연속 학습 일수 (하루 그레이스 — 오늘 미제출이어도 어제까지 연속이면 유지)
          - 제출 이력 0건이면 {0, 0.0, 0}
          """
  )
  ResponseEntity<ProgressResponse> getProgress(
      @RequestParam UUID memberUuid
  );
}
