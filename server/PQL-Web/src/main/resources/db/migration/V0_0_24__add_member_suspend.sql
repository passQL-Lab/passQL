-- =============================================================================
-- V0_0_24: 회원 제재 기능 스키마 추가
-- member 테이블에 suspend_until 컬럼 추가
-- member_suspend_history 테이블 신규 생성
-- =============================================================================

ALTER TABLE member
    ADD COLUMN suspend_until DATETIME(6) NULL COMMENT '제재 만료 시각 (NULL = 제재 없음 또는 영구 제재)';

CREATE TABLE IF NOT EXISTS member_suspend_history (
    member_suspend_history_uuid CHAR(36)     NOT NULL,
    member_uuid                 CHAR(36)     NOT NULL,
    action                      VARCHAR(20)  NOT NULL COMMENT 'SUSPENDED | UNSUSPENDED',
    reason                      VARCHAR(500) NULL,
    suspend_until               DATETIME(6)  NULL     COMMENT '제재 시 설정된 만료 시각',
    acted_at                    DATETIME(6)  NOT NULL,
    created_at                  DATETIME(6)  NULL,
    updated_at                  DATETIME(6)  NULL,
    created_by                  VARCHAR(255) NULL,
    updated_by                  VARCHAR(255) NULL,
    PRIMARY KEY (member_suspend_history_uuid),
    INDEX idx_suspend_history_member (member_uuid)
) COMMENT = '회원 제재/해제 이력';
