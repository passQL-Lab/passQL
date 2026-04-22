package com.passql.web.controller;

import com.passql.ai.dto.AiResult;
import com.passql.ai.dto.SimilarQuestion;
import com.passql.common.dto.Author;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "AI", description = "AI 해설 / 유사 문제 조회")
public interface AiControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 에러 AI 해설 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Header: X-User-UUID(String) → X-Member-UUID(UUID). Body 내 questionId(Long) → questionUuid(UUID)"),
      @ApiLog(date = "2026.04.19", author = Author.SUHSAECHAN, issueNumber = 120, description = "X-Member-UUID 헤더 → @AuthMember JWT 인증 전환"),
  })
  @Operation(summary = "SQL 에러 해설")
  ResponseEntity<AiResult> explainError(
      @AuthMember LoginMember loginMember,
      @RequestBody Map<String, Object> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 차이 AI 해설 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Header: X-User-UUID(String) → X-Member-UUID(UUID)"),
      @ApiLog(date = "2026.04.19", author = Author.SUHSAECHAN, issueNumber = 120, description = "X-Member-UUID 헤더 → @AuthMember JWT 인증 전환"),
  })
  @Operation(summary = "SQL 차이 해설")
  ResponseEntity<AiResult> diffExplain(
      @AuthMember LoginMember loginMember,
      @RequestBody Map<String, Object> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "유사 문제 조회 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "PathVariable: Long id → UUID questionUuid. 응답 DTO SimilarQuestion{questionUuid, stem, topicName, score}"),
  })
  @Operation(summary = "유사 문제 조회")
  ResponseEntity<List<SimilarQuestion>> getSimilar(
      @PathVariable UUID questionUuid,
      @RequestParam(defaultValue = "5") int k
  );
}
