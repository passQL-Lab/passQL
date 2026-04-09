package com.passql.member.dto;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
public class MemberSearchCondition {
    private String nickname;
    private MemberStatus status;
    private MemberRole role;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate joinedTo;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate lastSeenFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate lastSeenTo;

    private Boolean includeTest = false;
}
