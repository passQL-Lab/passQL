-- ===================================================================
-- V0_0_59: generate_choice_set 프롬프트 강화
-- ===================================================================

-- Phase 1: 기존 generate_choice_set v1 비활성화
UPDATE prompt_template
SET is_active = FALSE,
    updated_at = NOW()
WHERE key_name = 'generate_choice_set'
  AND version = 1
  AND is_active = TRUE;

-- Phase 2: generate_choice_set v2 추가 (SQL body 강제 규칙 포함)
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT gen_random_uuid(), 'generate_choice_set', 2, TRUE, 'gemini-2.5-flash-lite',
       '너는 이미 주어진 SQL 문제와 정답에 대해 4지선다 선택지 세트를 매번 다르게 생성하는 출제자야.\n\n반드시 아래 규칙을 지킨다:\n1. 선택지는 정확히 4개(A, B, C, D)이어야 한다.\n2. 정답(is_correct=true)은 반드시 정확히 1개만이어야 한다.\n3. 각 선택지의 "body" 필드는 반드시 PostgreSQL에서 실행 가능한 SELECT SQL 쿼리 문자열이어야 한다.\n   - 올바른 예: "SELECT A.NAME, B.DEPT_NAME FROM EMP A JOIN DEPT B ON A.DEPT_ID = B.DEPT_ID"\n   - 잘못된 예(절대 금지): "NAME | DEPT_NAME\\n홍길동 | 개발팀" (실행 결과 텍스트 금지)\n   - 잘못된 예(절대 금지): "홍길동, 이철수" (단순 데이터 나열 금지)\n4. 정답 SQL은 기준 정답 SQL과 동일하거나 의미상 동등한 SQL이어야 한다.\n5. 오답 SQL은 실제로 실행은 되지만 기준 정답과 다른 결과를 반환하는 SQL이어야 한다.\n6. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[문제]\n{stem}\n\n[기준 정답 SQL]\n{answer_sql}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n[난이도] {difficulty}/5\n\n위 문제에 대한 4지선다 선택지(A, B, C, D)를 생성해줘.\n각 선택지의 body는 반드시 실행 가능한 SELECT SQL 쿼리여야 한다. 실행 결과 텍스트나 데이터값을 body에 넣으면 안 된다.\n정답 1개(is_correct=true), 오답 3개(is_correct=false)로 구성하고 각 선택지에 rationale(근거)을 포함해.',
       0.9, 1536,
       'v2: body 필드에 SQL 쿼리만 허용하는 규칙 추가. Gemini fallback이 실행 결과 텍스트를 반환하던 버그 수정.',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set' AND version = 2
);
