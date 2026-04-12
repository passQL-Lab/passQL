-- 카드 UI 개선에 따라 너무 긴 토픽 이름을 카드 크기에 맞게 축약
UPDATE topic SET display_name = '데이터 모델링', updated_at = NOW() WHERE code = 'data_modeling';
UPDATE topic SET display_name = 'SQL 함수', updated_at = NOW() WHERE code = 'sql_function';
UPDATE topic SET display_name = 'JOIN', updated_at = NOW() WHERE code = 'sql_join';
UPDATE topic SET display_name = '계층 / PIVOT', updated_at = NOW() WHERE code = 'sql_hierarchy_pivot';
