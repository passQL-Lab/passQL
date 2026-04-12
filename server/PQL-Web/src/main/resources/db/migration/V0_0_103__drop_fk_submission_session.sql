-- session_uuid는 AI 코멘트 세션 집계용 식별자로, quiz_session 레코드 존재를 강제할 필요 없음
-- 단독 풀이 모드에서 client가 임의 UUID를 생성해 전달하므로 FK 제약이 오히려 정상 제출을 차단함
ALTER TABLE submission DROP CONSTRAINT IF EXISTS fk_submission_session;
