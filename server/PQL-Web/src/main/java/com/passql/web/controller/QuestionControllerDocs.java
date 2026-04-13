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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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
      @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 63, description = "memberUuid 파라미터 추가 — RAG 기반 개인화 추천 도입, RecommendationService 위임, 오답 없거나 AI 실패 시 RANDOM fallback"),
  })
  @Operation(summary = "추천 문제 조회",
      description = "memberUuid 있으면 RAG 기반 개인화 추천(최근 오답 벡터 평균 → Qdrant 유사도 검색). " +
          "없거나 오답 기록 없으면 활성 문제 풀에서 RANDOM 추천. " +
          "size 기본 3, 최대 5. excludeQuestionUuid 미지정 시 오늘의 데일리 챌린지 자동 제외.")
  ResponseEntity<RecommendationsResponse> getRecommendations(
      @RequestParam(defaultValue = "3") int size,
      @RequestParam(required = false) UUID excludeQuestionUuid,
      @RequestParam(required = false) UUID memberUuid
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
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 70, description = "QuestionExecutionService 경유로 전환: sandboxDbName 기반 실행, CONCEPT_ONLY 에러 처리 추가"),
  })
  @Operation(summary = "SQL 실행",
      description = "EXECUTABLE 문제만 허용. body: { \"sql\": \"SELECT ...\" }. " +
          "CONCEPT_ONLY 문제에 호출 시 400 INVALID_EXECUTION_MODE 반환.")
  ResponseEntity<ExecuteResult> executeChoice(
      @PathVariable UUID questionUuid,
      @RequestBody Map<String, String> body
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 69,
              description = "SSE 선택지 생성 엔드포인트 추가")
  })
  @Operation(summary = "AI 선택지 세트 생성 (SSE)",
      description = "AI가 4지선다 선택지를 실시간 생성. SSE 이벤트: status(generating/validating), complete(choiceSetId+choices), error. " +
          "생성된 세트는 DB에 저장되어 관리자 화면에서 조회 가능. 헤더 X-Member-UUID(UUID) 필수.")
  SseEmitter generateChoices(
      @PathVariable UUID questionUuid,
      @RequestHeader(value = "X-Member-UUID") UUID memberUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 1, description = "문제 제출 API 추가"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "PathVariable: Long id → UUID questionUuid. Header: X-User-UUID(String) → X-Member-UUID(UUID). Body: selectedKey → selectedChoiceKey (구 selectedKey 한시적 fallback 지원)"),
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 57, description = "Request Body를 Map → SubmitRequest DTO로 변경하여 Swagger 스키마 정확도 개선"),
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 69,
              description = "SubmitRequest에 choiceSetId 추가, SubmitResult에 ExecuteResult 비교 필드(selectedResult/correctResult/correctSql/selectedSql) 추가"),
  })
  @Operation(summary = "문제 제출",
      description = "선택지 제출 후 정답 여부 + SQL 실행 결과 비교 반환. 헤더 X-Member-UUID(UUID) 필수. " +
          "Body: { \"choiceSetId\": \"uuid\", \"selectedChoiceKey\": \"A\" }. " +
          "EXECUTABLE 문제: selectedResult/correctResult에 양쪽 SQL 실행 결과 포함. CONCEPT_ONLY: null.")
  ResponseEntity<SubmitResult> submit(
      @PathVariable UUID questionUuid,
      @RequestHeader(value = "X-Member-UUID") UUID memberUuid,
      @RequestBody SubmitRequest request
  );
}
