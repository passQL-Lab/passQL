package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Tag(name = "Meta", description = "주제 트리 / 개념 태그 조회")
public interface MetaControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "주제 트리 조회 API 추가"),
  })
  @Operation(
      summary = "주제 트리 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - 없음

          ## 반환값 (List<TopicTree>)
          - topic > subtopic 계층 구조의 전체 트리
          """
  )
  ResponseEntity<List<TopicTree>> getTopics();

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "활성 태그 조회 API 추가"),
  })
  @Operation(
      summary = "활성 태그 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - 없음

          ## 반환값 (List<ConceptTag>)
          - 활성화된 개념 태그 전체 목록
          """
  )
  ResponseEntity<List<ConceptTag>> getTags();
}
