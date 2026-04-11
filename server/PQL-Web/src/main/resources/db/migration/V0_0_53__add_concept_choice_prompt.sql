-- ===================================================================
-- V0_0_53: CONCEPT_ONLY 문제 선택지 생성 프롬프트 템플릿 추가
-- ===================================================================
--
-- 변경 내용:
--   - prompt_template 시드 1개 추가 (generate_choice_set_concept)
--     · CONCEPT_ONLY 문제 전용 — SQL/스키마 없이 stem+hint만으로 4지선다 생성
--     · 샌드박스 검증 없이 AI의 is_correct를 직접 신뢰
--
-- 참고 이슈: #88 executionMode·choiceSetPolicy 불일치로 인한 다중 버그
-- ===================================================================

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT UUID(), 'generate_choice_set_concept', 1, 1, 'gemini-2.5-flash-lite',
       '너는 SQL/데이터베이스 개념 이론 문제에 대한 4지선다 선택지를 생성하는 한국어 출제자야.\n반드시 아래 규칙을 지킨다:\n1. 선택지는 정확히 4개(A, B, C, D)이어야 한다.\n2. 정답(is_correct=true)은 반드시 정확히 1개만이어야 한다.\n3. 오답 3개는 헷갈릴 수 있지만 명백히 틀린 내용이어야 한다.\n4. 모든 선택지는 간결한 한국어 텍스트로 작성한다 (SQL 코드 불필요).\n5. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
       '[문제]\n{stem}\n\n[난이도] {difficulty}/5\n\n위 개념 이론 문제에 대한 4지선다 선택지(A, B, C, D)를 생성해줘.\n정답 1개(is_correct=true), 오답 3개(is_correct=false)로 구성하고 각 선택지에 rationale(근거)을 포함해.',
       0.7, 1024,
       'CONCEPT_ONLY 문제 전용 선택지 생성 프롬프트. SQL/스키마 없이 stem+hint만으로 AI가 텍스트 선택지를 생성. 샌드박스 검증 없음.',
       NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set_concept' AND version = 1
);
