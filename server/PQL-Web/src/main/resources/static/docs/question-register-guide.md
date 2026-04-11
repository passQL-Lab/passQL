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

## executionMode 판별 기준

| executionMode | 사용 조건 |
|---------------|-----------|
| `EXECUTABLE` | 선택지가 SQL 쿼리이거나, SQL 실행 결과(테이블/값)를 묻는 문제 |
| `CONCEPT_ONLY` | 개념·이론·용어를 묻는 문제. SQL 실행 없이 텍스트 선택지만 존재 |

> CONCEPT_ONLY 문제는 schemaDdl, schemaSampleData, schemaIntent, answerSql을 모두 null로 설정한다.

## choiceSetPolicy 목록

| choiceSetPolicy | 설명 |
|-----------------|------|
| `AI_ONLY` | 기본값. AI가 4개 SQL 선택지를 생성하고 answerSql 실행 결과와 일치하는 1개를 정답으로 판별 |
| `ODD_ONE_OUT` | "결과가 다른 것은?" 유형. AI가 4개 생성, 실행 결과 3:1로 나뉘는 소수(1개)가 정답 |
| `CURATED_ONLY` | 직접 작성한 선택지만 사용 (AI 생성 없음) |
| `HYBRID` | AI 생성 + 직접 작성 혼합 |

> CONCEPT_ONLY 문제는 choiceSetPolicy를 생략하거나 null로 설정한다 (선택지 생성 자체가 없음).

## JSON 스키마 (단건)

```json
{
  "topicCode":        "sql_join",
  "difficulty":       3,
  "executionMode":    "EXECUTABLE",
  "choiceSetPolicy":  "AI_ONLY",
  "stem":             "다음 SQL의 실행 결과로 올바른 것은?\n\nSELECT e.name, d.dept_name\nFROM emp e\nINNER JOIN dept d ON e.dept_id = d.dept_id\nWHERE d.location = 'SEOUL';",
  "schemaDisplay":    "EMP (emp_id, name, dept_id, salary)\nDEPT (dept_id, dept_name, location)",
  "hint":             "INNER JOIN은 양쪽 테이블에 모두 존재하는 행만 반환한다.",
  "schemaDdl":        "CREATE TABLE dept (\n  dept_id INT PRIMARY KEY,\n  dept_name VARCHAR(50),\n  location VARCHAR(50)\n);\nCREATE TABLE emp (\n  emp_id INT PRIMARY KEY,\n  name VARCHAR(50),\n  dept_id INT,\n  salary INT\n);",
  "schemaSampleData": "INSERT INTO dept VALUES (1, '개발팀', 'SEOUL'), (2, '영업팀', 'BUSAN');\nINSERT INTO emp VALUES (1, '홍길동', 1, 5000), (2, '김영희', 2, 4000), (3, '이철수', 1, 6000);",
  "schemaIntent":     "INNER JOIN 조건 필터링 및 다중 테이블 조회 이해",
  "answerSql":        "SELECT e.name, d.dept_name FROM emp e INNER JOIN dept d ON e.dept_id = d.dept_id WHERE d.location = 'SEOUL'"
}
```

## 필드 규칙

| 필드 | 필수 여부 | 설명 |
|------|-----------|------|
| `topicCode` | 필수 | 위 목록에서 정확히 선택 |
| `difficulty` | 필수 | 1~5 정수. 개념 암기=1, 단순 SQL=2, 실행 추적=3, 복합 JOIN/서브쿼리=4, 윈도우/계층=5 |
| `executionMode` | 필수 | `EXECUTABLE` 또는 `CONCEPT_ONLY` |
| `choiceSetPolicy` | 선택 | EXECUTABLE 문제에만 의미 있음. 생략 시 `AI_ONLY` 기본 적용 |
| `stem` | 필수 | 지문 전체 텍스트. 보기(A/B/C/D) 제외. SQL 코드는 \n으로 줄바꿈 |
| `schemaDisplay` | 선택 | 화면에 표시할 간략한 스키마 요약 (테이블명 + 컬럼명 나열, 한 줄씩) |
| `hint` | 선택 | 핵심해설·함정포인트 기반 한 줄 힌트. 없으면 null |
| `schemaDdl` | EXECUTABLE 필수 | CREATE TABLE 문 전체. CONCEPT_ONLY면 null |
| `schemaSampleData` | 선택 | INSERT 문 목록. 실행 가능한 최소 데이터. CONCEPT_ONLY면 null |
| `schemaIntent` | 선택 | 이 스키마가 테스트하는 개념 한 줄 설명. CONCEPT_ONLY면 null |
| `answerSql` | EXECUTABLE 필수 | 정답 선택지의 SELECT 쿼리 그대로. CONCEPT_ONLY면 null |

