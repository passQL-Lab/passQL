package com.passql.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NicknameChangeRequest(
    @NotBlank
    @Size(min = 2, max = 10, message = "한글, 영문, 숫자만 사용 가능해요 (2~10자)")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,10}$", message = "한글, 영문, 숫자만 사용 가능해요 (2~10자)")
    String nickname
) {
}
