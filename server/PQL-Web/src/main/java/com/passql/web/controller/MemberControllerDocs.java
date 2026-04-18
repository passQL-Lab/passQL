package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@Tag(name = "Member", description = "회원 조회 / 닉네임 재생성")
public interface MemberControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 6, description = "본인 정보 조회 API 추가"),
  })
  @Operation(
      summary = "본인 정보 조회",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`memberUuid`**: 회원 UUID (query param)

          ## 반환값 (MemberMeResponse)
          - 회원 정보 전체

          ## 설명
          - memberUuid로 본인 정보를 조회한다.
          - last_seen_at을 throttled 방식으로 갱신한다.
          """
  )
  MemberMeResponse getMe(@RequestParam("memberUuid") UUID memberUuid);

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 6, description = "닉네임 재생성 API 추가"),
  })
  @Operation(
      summary = "닉네임 재생성",
      description = """
          ## 인증(JWT): **불필요**

          ## 요청 파라미터
          - **`memberUuid`**: 회원 UUID (query param)

          ## 반환값 (NicknameRegenerateResponse)
          - **`nickname`**: 새로 발급된 닉네임

          ## 설명
          - 본인 닉네임을 새로 발급한다.
          """
  )
  NicknameRegenerateResponse regenerateNickname(@RequestParam("memberUuid") UUID memberUuid);
}
