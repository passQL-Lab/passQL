package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.SubmitResult;
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

@Tag(name = "Question", description = "문제 조회 / SQL 실행 / 제출")
public interface QuestionControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 목록 조회 API 추가"),
  })
  @Operation(
      summary = "문제 목록 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`topic`**: 주제 필터 (optional)
          - **`subtopic`**: 세부 주제 필터 (optional)
          - **`difficulty`**: 난이도 필터 (optional)
          - **`mode`**: 모드 필터 (optional)
          - Pageable 파라미터 (page, size, sort)

          ## 반환값 (Page<QuestionSummary>)
          - 페이징된 문제 요약 목록
          """
  )
  ResponseEntity<Page<QuestionSummary>> getQuestions(
      @RequestParam(required = false) String topic,
      @RequestParam(required = false) String subtopic,
      @RequestParam(required = false) Integer difficulty,
      @RequestParam(required = false) String mode,
      Pageable pageable
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 상세 조회 API 추가"),
  })
  @Operation(
      summary = "문제 상세 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`id`**: 문제 ID (path variable)

          ## 반환값 (QuestionDetail)
          - 문제 상세 정보 (본문, 선택지, 스키마 등)
          """
  )
  ResponseEntity<QuestionDetail> getQuestion(@PathVariable Long id);

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 실행(테스트) API 추가"),
  })
  @Operation(
      summary = "SQL 실행 (테스트)",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`id`**: 문제 ID (path variable)

          ## 요청 바디
          - **`sql`**: 실행할 SQL (String)

          ## 반환값 (ExecuteResult)
          - SQL 실행 결과 (컬럼, 행 데이터)
          - 제출이 아닌 테스트 실행이므로 채점하지 않음
          """
  )
  ResponseEntity<ExecuteResult> executeChoice(
      @PathVariable Long id,
      @RequestBody Map<String, String> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 제출 API 추가"),
  })
  @Operation(
      summary = "문제 제출",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 헤더
          - **`X-User-UUID`**: 회원 UUID

          ## 요청 파라미터
          - **`id`**: 문제 ID (path variable)

          ## 요청 바디
          - **`selectedKey`**: 선택한 선택지 키 (String)

          ## 반환값 (SubmitResult)
          - 정답 여부, 정답 선택지, AI 해설 여부 등
          """
  )
  ResponseEntity<SubmitResult> submit(
      @PathVariable Long id,
      @RequestHeader(value = "X-User-UUID") String userUuid,
      @RequestBody Map<String, String> body
  );
}
