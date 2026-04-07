package com.passql.member.constant;

/**
 * 회원 상태 / 라이프사이클.
 */
public enum MemberStatus {

    ACTIVE,         // 정상
    DORMANT,        // 휴면
    SUSPENDED,      // 정지 (관리자 제재)
    WITHDRAWN       // 탈퇴
}
