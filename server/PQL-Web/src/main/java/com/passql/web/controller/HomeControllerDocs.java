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
        @ApiLog(date = "2026.04.10", author = Author.SUHSAECHAN, issueNumber = 53, description = "Greeting 응답 스키마 변경: nickname 분리, 이모지 제거, messageType 추가, D-day 구간에 일반 메시지 가중치 혼합, 회원 조회 실패 fallback"),
    })
    @Operation(
        summary = "홈 화면 인사 메시지 조회",
        description = """
            ## 인증(JWT): **불필요**

            ## 요청 파라미터
            - **`memberUuid`** (optional): 회원 UUID. null이거나 존재하지 않으면 '회원' 닉네임으로 폴백한다.

            ## 반환값 (GreetingResponse)
            - **`nickname`**: 회원 닉네임. 조회 실패/비로그인/닉네임 공백 시 `"회원"`.
            - **`message`**: 인사 메시지 템플릿. `{nickname}` 플레이스홀더를 포함하므로 프론트에서 치환해 렌더링한다. 이모지는 포함되지 않는다.
            - **`messageType`**: `GENERAL` / `COUNTDOWN` / `URGENT` / `EXAM_DAY` 중 하나. 프론트는 이 값으로 아이콘/톤을 분기할 수 있다.

            ## 메시지 선택 규칙
            - 선택된 시험 일정이 없거나 D-30 초과 / 시험 종료 → `GENERAL`
            - D-8 ~ D-30 → `COUNTDOWN` (카운트다운 40% / 일반 60% 혼합)
            - D-4 ~ D-7 → `URGENT` (긴급 50% / 일반 50% 혼합)
            - D-1 ~ D-3 → `URGENT` (긴급 70% / 일반 30% 혼합)
            - D-0 (시험 당일) → `EXAM_DAY` (100%)
            """
    )
    ResponseEntity<GreetingResponse> getGreeting(@RequestParam UUID memberUuid);
}
