package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;

@Tag(name = "Member", description = "회원 조회 / 닉네임 재생성")
public interface MemberControllerDocs {

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 6, description = "본인 정보 조회 API 추가"),
      @ApiLog(date = "2026.04.18", author = Author.SUHSAECHAN, issueNumber = 271, description = "memberUuid 쿼리 파라미터 → @AuthMember 토큰 기반으로 전환"),
  })
  @Operation(
      summary = "본인 정보 조회",
      description = """
          ## 인증(JWT): **필요**

          ## 요청 헤더
          - **`Authorization`**: Bearer {accessToken}

          ## 반환값 (MemberMeResponse)
          - 회원 정보 전체

          ## 설명
          - JWT AccessToken에서 회원 UUID를 추출하여 본인 정보를 조회한다.
          - last_seen_at을 throttled 방식으로 갱신한다.
          """
  )
  MemberMeResponse getMe(@AuthMember LoginMember loginMember);

  @ApiLogs({
      @ApiLog(date = "2026.04.07", author = Author.SUHSAECHAN, issueNumber = 6, description = "닉네임 재생성 API 추가"),
      @ApiLog(date = "2026.04.18", author = Author.SUHSAECHAN, issueNumber = 271, description = "memberUuid 쿼리 파라미터 → @AuthMember 토큰 기반으로 전환"),
  })
  @Operation(
      summary = "닉네임 재생성",
      description = """
          ## 인증(JWT): **필요**

          ## 요청 헤더
          - **`Authorization`**: Bearer {accessToken}

          ## 반환값 (NicknameRegenerateResponse)
          - **`nickname`**: 새로 발급된 닉네임

          ## 설명
          - JWT AccessToken에서 회원 UUID를 추출하여 본인 닉네임을 재발급한다.
          """
  )
  NicknameRegenerateResponse regenerateNickname(@AuthMember LoginMember loginMember);
}
