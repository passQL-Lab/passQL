-- OAuth 하드리셋: ANONYMOUS 회원 및 참조 자식 데이터 순서대로 정리
-- FK 참조 테이블(NO ACTION): quiz_session, submission, execution_log, member_suspend_history

DELETE FROM member_suspend_history
WHERE member_uuid IN (SELECT member_uuid FROM member WHERE auth_provider = 'ANONYMOUS');

DELETE FROM execution_log
WHERE member_uuid IN (SELECT member_uuid FROM member WHERE auth_provider = 'ANONYMOUS');

DELETE FROM submission
WHERE member_uuid IN (SELECT member_uuid FROM member WHERE auth_provider = 'ANONYMOUS');

DELETE FROM quiz_session
WHERE member_uuid IN (SELECT member_uuid FROM member WHERE auth_provider = 'ANONYMOUS');

DELETE FROM member WHERE auth_provider = 'ANONYMOUS';
