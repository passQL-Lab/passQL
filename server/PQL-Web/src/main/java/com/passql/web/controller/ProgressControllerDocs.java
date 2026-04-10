package com.passql.web.controller;

import com.passql.ai.dto.AiCommentResponse;
import com.passql.common.dto.Author;
import com.passql.submission.dto.ProgressResponse;
import com.passql.submission.dto.TopicAnalysisResponse;
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

    @ApiLogs({
        @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 71, description = "토픽별 정답률/문제수 분석 API 추가"),
    })
    @Operation(
        summary = "토픽별 분석 조회",
        description = """
            ## 인증(JWT): **불필요** (추후 헤더 전환 예정)

            ## 요청 파라미터
            - memberUuid (UUID, required): 회원 식별자

            ## 반환값 (TopicAnalysisResponse)
            - topicStats: 토픽별 집계 목록
              - topicUuid: 토픽 식별자
              - displayName: 토픽 표시명
              - totalQuestionCount: 해당 토픽 전체 활성 문제 수 (막대그래프용)
              - correctRate: 최근 7일 정답률 (0.0~1.0, 문제별 최근 시도 기준, 레이더차트용)
              - solvedCount: 최근 7일 내 푼 문제 수
            - Submission 없는 토픽도 correctRate=0.0, solvedCount=0으로 포함
            """
    )
    ResponseEntity<TopicAnalysisResponse> getTopicAnalysis(
        @RequestParam UUID memberUuid
    );

    @ApiLogs({
        @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 71, description = "AI 영역 분석 코멘트 API 추가 (Redis 캐시 24h TTL, Submission 저장 시 evict)"),
    })
    @Operation(
        summary = "AI 영역 분석 코멘트 조회",
        description = """
            ## 인증(JWT): **불필요** (추후 헤더 전환 예정)

            ## 요청 파라미터
            - memberUuid (UUID, required): 회원 식별자

            ## 반환값 (AiCommentResponse)
            - comment: AI 생성 한국어 코멘트 (2~3문장, 약점 영역 파악 + 집중 학습 추천)
            - generatedAt: 코멘트 생성(캐시 저장) 시각

            ## 캐싱
            - Redis key: ai-comment:{memberUuid}, TTL 24시간
            - 새 Submission 저장 시 즉시 캐시 무효화 → 다음 호출 시 재생성
            - AI 호출 latency를 고려해 프론트엔드에서 비동기 로딩 권장
            """
    )
    ResponseEntity<AiCommentResponse> getAiComment(
        @RequestParam UUID memberUuid
    );
}
