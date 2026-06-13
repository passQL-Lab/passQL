-- daily_challenge: 날짜 단독 유니크 제거 → (date, sort_order) 복합 유니크
ALTER TABLE daily_challenge
  DROP INDEX IF EXISTS uk_daily_challenge_date,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0 AFTER challenge_date,
  ADD CONSTRAINT IF NOT EXISTS uk_daily_challenge_date_order UNIQUE (challenge_date, sort_order);

-- daily_set_submission: 세트 완료 집계 테이블
CREATE TABLE IF NOT EXISTS daily_set_submission (
  daily_set_submission_uuid  CHAR(36)     NOT NULL,
  member_uuid                CHAR(36)     NOT NULL,
  challenge_date             DATE         NOT NULL,
  correct_count              INT          NOT NULL,
  completed_at               DATETIME(6)  NOT NULL,
  created_at                 DATETIME(6)  NOT NULL,
  updated_at                 DATETIME(6)  NOT NULL,
  created_by                 VARCHAR(255),
  updated_by                 VARCHAR(255),
  PRIMARY KEY (daily_set_submission_uuid),
  UNIQUE KEY uk_daily_set_submission_member_date (member_uuid, challenge_date),
  INDEX idx_daily_set_submission_date_score (challenge_date, correct_count DESC)
);
