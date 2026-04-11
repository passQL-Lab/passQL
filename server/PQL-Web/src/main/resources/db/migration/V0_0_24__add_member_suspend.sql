-- =============================================================================
-- V0_0_24: 회원 제재 기능 스키마 추가
-- member 테이블에 suspend_until 컬럼 추가
-- member_suspend_history 테이블 신규 생성
-- =============================================================================

ALTER TABLE member
    ADD COLUMN IF NOT EXISTS suspend_until TIMESTAMP(6) NULL;

CREATE TABLE IF NOT EXISTS member_suspend_history (
    member_suspend_history_uuid UUID     NOT NULL,
    member_uuid                 UUID     NOT NULL,
    action                      VARCHAR(20)  NOT NULL,
    reason                      VARCHAR(500) NULL,
    suspend_until               TIMESTAMP(6) NULL,
    acted_at                    TIMESTAMP(6) NOT NULL,
    created_at                  TIMESTAMP(6) NULL,
    updated_at                  TIMESTAMP(6) NULL,
    created_by                  VARCHAR(255) NULL,
    updated_by                  VARCHAR(255) NULL,
    PRIMARY KEY (member_suspend_history_uuid)
);

CREATE INDEX IF NOT EXISTS idx_suspend_history_member ON member_suspend_history (member_uuid);
