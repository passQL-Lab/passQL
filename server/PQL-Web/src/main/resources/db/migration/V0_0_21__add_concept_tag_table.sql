-- ============================================================================
-- V0_0_21: question_concept_tag 매핑 테이블 추가 + 초기 시드 데이터 적재
--   - question_concept_tag 테이블 생성
--   - app_setting  : 운영 설정값 13개
--   - prompt_template : 3종 v1 (key_name+version 중복 체크 후 삽입)
--   - topic        : SQLD 시험 단원 기반 9개
-- ============================================================================

-- ---------------------------------------------------------------------------
-- question_concept_tag
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_concept_tag (
    question_id BIGINT       NOT NULL,
    tag_key     VARCHAR(100) NOT NULL,
    PRIMARY KEY (question_id, tag_key)
);

-- ---------------------------------------------------------------------------
-- app_setting 시드 (13개) — PK: setting_key → ON CONFLICT DO UPDATE
-- ---------------------------------------------------------------------------
INSERT INTO app_setting (setting_key, value_type, value_text, category, description)
VALUES
    ('exam.target_date',              'STRING', '2026-05-31',  'exam',      'SQLD 시험 목표일'),
    ('exam.pass_score',               'INT',    '60',           'exam',      '합격 기준 점수 (총점 60점 이상, 과목별 40% 이상)'),
    ('exam.total_questions',          'INT',    '50',           'exam',      '전체 문제 수'),
    ('exam.subject1_questions',       'INT',    '10',           'exam',      '1과목(데이터 모델링의 이해) 문제 수'),
    ('exam.subject2_questions',       'INT',    '40',           'exam',      '2과목(SQL 기본 및 활용) 문제 수'),
    ('exam.time_limit_minutes',       'INT',    '90',           'exam',      '시험 시간(분)'),
    ('ratelimit.execute.per_minute',  'INT',    '90',           'ratelimit', 'SQL 실행 API 분당 최대 요청 수'),
    ('ratelimit.submit.per_minute',   'INT',    '30',           'ratelimit', '문제 제출 API 분당 최대 요청 수'),
    ('ai.default_model',              'STRING', 'gemini-2.5-flash-lite', 'ai', 'AI 기본 모델 (Gemini Flash-Lite, fallback: Ollama)'),
    ('ai.default_temperature',        'FLOAT',  '0.7',          'ai',        'AI 기본 temperature'),
    ('ai.default_max_tokens',         'INT',    '1024',         'ai',        'AI 기본 최대 토큰'),
    ('question.default_page_size',    'INT',    '20',           'question',  '문제 목록 기본 페이지 크기'),
    ('question.max_difficulty',       'INT',    '5',            'question',  '문제 최대 난이도')
ON CONFLICT (setting_key) DO UPDATE
    SET value_type  = EXCLUDED.value_type,
        value_text  = EXCLUDED.value_text,
        category    = EXCLUDED.category,
        description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- prompt_template 시드 (3종 v1) — INSERT ... WHERE NOT EXISTS 패턴
-- ---------------------------------------------------------------------------
INSERT INTO prompt_template (key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note)
SELECT 'explain_error', 1, TRUE, 'gemini-2.5-flash-lite',
       '당신은 SQL 학습을 도와주는 전문 튜터입니다. 학습자가 SQL 문제를 틀렸을 때 오류 원인을 친절하고 명확하게 설명해 주세요. SQLD 시험 기준으로 설명하며, 핵심 개념(NULL 처리, 연산자 우선순위, 실행 순서 등)을 짚어주세요.',
       '문제: {{question_stem}}\n정답: {{correct_answer}}\n학습자 선택: {{selected_answer}}\n\n왜 틀렸는지 설명해 주세요.',
       0.5, 512, 'SQLD 오답 해설 프롬프트 v1'
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'explain_error' AND version = 1);

INSERT INTO prompt_template (key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note)
SELECT 'diff_explain', 1, TRUE, 'gemini-2.5-flash-lite',
       '당신은 SQL 학습을 도와주는 전문 튜터입니다. 두 SQL 쿼리의 차이점을 비교 설명해 주세요. SQLD 시험에서 자주 출제되는 함정(RANK vs DENSE_RANK, UNION vs UNION ALL, LEFT/RIGHT OUTER JOIN 차이 등)을 중심으로 설명하세요.',
       '쿼리 A:\n{{query_a}}\n\n쿼리 B:\n{{query_b}}\n\n두 쿼리의 차이점과 각각의 실행 결과를 비교 설명해 주세요.',
       0.5, 768, 'SQL 쿼리 비교 설명 프롬프트 v1'
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'diff_explain' AND version = 1);

INSERT INTO prompt_template (key_name, version, is_active, model, system_prompt, user_template, temperature, max_tokens, note)
SELECT 'similar', 1, TRUE, 'gemini-2.5-flash-lite',
       '당신은 SQLD 시험 문제를 출제하는 전문가입니다. 주어진 문제와 유사한 난이도와 유형의 새로운 연습 문제를 생성해 주세요. 실제 SQLD 기출 스타일(함정 포함)로 작성하세요.',
       '다음 문제와 유사한 연습 문제를 1개 생성해 주세요.\n\n원본 문제:\n{{question_stem}}\n\n선택지:\n{{choices}}\n\n같은 개념을 다른 각도로 묻는 문제를 만들어 주세요.',
       0.8, 1024, '유사 문제 생성 프롬프트 v1'
WHERE NOT EXISTS (SELECT 1 FROM prompt_template WHERE key_name = 'similar' AND version = 1);

-- ---------------------------------------------------------------------------
-- topic 시드 (9개) — PK: code → ON CONFLICT DO UPDATE
-- ---------------------------------------------------------------------------
INSERT INTO topic (code, display_name, sort_order, is_active)
VALUES
    ('data_modeling',        '데이터 모델링의 이해',           1, TRUE),
    ('sql_basic_select',     'SELECT 기본',                    2, TRUE),
    ('sql_ddl_dml_tcl',      'DDL / DML / TCL',                3, TRUE),
    ('sql_function',         'SQL 함수 (문자/숫자/날짜/NULL)',  4, TRUE),
    ('sql_join',             '조인 (JOIN)',                     5, TRUE),
    ('sql_subquery',         '서브쿼리',                        6, TRUE),
    ('sql_group_aggregate',  '그룹함수 / 집계',                 7, TRUE),
    ('sql_window',           '윈도우 함수',                     8, TRUE),
    ('sql_hierarchy_pivot',  '계층 쿼리 / PIVOT',               9, TRUE)
ON CONFLICT (code) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        sort_order   = EXCLUDED.sort_order,
        is_active    = EXCLUDED.is_active;
