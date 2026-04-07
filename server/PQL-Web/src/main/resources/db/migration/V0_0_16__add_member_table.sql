-- ============================================================================
-- V0_0_16: Member 도메인 테이블 추가
-- ============================================================================

CREATE TABLE IF NOT EXISTS member (
    -- 식별 (PK는 UUID)
    member_uuid       CHAR(36)     NOT NULL,
    nickname          VARCHAR(50)  NOT NULL,

    -- 권한 / 상태
    role              VARCHAR(30)  NOT NULL DEFAULT 'USER',
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_test_account   TINYINT(1)   NOT NULL DEFAULT 0,

    -- 인증 연동 (확장 여지 — 향후 member_auth 테이블 분리 후보)
    auth_provider     VARCHAR(30)  NOT NULL DEFAULT 'ANONYMOUS',
    provider_user_id  VARCHAR(255) NULL,
    email             VARCHAR(255) NULL,
    email_verified    TINYINT(1)   NOT NULL DEFAULT 0,

    -- 라이프사이클
    withdrawn_at      DATETIME(6)  NULL,

    -- 행동 추적 (향후 member_activity 테이블 분리 후보)
    last_seen_at      DATETIME(6)  NULL,
    last_login_ip     VARCHAR(45)  NULL,

    -- 소프트 딜리트 (SoftDeletableBaseEntity)
    is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
    deleted_at        DATETIME(6)  NULL,
    deleted_by        VARCHAR(255) NULL,

    -- 감사 정보 (BaseEntity)
    created_at        DATETIME(6)  NULL,
    updated_at        DATETIME(6)  NULL,
    created_by        VARCHAR(255) NULL,
    updated_by        VARCHAR(255) NULL,

    PRIMARY KEY (member_uuid),
    CONSTRAINT uk_member_nickname UNIQUE (nickname)
);

CREATE INDEX idx_member_auth_provider ON member (auth_provider, provider_user_id);
CREATE INDEX idx_member_status        ON member (status);
CREATE INDEX idx_member_role          ON member (role);
CREATE INDEX idx_member_is_test       ON member (is_test_account);
CREATE INDEX idx_member_is_deleted    ON member (is_deleted);
