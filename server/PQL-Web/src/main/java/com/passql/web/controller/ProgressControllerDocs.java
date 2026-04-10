package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.submission.dto.HeatmapResponse;
import com.passql.submission.dto.ProgressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.UUID;

@Tag(name = "Progress", description = "학습 진도 조회")
public interface ProgressControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 4, description = "진도 요약 조회 API"),
      @ApiLog(date = "2026.04.08", author = Author.SUHSAECHAN, issueNumber = 22, description = "Submission PK 를 UUID 로 재작성. memberUuid(UUID) 기준 집계. 응답 DTO: ProgressResponse{solvedCount, correctRate(0.0~1.0 둘째자리 반올림), streakDays(하루 그레이스)}"),
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 52, description = "합격 준비도(readiness) 블록 응답에 추가 — Accuracy × Coverage × Recency 3요소 곱셈 + D-day 기반 toneKey. 기존 3필드 보존."),
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
          - 제출 이력 0건이면 solvedCount=0, correctRate=0.0, streakDays=0

          ## readiness (합격 준비도 블록)
          - score: Accuracy × Coverage × Recency (0.0~1.0, 소수 둘째자리)
          - accuracy: 최근 50시도의 정답률
          - coverage: 최근 14일 내 푼 활성 토픽 수 / 활성 토픽 전체 수
          - recency: 마지막 학습일 기반 감쇠 계수 (0.70~1.00)
          - lastStudiedAt: 마지막 시도 시각 (ISO-8601), 미시도시 null
          - recentAttemptCount: 최근 50 윈도우 실제 시도 수
          - coveredTopicCount / activeTopicCount: 커버리지 분자/분모
          - daysUntilExam: 선택된 시험 일정 기준 D-day (없으면 null)
          - toneKey: 카피 톤 키 (NO_EXAM / ONBOARDING / POST_EXAM / TODAY / SPRINT / PUSH / STEADY / EARLY)
          """
  )
  ResponseEntity<ProgressResponse> getProgress(
      @RequestParam UUID memberUuid
  );

  @ApiLogs({
      @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 42, description = "날짜별 학습 기록 히트맵 API 추가 — DATE(submitted_at) 기준 GROUP BY 집계, sparse array 반환"),
  })
  @Operation(
      summary = "날짜별 학습 히트맵 조회",
      description = """
          ## 인증(JWT): **불필요** (추후 헤더 전환 예정)

          ## 요청 파라미터
          - memberUuid (UUID, required): 회원 식별자
          - from (LocalDate, optional): 조회 시작일 (기본: 30일 전)
          - to (LocalDate, optional): 조회 종료일 (기본: 오늘)

          ## 반환값 (HeatmapResponse)
          - entries: 날짜별 학습 기록 배열 (풀이 없는 날짜는 제외)
            - date: 날짜 (LocalDate)
            - solvedCount: 해당 날짜 풀이 수
            - correctCount: 해당 날짜 정답 수
          """
  )
  ResponseEntity<HeatmapResponse> getHeatmap(
      @RequestParam UUID memberUuid,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
  );
}
