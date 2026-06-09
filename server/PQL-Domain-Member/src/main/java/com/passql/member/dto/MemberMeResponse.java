package com.passql.member.dto;

import com.passql.member.constant.ChoiceGenerationMode;
import com.passql.member.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class MemberMeResponse {

    private UUID memberUuid;
    private String nickname;
    private String role;
    private String status;
    private Boolean isTestAccount;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeenAt;
    // 닉네임 쿨다운 계산 기준 — null이면 변경 이력 없음
    private LocalDateTime nicknameChangedAt;
    // 선택지 생성 모드 — PRACTICE(기본): 재사용, REAL: 항상 새로 생성
    private ChoiceGenerationMode choiceGenerationMode;

    public static MemberMeResponse from(Member m) {
        return new MemberMeResponse(
            m.getMemberUuid(),
            m.getNickname(),
            m.getRole().name(),
            m.getStatus().name(),
            m.getIsTestAccount(),
            m.getCreatedAt(),
            m.getLastSeenAt(),
            m.getNicknameChangedAt(),
            m.getChoiceGenerationMode()
        );
    }
}
