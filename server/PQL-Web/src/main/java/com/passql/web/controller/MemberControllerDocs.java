package com.passql.web.controller;

import com.passql.common.dto.Author;
import com.passql.member.auth.presentation.annotation.AuthMember;
import com.passql.member.auth.presentation.security.LoginMember;
import com.passql.member.dto.MemberMeResponse;
import com.passql.member.dto.NicknameChangeRequest;
import com.passql.member.dto.NicknameChangeResponse;
import com.passql.member.dto.NicknameCheckResponse;
import com.passql.member.dto.NicknameRegenerateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import kr.suhsaechan.suhapilog.annotation.ApiLog;
import kr.suhsaechan.suhapilog.annotation.ApiLogs;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Tag(name = "Member", description = "회원 조회 / 닉네임 재생성 / 닉네임 직접 변경")
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

  @ApiLogs({
      @ApiLog(date = "2026.04.25", author = Author.SUHSAECHAN, issueNumber = 287, description = "닉네임 중복 확인 API 추가"),
  })
  @Operation(
      summary = "닉네임 중복 확인",
      description = """
          ## 인증(JWT): **필요**

          ## 요청 파라미터
          - **`nickname`**: 확인할 닉네임 (한글/영문/숫자, 2~10자)

          ## 반환값 (NicknameCheckResponse)
          - **`available`**: 사용 가능 여부 (true = 사용 가능, false = 중복)

          ## 설명
          - 저장 없이 사용 가능 여부만 확인한다.
          """
  )
  NicknameCheckResponse checkNickname(@AuthMember LoginMember loginMember,
      @RequestParam @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,10}$", message = "한글, 영문, 숫자만 사용 가능해요 (2~10자)") String nickname);

  @ApiLogs({
      @ApiLog(date = "2026.04.25", author = Author.SUHSAECHAN, issueNumber = 287, description = "닉네임 직접 변경 API 추가"),
  })
  @Operation(
      summary = "닉네임 직접 변경",
      description = """
          ## 인증(JWT): **필요**

          ## 요청 바디 (NicknameChangeRequest)
          - **`nickname`**: 변경할 닉네임 (한글/영문/숫자, 2~10자)

          ## 반환값 (NicknameChangeResponse)
          - **`nickname`**: 변경된 닉네임

          ## 설명
          - 변경 후 3일간 재변경이 불가능하다 (쿨다운).
          - 중복·형식 위반·쿨다운 시 에러를 반환한다.
          """
  )
  NicknameChangeResponse changeNickname(@AuthMember LoginMember loginMember, @Valid @RequestBody NicknameChangeRequest request);
}
