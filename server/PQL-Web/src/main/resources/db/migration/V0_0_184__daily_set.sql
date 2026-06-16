-- ===================================================================
-- V0_0_184: 데일리 세트(daily set) 스키마
--   - daily_challenge: 날짜 단독 유니크 제거 → (date, sort_order) 복합 유니크
--   - daily_set_submission: 세트 완료 집계 테이블 신규
--
-- 주의: 본 프로젝트 DB는 PostgreSQL. MySQL 방언(DROP INDEX/AFTER/DATETIME/
--       CHAR(36) UUID, ADD CONSTRAINT IF NOT EXISTS) 사용 금지.
--       uuid 컬럼은 V0_0_70에서 네이티브 uuid로 통일됨 → UUID 타입 사용.
-- ===================================================================

-- -------------------------------------------------------------------
-- daily_challenge: 날짜 단독 유니크 제약 제거
--   uk_daily_challenge_date 는 UNIQUE "제약조건"이므로 DROP CONSTRAINT 사용
--   (DROP INDEX 대상이 아님)
-- -------------------------------------------------------------------
ALTER TABLE daily_challenge DROP CONSTRAINT IF EXISTS uk_daily_challenge_date;

-- 정렬 순서 컬럼 추가 (PostgreSQL은 AFTER 미지원 → 항상 테이블 끝에 추가됨)
ALTER TABLE daily_challenge ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- (challenge_date, sort_order) 복합 유니크 제약 추가
--   PostgreSQL은 ADD CONSTRAINT IF NOT EXISTS 미지원 → DO 블록으로 멱등 처리
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uk_daily_challenge_date_order'
  ) THEN
    ALTER TABLE daily_challenge
      ADD CONSTRAINT uk_daily_challenge_date_order UNIQUE (challenge_date, sort_order);
  END IF;
END $$;

-- -------------------------------------------------------------------
-- daily_set_submission: 세트 완료 집계 테이블
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_set_submission (
  daily_set_submission_uuid  UUID         NOT NULL,
  member_uuid                UUID         NOT NULL,
  challenge_date             DATE         NOT NULL,
  correct_count              INT          NOT NULL,
  completed_at               TIMESTAMP(6) NOT NULL,
  created_at                 TIMESTAMP(6) NOT NULL,
  updated_at                 TIMESTAMP(6) NOT NULL,
  created_by                 VARCHAR(255),
  updated_by                 VARCHAR(255),
  PRIMARY KEY (daily_set_submission_uuid),
  CONSTRAINT uk_daily_set_submission_member_date UNIQUE (member_uuid, challenge_date)
);

-- 날짜별 점수 정렬 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_set_submission_date_score
  ON daily_set_submission (challenge_date, correct_count DESC);
