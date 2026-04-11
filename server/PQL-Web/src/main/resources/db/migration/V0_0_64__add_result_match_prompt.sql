-- ===================================================================
-- V0_0_64: RESULT_MATCH 선택지 정책 프롬프트 추가
--
-- 문제 유형: "다음 SQL의 실행 결과로 올바른 것은?"
-- 선택지 body: JSON 배열 형태의 결과 테이블
-- 검증: body JSON 파싱 후 answerSql 실행 결과와 비교 (Sandbox 재호출 없음)
-- ===================================================================

INSERT INTO prompt_template (
    prompt_template_uuid, key_name, version, is_active, model,
    system_prompt, user_template, temperature, max_tokens, note,
    created_at, updated_at
)
SELECT UUID(), 'generate_choice_set_result_match', 1, 1, 'gemini-2.5-flash-lite',
'너는 SQL 문제의 4지선다 선택지를 생성하는 출제자야.

이 문제 유형은 "다음 SQL의 실행 결과로 올바른 것은?" 유형이다.
선택지는 SQL 쿼리가 아니라 SQL 실행 결과 테이블을 JSON 배열로 표현한 것이다.

반드시 아래 규칙을 지킨다:
1. 선택지는 정확히 4개(A, B, C, D)이어야 한다.
2. 정답(is_correct=true)은 반드시 정확히 1개만이어야 한다.
3. 각 선택지의 "body" 필드는 반드시 JSON 배열 형태여야 한다.
   - 올바른 예: "[{\"NAME\":\"홍길동\",\"DEPT_NAME\":\"개발팀\"},{\"NAME\":\"김영희\",\"DEPT_NAME\":\"개발팀\"}]"
   - 빈 결과: "[]"
   - 절대 금지: SQL 쿼리 ("SELECT * FROM EMP")
   - 절대 금지: 단순 텍스트 ("홍길동, 개발팀")
4. JSON 배열의 각 객체 키는 answerSql의 SELECT alias와 동일한 대문자를 사용한다.
5. 정답 body는 기준 실행 결과와 동일한 데이터여야 한다 (행 순서는 달라도 됨).
6. 오답 body는 기준 실행 결과와 다른 데이터를 담고 있어야 한다 (행 수 다르거나 값 다름).
7. 반드시 response_schema에 맞는 JSON으로만 응답한다.',
'[문제]\n{stem}\n\n[기준 SQL]\n{answer_sql}\n\n[기준 SQL 실행 결과]\n{answer_result}\n\n[DB 스키마]\n{schema_ddl}\n\n[샘플 데이터]\n{schema_sample_data}\n\n[난이도] {difficulty}/5\n\n위 기준 SQL의 실행 결과와 동일한 결과 JSON(정답 1개)과 다른 결과 JSON(오답 3개)로 4지선다를 생성해줘.\n각 선택지 body는 반드시 JSON 배열 형태여야 하며, SQL 쿼리를 body에 넣으면 안 된다.\n각 선택지에 rationale(왜 정답/오답인지 근거)을 포함해.',
0.9, 1536,
'v1: RESULT_MATCH 정책 전용 프롬프트. 선택지 body = JSON 배열 결과 테이블.',
NOW(6), NOW(6)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_template
    WHERE key_name = 'generate_choice_set_result_match' AND version = 1
);
