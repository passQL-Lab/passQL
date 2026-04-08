package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.dto.SubmitResult;
import com.passql.question.dto.TodayQuestionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Question", description = "문제 조회 / SQL 실행 / 제출")
public interface QuestionControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 목록 조회 API 추가"),
  })
  @Operation(summary = "문제 목록 조회")
  ResponseEntity<Page<QuestionSummary>> getQuestions(
      @RequestParam(required = false) String topic,
      @RequestParam(required = false) String subtopic,
      @RequestParam(required = false) Integer difficulty,
      @RequestParam(required = false) String mode,
      Pageable pageable
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 5, description = "오늘의 문제 조회 API 추가"),
  })
  @Operation(summary = "오늘의 문제 조회")
  ResponseEntity<TodayQuestionResponse> getToday(
      @RequestParam(required = false) UUID memberUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 6, description = "추천 문제 조회 API 추가"),
  })
  @Operation(summary = "추천 문제 조회 (랜덤 활성 문제)")
  ResponseEntity<RecommendationsResponse> getRecommendations(
      @RequestParam(defaultValue = "3") int size,
      @RequestParam(required = false) UUID excludeQuestionUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 상세 조회 API 추가"),
  })
  @Operation(summary = "문제 상세 조회")
  ResponseEntity<QuestionDetail> getQuestion(@PathVariable UUID questionUuid);

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 실행(테스트) API 추가"),
  })
  @Operation(summary = "SQL 실행 (테스트)")
  ResponseEntity<ExecuteResult> executeChoice(
      @PathVariable UUID questionUuid,
      @RequestBody Map<String, String> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 제출 API 추가"),
  })
  @Operation(summary = "문제 제출")
  ResponseEntity<SubmitResult> submit(
      @PathVariable UUID questionUuid,
      @RequestHeader(value = "X-Member-UUID") UUID memberUuid,
      @RequestBody Map<String, String> body
  );
}
