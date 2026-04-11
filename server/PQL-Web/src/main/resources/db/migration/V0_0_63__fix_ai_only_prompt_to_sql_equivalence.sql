-- ===================================================================
-- V0_0_63: AI_ONLY 선택지 정책 지문 패턴 및 프롬프트 수정
-- ===================================================================

-- Phase 1: generate_choice_set v2 비활성화
UPDATE prompt_template
SET is_active = FALSE,
    updated_at = NOW()
WHERE key_name = 'generate_choice_set'
  AND version = 2
  AND is_active = TRUE;

-- Phase 2: generate_choice_set v3 추가
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT gen_random_uuid(), 'generate_choice_set', 3, TRUE, 'gemini-2.5-flash-lite',
'너는 SQL 문제의 4지선다 선택지를 생성하는 출제자야.

이 문제 유형은 "주어진 SQL과 동일한 실행 결과를 내는 SQL을 고르는" 유형이다.
정답 선택지는 기준 SQL과 동일한 결과를 내는 다른 SQL이고,
오답 선택지는 실행은 되지만 다른 결과를 내는 SQL이다.

반드시 아래 규칙을 지킨다:
1. 선택지는 정확히 4개(A, B, C, D)이어야 한다.
2. 정답(is_correct=true)은 반드시 정확히 1개만이어야 한다.
3. 각 선택지의 "body" 필드는 반드시 PostgreSQL에서 실행 가능한 SELECT SQL 쿼리여야 한다.
   - 올바른 예: "SELECT A.NAME, B.DEPT_NAME FROM EMP A INNER JOIN DEPT B ON A.DEPT_ID = B.DEPT_ID WHERE B.DEPT_NAME = ''개발팀''"
   - 절대 금지: "NAME | DEPT_NAME\n홍길동 | 개발팀" (실행 결과 텍스트)
   - 절대 금지: "홍길동, 이철수" (단순 데이터 나열)
4. 정답 SQL은 기준 SQL과 실행 결과가 동일해야 한다 (다른 문법/표현으로 작성).
5. 오답 SQL은 실행은 되지만 기준 SQL과 다른 결과를 반환해야 한다.
6. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
'[문제]\n{stem}\n\n[기준 SQL]\n{answer_sql}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n[난이도] {difficulty}/5\n\n위 기준 SQL과 동일한 실행 결과를 내는 SQL(정답 1개)과 다른 결과를 내는 SQL(오답 3개)로 4지선다를 생성해줘.\n각 선택지 body는 반드시 실행 가능한 SELECT SQL 쿼리여야 하며, 실행 결과 텍스트를 body에 넣으면 안 된다.\n각 선택지에 rationale(왜 정답/오답인지 근거)을 포함해.',
0.9, 1536,
'v3: AI_ONLY 정책을 "기준 SQL과 동일 결과를 내는 SQL 찾기" 유형으로 명시. 지문 패턴 변경에 맞춰 프롬프트 재작성.',
NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set' AND version = 3
);

-- Phase 3: AI_ONLY EXECUTABLE 문제 stem 일괄 수정
UPDATE question
SET stem = '다음 SQL과 동일한 실행 결과를 내는 SQL은?' || SUBSTRING(stem FROM POSITION(CHR(10) IN stem)),
    updated_at = NOW()
WHERE choice_set_policy = 'AI_ONLY'
  AND execution_mode = 'EXECUTABLE'
  AND (
      stem LIKE '다음 SQL의 실행 결과로 올바른 것은?%'
      OR stem LIKE '다음 SQL의 실행 결과 행 수로 올바른 것은?%'
  );

-- Phase 4: AI_ONLY EXECUTABLE 문제의 기존 선택지 세트 삭제 (재생성 유도)

-- Step 1: submission이 참조하는 choice_set_uuid를 NULL로 해제
UPDATE submission s
SET choice_set_uuid = NULL
FROM question_choice_set cs
JOIN question q ON cs.question_uuid = q.question_uuid
WHERE s.choice_set_uuid = cs.choice_set_uuid
  AND q.choice_set_policy = 'AI_ONLY'
  AND q.execution_mode = 'EXECUTABLE';

-- Step 2: 선택지 항목 삭제
DELETE FROM question_choice_set_item csi
USING question_choice_set cs
JOIN question q ON cs.question_uuid = q.question_uuid
WHERE csi.choice_set_uuid = cs.choice_set_uuid
  AND q.choice_set_policy = 'AI_ONLY'
  AND q.execution_mode = 'EXECUTABLE';

-- Step 3: 선택지 세트 삭제
DELETE FROM question_choice_set cs
USING question q
WHERE cs.question_uuid = q.question_uuid
  AND q.choice_set_policy = 'AI_ONLY'
  AND q.execution_mode = 'EXECUTABLE';