## ODD_ONE_OUT 유형 작성 규칙

- `choiceSetPolicy`를 반드시 `"ODD_ONE_OUT"`으로 명시
- `answerSql`은 "나머지 3개와 **다른** 실행 결과를 내는 선택지의 SQL" (소수 쪽)
- 문제 지문은 "다음 중 SQL 실행 결과가 다른 것은?" 형태
- AI가 선택지 4개를 생성할 때 3개는 같은 결과, 1개는 다른 결과로 생성하도록 유도됨

## schemaDdl 작성 규칙

- MariaDB / Oracle 양쪽 호환 SQL 사용 (ROWNUM 대신 LIMIT, DUAL 테이블 주의)
- 테이블 생성 순서는 FK 참조 대상(부모) → 참조하는 쪽(자식) 순서
- 컬럼은 문제에서 사용하는 것만 포함. 불필요한 컬럼 추가 금지
- NULL 허용 여부, PK/FK 제약은 문제 해석에 영향을 주는 경우에만 명시
- 문자열 내 줄바꿈은 반드시 `\n`으로 표현 (실제 줄바꿈 금지)

## 주의사항

- `stem` 필드에 선택지(①②③④ 또는 A/B/C/D)를 포함하지 않는다. 지문만 작성
- `answerSql`은 문제의 정답 번호에 해당하는 SQL을 그대로 복사
- JSON 내 문자열은 큰따옴표(`"`) 사용. 작은따옴표 금지
- SQL 내 작은따옴표는 이스케이프 없이 그대로 작성 가능 (`'SEOUL'` → OK)
- 같은 JSON에 문자열 줄바꿈 = `\n`, 실제 엔터 키 입력 = 금지

---

## AI 변환 프롬프트 (단건용)

아래 프롬프트 전체를 AI에게 붙여넣고, 구분선 아래에 변환할 SQLD 문제를 추가하세요.

