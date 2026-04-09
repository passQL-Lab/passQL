package com.passql.web.controller;

import com.passql.application.dto.GreetingResponse;
import com.passql.common.dto.Author;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@Tag(name = "Home", description = "홈 화면")
public interface HomeControllerDocs {

    @ApiLogs({
        @ApiLog(date = "2026.04.09", author = Author.SUHSAECHAN, issueNumber = 39, description = "홈 화면 인사 메시지 조회 API 추가"),
    })
    @Operation(
        summary = "홈 화면 인사 메시지 조회",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 파라미터
            - **`memberUuid`** (required): 회원 UUID

            ## 반환값 (GreetingResponse)
            - **`message`**: 인사 메시지 문자열
            - 선택된 시험 일정이 있으면 D-day 포함 메시지 반환
            - 선택된 일정이 없으면 기본 인사 메시지 반환
            """
    )
    ResponseEntity<GreetingResponse> getGreeting(@RequestParam UUID memberUuid);
}
