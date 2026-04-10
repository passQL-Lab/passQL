package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.question.dto.ExecuteResult;
import com.passql.question.dto.QuestionDetail;
import com.passql.question.dto.QuestionSummary;
import com.passql.question.dto.RecommendationsResponse;
import com.passql.question.dto.SubmitRequest;
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
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Entity UUID 통일 재작성: questionUuid/topicUuid 기반으로 응답 전환 (Long id → UUID)"),
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
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "HomeService Facade 로 이동 (Controller 직접 의존 제거, 응답 스키마 동일)"),
  })
  @Operation(summary = "오늘의 문제 조회",
      description = "오늘의 데일리 챌린지 문제를 반환. 큐레이션 행(daily_challenge)이 있으면 그 문제, 없으면 활성 문제 풀에서 날짜 시드 기반 결정적 폴백. " +
          "memberUuid 가 주어지면 오늘(00:00~24:00) 해당 문제 제출 여부를 alreadySolvedToday 로 함께 반환. " +
          "활성 문제가 0개면 { question: null, alreadySolvedToday: false }.")
  ResponseEntity<TodayQuestionResponse> getToday(
      @RequestParam(required = false) UUID memberUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 6, description = "추천 문제 조회 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "네이티브 쿼리를 exclude 유무 기준 2분기로 분리하여 UUID 바인딩 타입 안전성 확보"),
  })
  @Operation(summary = "추천 문제 조회 (랜덤 활성 문제)",
      description = "활성 문제 풀에서 랜덤 N개 반환. size 기본 3, 최대 5 (초과 시 5로 clamp, 1 미만은 1). " +
          "excludeQuestionUuid 미지정 시 오늘의 데일리 챌린지 문제를 자동 제외. " +
          "활성 문제가 size 보다 적으면 가능한 만큼만 반환. 캐싱 없음 (매 호출 새로 섞임).")
  ResponseEntity<RecommendationsResponse> getRecommendations(
      @RequestParam(defaultValue = "3") int size,
      @RequestParam(required = false) UUID excludeQuestionUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 상세 조회 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "PathVariable: Long id → UUID questionUuid. 응답 DTO(topicName/subtopicName) UUID 기반으로 변경"),
  })
  @Operation(summary = "문제 상세 조회")
  ResponseEntity<QuestionDetail> getQuestion(@PathVariable UUID questionUuid);

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "SQL 실행(테스트) API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "PathVariable: Long id → UUID questionUuid"),
  })
  @Operation(summary = "SQL 실행 (테스트)")
  ResponseEntity<ExecuteResult> executeChoice(
      @PathVariable UUID questionUuid,
      @RequestBody Map<String, String> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 제출 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "PathVariable: Long id → UUID questionUuid. Header: X-User-UUID(String) → X-Member-UUID(UUID). Body: selectedKey → selectedChoiceKey (구 selectedKey 한시적 fallback 지원)"),
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 57, description = "Request Body를 Map → SubmitRequest DTO로 변경하여 Swagger 스키마 정확도 개선"),
  })
  @Operation(summary = "문제 제출",
      description = "선택지 제출 후 정답 여부 반환. 헤더 X-Member-UUID(UUID) 필수. " +
          "Body: { \"selectedChoiceKey\": \"A\" }")
  ResponseEntity<SubmitResult> submit(
      @PathVariable UUID questionUuid,
      @RequestHeader(value = "X-Member-UUID") UUID memberUuid,
      @RequestBody SubmitRequest request
  );
}
