package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.meta.constant.LegalType;
import com.passql.meta.dto.LegalResponse;
import com.passql.meta.dto.TopicTree;
import com.passql.meta.entity.ConceptTag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Tag(name = "Meta", description = "주제 트리 / 개념 태그 조회")
public interface MetaControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "주제 트리 조회 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Topic/Subtopic PK 를 UUID 로 재작성. TopicTree 내부 식별자(topicUuid/subtopicUuid) UUID 기반으로 변경"),
  })
  @Operation(
      summary = "주제 트리 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - 없음

          ## 반환값 (List<TopicTree>)
          - topic > subtopic 계층 구조의 전체 트리
          - 각 노드 식별자는 UUID (topicUuid / subtopicUuid)
          """
  )
  ResponseEntity<List<TopicTree>> getTopics();

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "활성 태그 조회 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "ConceptTag PK 를 UUID(conceptTagUuid) 로 재작성. tagKey 는 unique 컬럼으로 보존"),
  })
  @Operation(
      summary = "활성 태그 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - 없음

          ## 반환값 (List<ConceptTag>)
          - 활성화된 개념 태그 전체 목록
          - 식별자는 conceptTagUuid (UUID), 비즈니스 키 tagKey 동시 노출
          """
  )
  ResponseEntity<List<ConceptTag>> getTags();

  @ApiLogs({
      @ApiLog(date = "2026.04.24", author = Author.SUHSAECHAN, issueNumber = 283, description = "공개 약관 조회 API 추가 — TERMS_OF_SERVICE / PRIVACY_POLICY"),
  })
  @Operation(
      summary = "공개 약관 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 경로 변수
          - **`type`**: TERMS_OF_SERVICE | PRIVACY_POLICY

          ## 반환값 (LegalResponse)
          - title: 약관 제목
          - content: 약관 본문 (마크다운)
          - status: PUBLISHED

          ## 에러
          - 404: 해당 type의 PUBLISHED 약관이 없는 경우
          """
  )
  ResponseEntity<LegalResponse> getLegal(@PathVariable LegalType type);
}