```
당신은 SQLD 문제를 passQL JSON 명세로 변환하는 전문가입니다.
아래 규칙을 엄격히 따라 JSON 코드블록 하나만 출력하세요. 설명, 주석, 마크다운 없이 JSON만.

=== 필드 규칙 ===

topicCode (필수):
  data_modeling | sql_basic_select | sql_ddl_dml_tcl | sql_function |
  sql_join | sql_subquery | sql_group_aggregate | sql_window | sql_hierarchy_pivot

difficulty (필수): 1~5 정수
  1 = 개념 암기 (정의, 용어)
  2 = 단순 SQL 읽기 (기본 SELECT, 간단한 WHERE)
  3 = SQL 실행 추적 (JOIN 1개, GROUP BY, NULL 처리)
  4 = 복합 조건 (다중 JOIN, 서브쿼리, HAVING)
  5 = 윈도우 함수·계층 쿼리·PIVOT

executionMode (필수):
  "EXECUTABLE"  → 선택지가 SQL이거나, SQL 실행 결과(테이블/값)를 묻는 문제
  "CONCEPT_ONLY" → 개념·이론·용어 문제. SQL 실행 없이 텍스트 선택지

choiceSetPolicy:
  "AI_ONLY"      → 일반 EXECUTABLE 문제 (기본값, 생략 가능)
  "ODD_ONE_OUT"  → "다음 중 SQL 실행 결과가 다른 것은?" 유형
  "CURATED_ONLY" → 선택지를 직접 작성하는 경우
  CONCEPT_ONLY 문제 → null

stem (필수):
  문제 지문 전체 텍스트. 보기(①②③④ 또는 A/B/C/D) 절대 포함 금지.
  지문 내 SQL 코드가 있으면 그대로 포함 (\n으로 줄바꿈).

schemaDisplay (선택):
  화면 표시용 스키마 요약. 테이블명(컬럼명, ...) 형태로 간략하게.
  예: "EMP (emp_id, name, dept_id)\nDEPT (dept_id, dept_name)"

hint (선택):
  정답 근거가 되는 핵심 개념 또는 함정 포인트를 한 문장으로.
  없으면 null.

schemaDdl (EXECUTABLE 필수, CONCEPT_ONLY → null):
  문제에 등장하는 테이블의 CREATE TABLE 문 전체.
  - MariaDB 호환 SQL (ROWNUM 사용 금지, LIMIT 사용)
  - FK 참조 대상 테이블을 먼저 생성
  - 문제에서 사용하는 컬럼만 포함
  - 문자열 내 줄바꿈은 \n

schemaSampleData (선택, CONCEPT_ONLY → null):
  SELECT 실행 결과를 재현할 수 있는 최소한의 INSERT 문.
  문제에 데이터가 없으면 결과를 추론하여 유추 생성.
  문자열 내 줄바꿈은 \n.

schemaIntent (선택, CONCEPT_ONLY → null):
  이 스키마가 테스트하는 SQL 개념을 한 줄로 설명.
  예: "INNER JOIN 조건 필터링과 다중 테이블 조회"

answerSql (EXECUTABLE 필수, CONCEPT_ONLY → null):
  문제의 정답 번호에 해당하는 SELECT 쿼리를 그대로 복사.
  ODD_ONE_OUT 유형이면: 나머지 3개와 다른 실행 결과를 내는 선택지의 SQL.

=== 출력 예시 ===

EXECUTABLE + AI_ONLY 예시:
{
  "topicCode": "sql_join",
  "difficulty": 3,
  "executionMode": "EXECUTABLE",
  "choiceSetPolicy": "AI_ONLY",
  "stem": "다음 SQL의 실행 결과로 올바른 것은?\n\nSELECT e.name, d.dept_name\nFROM emp e\nINNER JOIN dept d ON e.dept_id = d.dept_id\nWHERE d.location = 'SEOUL';",
  "schemaDisplay": "EMP (emp_id, name, dept_id, salary)\nDEPT (dept_id, dept_name, location)",
  "hint": "INNER JOIN은 양쪽 테이블에 모두 일치하는 행만 반환한다.",
  "schemaDdl": "CREATE TABLE dept (\n  dept_id INT PRIMARY KEY,\n  dept_name VARCHAR(50),\n  location VARCHAR(50)\n);\nCREATE TABLE emp (\n  emp_id INT PRIMARY KEY,\n  name VARCHAR(50),\n  dept_id INT,\n  salary INT\n);",
  "schemaSampleData": "INSERT INTO dept VALUES (1, '개발팀', 'SEOUL'), (2, '영업팀', 'BUSAN');\nINSERT INTO emp VALUES (1, '홍길동', 1, 5000), (2, '김영희', 2, 4000), (3, '이철수', 1, 6000);",
  "schemaIntent": "INNER JOIN 조건 필터링 및 위치 기반 부서 조회",
  "answerSql": "SELECT e.name, d.dept_name FROM emp e INNER JOIN dept d ON e.dept_id = d.dept_id WHERE d.location = 'SEOUL'"
}

ODD_ONE_OUT 예시:
{
  "topicCode": "sql_basic_select",
  "difficulty": 3,
  "executionMode": "EXECUTABLE",
  "choiceSetPolicy": "ODD_ONE_OUT",
  "stem": "다음 보기에서 SQL 실행 결과가 다른 것은?\n\n테이블: SCORE (student_id, subject, score)",
  "schemaDisplay": "SCORE (student_id, subject, score)",
  "hint": "GROUP BY 없이 집계함수를 사용하면 전체 집계, GROUP BY를 사용하면 그룹별 집계가 된다.",
  "schemaDdl": "CREATE TABLE score (\n  student_id INT,\n  subject VARCHAR(20),\n  score INT\n);",
  "schemaSampleData": "INSERT INTO score VALUES (1, 'MATH', 90), (1, 'ENG', 80), (2, 'MATH', 70), (2, 'ENG', 85);",
  "schemaIntent": "GROUP BY 유무에 따른 집계 결과 차이 이해",
  "answerSql": "SELECT subject, AVG(score) FROM score"
}

CONCEPT_ONLY 예시:
{
  "topicCode": "data_modeling",
  "difficulty": 1,
  "executionMode": "CONCEPT_ONLY",
  "choiceSetPolicy": null,
  "stem": "다음 중 관계형 데이터베이스에서 기본키(Primary Key)의 특성으로 옳지 않은 것은?",
  "schemaDisplay": null,
  "hint": "기본키는 NULL을 허용하지 않으며 테이블 내에서 유일해야 한다.",
  "schemaDdl": null,
  "schemaSampleData": null,
  "schemaIntent": null,
  "answerSql": null
}

=== 변환할 문제 ===

[여기에 SQLD 문제를 붙여넣기]
```
