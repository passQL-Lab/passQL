# passQL 문제 등록 가이드

## topicCode 목록

| topicCode | 표시명 |
|-----------|--------|
| data_modeling | 데이터 모델링의 이해 |
| sql_basic_select | SELECT 기본 |
| sql_ddl_dml_tcl | DDL / DML / TCL |
| sql_function | SQL 함수 (문자/숫자/날짜/NULL) |
| sql_join | 조인 (JOIN) |
| sql_subquery | 서브쿼리 |
| sql_group_aggregate | 그룹함수 / 집계 |
| sql_window | 윈도우 함수 |
| sql_hierarchy_pivot | 계층 쿼리 / PIVOT |

## JSON 스키마 (단건)

```json
{
  "topicCode":        "sql_basic_select",
  "difficulty":       3,
  "executionMode":    "EXECUTABLE",
  "choiceSetPolicy":  "AI_ONLY",
  "stem":             "지문 전체 텍스트",
  "hint":             "힌트 한 줄 (없으면 null)",
  "schemaDdl":        "CREATE TABLE ... (EXECUTABLE 필수, \n으로 줄바꿈)",
  "schemaSampleData": "INSERT INTO ... (선택, \n으로 줄바꿈)",
  "schemaIntent":     "테이블이 테스트하는 개념 한 줄 설명 (선택)",
  "answerSql":        "SELECT ... (EXECUTABLE 필수, 정답 SQL)"
}
```

## 필드 규칙

- **topicCode** (필수): 위 목록에서 선택
- **difficulty** (필수): 1~5 정수 (개념 암기=1~2, SQL 실행 추적=3, 복합 조건/JOIN=4, 윈도우/계층=5)
- **executionMode** (필수): `EXECUTABLE` (SQL 실행 결과를 묻는 문제) 또는 `CONCEPT_ONLY` (개념/이론)
- **choiceSetPolicy** (선택): `AI_ONLY` (기본값), `ODD_ONE_OUT` ("결과가 다른 것은?" 유형 — 4개 중 3개가 같은 결과, 1개만 다른 결과를 정답으로 판별), `CONCEPT_ONLY` (개념 문제용), `HYBRID`
- **stem** (필수): 지문 전체 텍스트 (선택지 A/B/C/D 제외)
- **hint** (선택): 핵심해설/함정포인트 기반 한 줄 힌트
- **schemaDdl** (EXECUTABLE 필수): CREATE TABLE 문. 문제에 없으면 선택지에서 유추 생성
- **schemaSampleData** (선택): INSERT 문 목록. 문제에 데이터가 없으면 실행 가능한 최소 데이터 유추 생성
- **schemaIntent** (선택): 이 테이블/데이터가 어떤 개념을 테스트하는지 한 줄 설명
- **answerSql** (EXECUTABLE 필수): 정답 번호에 해당하는 SELECT 쿼리

## 주의사항

- `schemaDdl`, `schemaSampleData` 문자열 내 줄바꿈은 `\n`으로 표현
- `answerSql`은 선택지 중 정답 SQL을 그대로 복사
- SQLD MariaDB/Oracle 호환 SQL 작성
- `CONCEPT_ONLY` 문제는 `schemaDdl`, `schemaSampleData`, `schemaIntent`, `answerSql`을 null로 설정

## AI 변환 프롬프트

아래 프롬프트를 AI에게 전달하고, 문제 데이터를 붙여넣으면 JSON으로 변환해줍니다.

```
아래 SQLD 문제 데이터를 passQL JSON 명세로 변환해줘.

출력은 JSON 코드블록 하나만. 다른 설명 없이.

필드 규칙:
- topicCode: 다음 중 하나만 사용
  data_modeling / sql_basic_select / sql_ddl_dml_tcl / sql_function / sql_join / sql_subquery / sql_group_aggregate / sql_window / sql_hierarchy_pivot
- difficulty: 1~5 정수 (개념 암기=1~2, SQL 실행 추적=3, 복합 조건/JOIN=4, 윈도우/계층=5)
- executionMode: "EXECUTABLE" (SQL 실행 결과를 묻는 문제) 또는 "CONCEPT_ONLY" (개념/이론)
- stem: 지문 전체 텍스트 (선택지 A/B/C/D 제외)
- hint: 핵심해설/함정포인트 기반 한 줄 힌트. 없으면 null
- schemaDdl: EXECUTABLE이면 CREATE TABLE 문. CONCEPT_ONLY면 null
- schemaSampleData: EXECUTABLE이면 INSERT 문 목록. CONCEPT_ONLY면 null
- schemaIntent: 테이블/데이터가 테스트하는 개념 한 줄 설명. CONCEPT_ONLY면 null
- answerSql: EXECUTABLE이면 정답 SELECT 쿼리. CONCEPT_ONLY면 null

주의사항:
- schemaDdl, schemaSampleData 문자열 내 줄바꿈은 \n으로 표현
- answerSql은 선택지 중 정답 SQL을 그대로 복사
- SQLD MariaDB/Oracle 호환 SQL 작성

--- 문제 데이터 ---
[여기에 문제를 붙여넣기]
```
