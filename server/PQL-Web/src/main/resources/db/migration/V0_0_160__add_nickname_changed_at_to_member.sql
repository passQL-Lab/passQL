ALTER TABLE member
  ADD COLUMN nickname_changed_at DATETIME(6) NULL
  COMMENT '마지막 닉네임 직접 변경 시각 (NULL이면 자동생성 상태, 변경 후 3일 쿨다운)';
