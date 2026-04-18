-- OAuth 하드리셋: ANONYMOUS authProvider 데이터 정리
DELETE FROM member WHERE auth_provider = 'ANONYMOUS';
