package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.web.dto.report.ReportRequest;
import com.passql.web.dto.report.ReportStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@Tag(name = "QuestionReport", description = "문제 신고 제출 / 신고 여부 조회")
public interface QuestionReportControllerDocs {

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 34, description = "문제 신고 제출 API 추가"),
    })
    @Operation(
        summary = "문제 신고 제출",
        description = """
            ## 인증(JWT): **불필요**

            ## 경로 변수
            - **`questionUuid`**: 신고할 문제 UUID

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 요청 바디 (ReportRequest)
            - **`submissionUuid`**: 제출 UUID (필수)
            - **`choiceSetUuid`**: 선택지 세트 UUID (선택, 선택지 오류 신고 시 권장)
            - **`categories`**: 신고 카테고리 목록 (필수, 1개 이상)
              - WRONG_ANSWER / WEIRD_QUESTION / WEIRD_CHOICES / WEIRD_EXECUTION / ETC
            - **`detail`**: 상세 설명 (ETC 카테고리 선택 시 필수)

            ## 에러
            - 400: categories가 비어 있거나, ETC 선택 시 detail이 없거나, submissionUuid 없음
            - 409: 이미 해당 submissionUuid로 신고한 경우
            """
    )
    void submitReport(
        @PathVariable UUID questionUuid,
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestBody ReportRequest request
    );

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 34, description = "신고 여부 조회 API 추가"),
    })
    @Operation(
        summary = "신고 여부 조회",
        description = """
            ## 인증(JWT): **불필요**

            ## 경로 변수
            - **`questionUuid`**: 문제 UUID

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 쿼리 파라미터
            - **`submissionUuid`**: 제출 UUID (필수)

            ## 반환값 (ReportStatusResponse)
            - **`reported`**: 이미 신고했으면 true, 아니면 false
            """
    )
    ReportStatusResponse getReportStatus(
        @PathVariable UUID questionUuid,
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestParam UUID submissionUuid
    );
}
