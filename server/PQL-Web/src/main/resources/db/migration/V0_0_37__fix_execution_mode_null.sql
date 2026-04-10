-- executionMode가 null인 기존 question 데이터를 CONCEPT_ONLY로 보정
UPDATE question SET execution_mode = 'CONCEPT_ONLY' WHERE execution_mode IS NULL;
