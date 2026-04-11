-- ===================================================================
-- V0_0_73: generate_choice_set v4 — 동치 SQL 패턴 명시적 금지 강화
-- ===================================================================
-- 문제: Non EQUI Self Join 같이 SQL 동치 표현이 많은 문제에서
--       AI가 문법만 다른 동치 SQL을 오답 선지로 생성하여
--       CHOICE_SET_VALIDATION_MULTIPLE_CORRECT 에러가 반복 발생.
-- 해결: system_prompt에 동치 SQL 패턴 구체적 예시와 금지 규칙 추가.

-- Phase 1: v3 비활성화
UPDATE prompt_template
SET is_active = FALSE,
    updated_at = NOW()
WHERE key_name = 'generate_choice_set'
  AND version = 3
  AND is_active = TRUE;

-- Phase 2: v4 추가
INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT gen_random_uuid(), 'generate_choice_set', 4, TRUE, 'gemini-2.5-flash-lite',
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
6. 반드시 response_schema에 맞는 JSON으로만 응답한다.

[오답 선지 작성 시 반드시 피해야 할 동치 SQL 패턴]
아래 패턴들은 기준 SQL과 다르게 보여도 실제로 동일한 결과를 낸다. 오답으로 절대 사용하지 말 것:
- 키워드만 다른 표현: INNER JOIN → JOIN, != → <>, IS NOT NULL → NOT (col IS NULL)
- 조건 방향만 바꾼 표현: B.SALARY <= A.SALARY → A.SALARY >= B.SALARY
- GROUP BY 컬럼 추가/제거: GROUP BY A.ID, A.NAME → GROUP BY A.NAME (결과가 같은 경우)
- 컬럼 별칭만 다른 표현: SUM(B.SALARY) AS TOTAL → SUM(B.SALARY) AS TOTAL_SALARY
- ORDER BY 방향 기본값: ORDER BY A.NAME ASC → ORDER BY A.NAME
- 서브쿼리 ↔ JOIN 변환: 결과가 동일한 경우
- DISTINCT 불필요 추가: 중복이 없는 쿼리에 DISTINCT를 붙여도 결과 동일

오답은 반드시 샘플 데이터 기준으로 기준 SQL과 실제 행(row) 수 또는 값이 달라야 한다.
오답을 만들기 전에 "이 SQL이 기준 SQL과 같은 결과를 낼 가능성이 있는가?"를 먼저 점검하라.',
'[문제]\n{stem}\n\n[기준 SQL]\n{answer_sql}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[스키마 의도]\n{schema_intent}\n\n[난이도] {difficulty}/5\n\n위 기준 SQL과 동일한 실행 결과를 내는 SQL(정답 1개)과 다른 결과를 내는 SQL(오답 3개)로 4지선다를 생성해줘.\n각 선택지 body는 반드시 실행 가능한 SELECT SQL 쿼리여야 하며, 실행 결과 텍스트를 body에 넣으면 안 된다.\n각 선택지에 rationale(왜 정답/오답인지 근거)을 포함해.',
0.9, 1536,
'v4: 동치 SQL 패턴(키워드 변형, 조건 방향 전환, GROUP BY 컬럼 조합 등) 명시적 금지 규칙 추가 — CHOICE_SET_VALIDATION_MULTIPLE_CORRECT 반복 실패 개선',
NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set' AND version = 4
);
