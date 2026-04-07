package com.passql.member.constant;

/**
 * 회원 권한.
 *
 * <p>Spring Security 도입 시 {@link #getAuthority()}를 통해 GrantedAuthority 변환에 사용한다.
 */
public enum MemberRole {

    USER,           // 일반 사용자
    TEST,           // 테스트 계정 (집계/통계 분리 가능, is_test_account와 함께 사용)
    ADMIN,          // 관리자
    SUPER_ADMIN;    // 슈퍼 관리자 (시스템 설정 변경 권한)

    /**
     * Spring Security GrantedAuthority 표준 형식.
     * TEST는 권한상 USER와 동일하게 취급(집계 분리는 is_test_account 플래그로).
     */
    public String getAuthority() {
        if (this == TEST) {
            return "ROLE_USER";
        }
        return "ROLE_" + name();
    }

    public boolean isAdmin() {
        return this == ADMIN || this == SUPER_ADMIN;
    }
}
