-- 카드 UI 개선에 따라 너무 긴 토픽 이름을 카드 크기에 맞게 축약
-- topic 테이블이 존재하는 경우에만 실행 (WHERE EXISTS 로 멱등성 보장)
UPDATE topic SET display_name = '데이터 모델링', updated_at = NOW()
WHERE code = 'data_modeling'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic');

UPDATE topic SET display_name = 'SQL 함수', updated_at = NOW()
WHERE code = 'sql_function'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic');

UPDATE topic SET display_name = 'JOIN', updated_at = NOW()
WHERE code = 'sql_join'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic');

UPDATE topic SET display_name = '계층 / PIVOT', updated_at = NOW()
WHERE code = 'sql_hierarchy_pivot'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topic');
