package com.passql.web.controller;

import com.passql.ai.dto.AiResult;
import com.passql.ai.dto.SimilarQuestion;
import com.passql.common.dto.Author;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Tag(name = "AI", description = "AI 해설 / 유사 문제 조회")
public interface AiControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 에러 AI 해설 API 추가"),
  })
  @Operation(
      summary = "SQL 에러 해설",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 헤더
          - **`X-User-UUID`**: 회원 UUID

          ## 요청 바디
          - **`questionId`**: 문제 ID (Long)
          - **`sql`**: 실행한 SQL (String)
          - **`errorMessage`**: 발생한 에러 메시지 (String)

          ## 반환값 (AiResult)
          - AI가 생성한 에러 해설
          """
  )
  ResponseEntity<AiResult> explainError(
      @RequestHeader(value = "X-User-UUID") String userUuid,
      @RequestBody Map<String, Object> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 차이 AI 해설 API 추가"),
  })
  @Operation(
      summary = "SQL 차이 해설",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 헤더
          - **`X-User-UUID`**: 회원 UUID

          ## 요청 바디
          - **`questionId`**: 문제 ID (Long)
          - **`selectedKey`**: 선택한 선택지 키 (String)

          ## 반환값 (AiResult)
          - 정답과 선택한 답의 차이에 대한 AI 해설
          """
  )
  ResponseEntity<AiResult> diffExplain(
      @RequestHeader(value = "X-User-UUID") String userUuid,
      @RequestBody Map<String, Object> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "유사 문제 조회 API 추가"),
  })
  @Operation(
      summary = "유사 문제 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`questionId`**: 기준 문제 ID (path variable)
          - **`k`**: 조회할 유사 문제 수 (default: 5)

          ## 반환값 (List<SimilarQuestion>)
          - 벡터 유사도 기반 유사 문제 목록
          """
  )
  ResponseEntity<List<SimilarQuestion>> getSimilar(
      @PathVariable Long questionId,
      @RequestParam(defaultValue = "5") int k
  );
}
