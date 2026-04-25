ALTER TABLE member
  ADD COLUMN IF NOT EXISTS nickname_changed_at TIMESTAMP(6) NULL;

COMMENT ON COLUMN member.nickname_changed_at IS '마지막 닉네임 직접 변경 시각 (NULL이면 자동생성 상태, 변경 후 3일 쿨다운)';
