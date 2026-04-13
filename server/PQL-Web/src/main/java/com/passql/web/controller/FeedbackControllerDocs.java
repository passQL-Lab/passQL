package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.meta.dto.FeedbackListResponse;
import com.passql.meta.dto.FeedbackSubmitRequest;
import com.passql.meta.dto.FeedbackSubmitResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@Tag(name = "Feedback", description = "건의사항 제출 / 내 건의사항 목록 조회")
public interface FeedbackControllerDocs {

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 200, description = "건의사항 제출 API 추가"),
    })
    @Operation(
        summary = "건의사항 제출",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 요청 바디 (FeedbackSubmitRequest)
            - **`content`**: 건의사항 내용 (1자 이상 500자 이하, 필수)

            ## 반환값 (FeedbackSubmitResponse)
            - **`feedbackUuid`**: 생성된 건의사항 UUID
            - **`status`**: 초기 상태 (항상 PENDING)
            - **`createdAt`**: 생성 시각

            ## 에러
            - 400: content가 비어 있거나 500자 초과
            """
    )
    FeedbackSubmitResponse submit(
        @RequestHeader("X-Member-UUID") UUID memberUuid,
        @RequestBody FeedbackSubmitRequest request
    );

    @ApiLogs({
        @ApiLog(date = "2026.04.13", author = Author.SUHSAECHAN, issueNumber = 200, description = "내 건의사항 목록 조회 API 추가"),
    })
    @Operation(
        summary = "내 건의사항 목록 조회",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 헤더
            - **`X-Member-UUID`**: 회원 UUID

            ## 반환값 (FeedbackListResponse)
            - **`items`**: 건의사항 목록 (createdAt 내림차순)
              - **`feedbackUuid`**: 건의사항 UUID
              - **`content`**: 내용
              - **`status`**: PENDING / REVIEWED / APPLIED
              - **`createdAt`**: 생성 시각

            ## 에러
            - 건의사항이 없으면 200 + { "items": [] } 반환 (404 금지)
            """
    )
    FeedbackListResponse getMyFeedbacks(
        @RequestHeader("X-Member-UUID") UUID memberUuid
    );
}
