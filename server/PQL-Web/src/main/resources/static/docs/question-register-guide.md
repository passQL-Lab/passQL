# passQL 문제 등록 가이드 (단건)

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

---

## executionMode 판별 기준

| executionMode | 사용 조건 |
|---------------|-----------|
| `EXECUTABLE` | 선택지가 SQL 쿼리이거나, SQL 실행 결과(테이블/값)를 묻는 문제 |
| `CONCEPT_ONLY` | 개념·이론·용어를 묻는 문제. SQL 실행 없이 텍스트 선택지만 존재 |

> CONCEPT_ONLY 문제는 schemaDdl, schemaSampleData, schemaIntent, answerSql을 모두 null로 설정한다.

---

## choiceSetPolicy 목록

| choiceSetPolicy | 설명 |
|-----------------|------|
| `AI_ONLY` | 기본값. AI가 선택지 4개를 동적 생성. answerSql 실행 결과와 일치하는 1개를 정답으로 판별 |
| `ODD_ONE_OUT` | "결과가 다른 것은?" 유형. AI가 4개 생성, 실행 결과 3:1로 나뉘는 소수(1개)가 정답 |
| `CURATED_ONLY` | 직접 작성한 선택지만 사용 (AI 생성 없음) |
| `HYBRID` | AI 생성 + 직접 작성 혼합 |

> CONCEPT_ONLY 문제는 choiceSetPolicy를 null로 설정한다.

---

## stem 작성 규칙 ★ 가장 중요

### ❌ 절대 하면 안 되는 것

stem에 선택지를 포함하는 것은 **절대 금지**다.

```
// 잘못된 예시 — stem에 선택지가 포함된 경우
"stem": "다음 설명 중 맞는 것은?\n1. 테이블은 하나만 존재한다.\n2. 데이터는 파일에 저장된다.\n3. 복잡한 자료도 하나의 테이블로 관리한다.\n4. 모든 자료는 테이블에 저장된다."
```

선택지는 AI가 stem을 읽고 **동적으로 생성**하므로, stem에 미리 넣으면 중복 문제가 발생한다.

### ✅ 올바른 작성법

stem은 **질문 문장만** 작성한다. 핵심 주제(개념명, 테이블명, SQL 키워드)가 질문 문장 안에 드러나야 AI가 적절한 선택지를 생성할 수 있다.

```
// CONCEPT_ONLY 올바른 예시
"stem": "엔터티(Entity)의 특성에 대한 설명 중 옳지 않은 것은?"
"stem": "TRUNCATE TABLE과 DELETE의 차이에 대한 설명 중 옳은 것은?"

// EXECUTABLE 올바른 예시 — 문제에서 다루는 SQL을 stem에 포함
"stem": "다음 SQL의 실행 결과로 올바른 것은?\n\nSELECT e.name, d.dept_name\nFROM emp e\nINNER JOIN dept d ON e.dept_id = d.dept_id\nWHERE d.location = 'SEOUL';"
```

### stem 작성 체크리스트

- [ ] 선택지(①②③④, 1. 2. 3. 4., A B C D 등) 포함하지 않았는가?
- [ ] 질문이 어떤 개념/SQL을 다루는지 문장에서 드러나는가?
- [ ] EXECUTABLE + AI_ONLY이면 사용하는 SQL이 stem 안에 포함되어 있는가?
- [ ] 줄바꿈은 `\n`으로 처리했는가?

---

## EXECUTABLE 문제 작성 가이드 ★

EXECUTABLE은 실제 SQL을 Sandbox에서 실행해 결과를 검증하는 문제다.
아래 규칙을 따르지 않으면 **가져오기 시 Sandbox 검증 실패**한다.

### 1. choiceSetPolicy 선택 기준

| 문제 패턴 | choiceSetPolicy | stem에 SQL 포함 여부 |
|-----------|-----------------|----------------------|
| "다음 SQL의 실행 결과로 올바른 것은?" | `AI_ONLY` | ✅ 포함 |
| "다음 중 SQL 실행 결과가 **다른** 것은?" | `ODD_ONE_OUT` | ❌ 미포함 |
| 선택지 직접 작성 | `CURATED_ONLY` | 자유 |

### 2. AI_ONLY 작성 규칙

- `stem`에 문제에서 다루는 SQL을 그대로 포함한다
- `answerSql`은 stem의 SQL과 **동일한 쿼리**를 복사해 넣는다
- AI가 answerSql 실행 결과와 일치하는 선택지 1개를 정답으로 판별하고, 나머지 3개는 오답 선택지를 자동 생성한다

```
// AI_ONLY 예시
"stem": "다음 SQL의 실행 결과로 올바른 것은?\n\nSELECT COUNT(*) FROM TAB_B\nWHERE COL2 NOT IN (SELECT COL1 FROM TAB_A);",
"answerSql": "SELECT COUNT(*) FROM TAB_B WHERE COL2 NOT IN (SELECT COL1 FROM TAB_A)"
```

### 3. ODD_ONE_OUT 작성 규칙

- `stem`에는 SQL을 넣지 않는다. 테이블 구조와 요구사항만 설명한다
- `answerSql`은 나머지 3개와 **다른 결과를 내는 SQL** (소수 쪽, 즉 "틀린 쪽")을 넣는다
- AI가 answerSql과 다른 결과를 내는 선택지 3개를 자동 생성해 4지선다를 구성한다

```
// ODD_ONE_OUT 예시
"stem": "다음 중 SQL 실행 결과가 나머지와 다른 것은?\n\n테이블: PLAYER (PLAYER_ID INT, TEAM VARCHAR(1), WEIGHT INT)",
"answerSql": "SELECT * FROM PLAYER WHERE TEAM = 'A' OR TEAM = 'B' AND WEIGHT > 65"
// → AND 우선순위로 인해 의도와 다른 결과를 내는 '틀린 SQL'이 answerSql
```

### 4. schemaDdl 작성 규칙

**MariaDB 호환 SQL**로 작성한다. Oracle 전용 문법은 사용 금지.

| Oracle 전용 (금지) | MariaDB 호환 (사용) |
|--------------------|---------------------|
| `ROWNUM` | `LIMIT` |
| `VARCHAR2` | `VARCHAR` |
| `NUMBER` | `INT` 또는 `DECIMAL` |
| `DUAL` 테이블 | 직접 CREATE 또는 구조 변경 |

- FK 참조 대상(부모 테이블)을 **먼저** 생성한다
- 문제에서 실제로 사용하는 컬럼만 포함한다. 불필요한 컬럼 추가 금지
- 문자열 내 줄바꿈은 반드시 `\n`으로 표현한다 (실제 줄바꿈 입력 금지)

```
// 올바른 schemaDdl 예시
"schemaDdl": "CREATE TABLE dept (\n  dept_id INT PRIMARY KEY,\n  dept_name VARCHAR(50)\n);\nCREATE TABLE emp (\n  emp_id INT PRIMARY KEY,\n  name VARCHAR(50),\n  dept_id INT\n);"
```

### 5. schemaSampleData 작성 규칙

- `answerSql`을 실행했을 때 **의미 있는 결과**가 나오는 최소한의 데이터를 넣는다
- 정답과 오답을 구분하기 위한 **경계값 데이터**를 반드시 포함한다

| 문제 유형 | 필수 포함 데이터 |
|-----------|-----------------|
| NULL 비교 (`IS NULL`, `NOT IN` 등) | NULL 값이 포함된 행 |
| OUTER JOIN | 조인 매칭이 안 되는 행 |
| ODD_ONE_OUT | 조건 분기가 명확히 나뉘는 데이터 |
| 집계 함수 | 그룹별로 의미 있는 차이가 나는 데이터 |
| 계층형 쿼리 | 부모-자식 관계가 2단계 이상 있는 데이터 |

### 6. answerSql 작성 규칙

- `SELECT` 문만 가능하다 (INSERT/UPDATE/DELETE 불가)
- **한 줄**로 작성한다 (줄바꿈 없이)
- AI_ONLY이면 stem의 SQL을 그대로 한 줄로 복사한다
- ODD_ONE_OUT이면 나머지 3개와 **다른 결과**를 내는 SQL을 넣는다

---

## JSON 스키마 (단건 전체 예시)

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

---

## 필드 규칙 요약

| 필드 | 필수 여부 | 설명 |
|------|-----------|------|
| `topicCode` | 필수 | 위 목록에서 정확히 선택 |
| `difficulty` | 필수 | 1~5 정수. 개념 암기=1, 단순 SQL=2, 실행 추적=3, 복합 JOIN/서브쿼리=4, 윈도우/계층=5 |
| `executionMode` | 필수 | `EXECUTABLE` 또는 `CONCEPT_ONLY` |
| `choiceSetPolicy` | 선택 | EXECUTABLE만 의미 있음. 생략 시 `AI_ONLY`. CONCEPT_ONLY면 null |
| `stem` | 필수 | **질문 문장만. 선택지 절대 금지.** EXECUTABLE+AI_ONLY면 SQL 포함. `\n` 줄바꿈 |
| `schemaDisplay` | **EXECUTABLE 필수** | 화면에 표시되는 테이블 구조 요약. `테이블명 (컬럼명 타입, ...)` 형태로 줄바꿈(`\n`)으로 구분. CONCEPT_ONLY면 null |
| `hint` | 선택 | 핵심 개념 또는 함정 포인트 한 줄. 없으면 null |
| `schemaDdl` | EXECUTABLE 필수 | MariaDB 호환 CREATE TABLE 문. CONCEPT_ONLY면 null |
| `schemaSampleData` | 선택 | 실행 결과 재현용 최소 INSERT 문. 경계값 필수 포함. CONCEPT_ONLY면 null |
| `schemaIntent` | 선택 | 스키마가 테스트하는 개념 한 줄. CONCEPT_ONLY면 null |
| `answerSql` | EXECUTABLE 필수 | 정답 SELECT 쿼리 한 줄. CONCEPT_ONLY면 null |

---

## AI 변환 프롬프트 (단건용)

```
당신은 SQLD 문제를 passQL JSON 명세로 변환하는 전문가입니다.
아래 규칙을 엄격히 따라 JSON 코드블록 하나만 출력하세요. 설명, 주석, 마크다운 없이 JSON만.

=== stem 작성 핵심 규칙 ===
stem에는 질문 문장만 작성한다. 선택지(①②③④, 1. 2. 3. 4., A B C D)는 절대 포함하지 않는다.
AI가 stem을 읽고 선택지를 동적으로 생성하므로, 선택지가 stem에 있으면 중복 문제가 발생한다.

나쁜 예: "다음 설명 중 맞는 것은?\n1. 테이블은 하나만 존재한다.\n2. 데이터는 파일에 저장된다."
좋은 예 (CONCEPT_ONLY): "엔터티(Entity)의 특성에 대한 설명 중 옳지 않은 것은?"
좋은 예 (EXECUTABLE AI_ONLY): "다음 SQL의 실행 결과로 올바른 것은?\n\nSELECT * FROM TAB WHERE COL IS NULL;"
좋은 예 (EXECUTABLE ODD_ONE_OUT): "다음 중 SQL 실행 결과가 나머지와 다른 것은?\n\n테이블: PLAYER (TEAM VARCHAR, WEIGHT INT)"

=== EXECUTABLE 필드 규칙 ===

choiceSetPolicy 선택:
  "AI_ONLY"     → "다음 SQL의 실행 결과로 올바른 것은?" 유형
                   stem에 SQL 포함 / answerSql = stem의 SQL과 동일한 쿼리 (한 줄)
  "ODD_ONE_OUT" → "다음 중 SQL 실행 결과가 다른 것은?" 유형
                   stem에 SQL 미포함, 테이블·조건만 설명
                   answerSql = 나머지 3개와 다른 결과를 내는 SQL (소수 쪽)

schemaDdl 작성:
  - MariaDB 호환 필수: ROWNUM→LIMIT, VARCHAR2→VARCHAR, NUMBER→INT, DUAL 사용 금지
  - 부모 테이블 먼저 생성 (FK 순서)
  - 문제에서 쓰는 컬럼만 포함
  - 줄바꿈은 \n

schemaSampleData 작성:
  - answerSql 실행 시 의미 있는 결과가 나오는 최소 INSERT 문
  - NULL 포함 문제 → NULL 행 필수
  - OUTER JOIN 문제 → 매칭 안 되는 행 필수
  - ODD_ONE_OUT → 조건 분기가 명확히 나뉘는 데이터

answerSql 작성:
  - SELECT 문만, 한 줄로 작성
  - AI_ONLY: stem의 SQL 그대로 복사
  - ODD_ONE_OUT: 나머지와 다른 결과를 내는 SQL

=== 공통 필드 규칙 ===

topicCode: data_modeling | sql_basic_select | sql_ddl_dml_tcl | sql_function |
           sql_join | sql_subquery | sql_group_aggregate | sql_window | sql_hierarchy_pivot

difficulty: 1=개념 암기, 2=단순 SQL, 3=실행 추적, 4=복합 JOIN/서브쿼리, 5=윈도우/계층/PIVOT

executionMode:
  "EXECUTABLE"   → SQL 실행 결과를 묻는 문제
  "CONCEPT_ONLY" → 개념·이론·용어 문제. 모든 스키마 필드 null.

hint: 핵심 개념 또는 함정 포인트 한 줄. 없으면 null.
schemaDisplay: EXECUTABLE 필수. "테이블명 (컬럼명 타입, ...)\n테이블명2 (컬럼명 타입, ...)" 형태.
  schemaDdl의 CREATE TABLE을 보고 반드시 작성한다. CONCEPT_ONLY면 null.
  예시: "EMP (ID INT, NAME VARCHAR, DEPT_ID INT)\nDEPT (DEPT_ID INT, DEPT_NAME VARCHAR)"
schemaIntent: 스키마가 테스트하는 개념 한 줄. CONCEPT_ONLY면 null.

=== 변환할 문제 ===

[여기에 SQLD 문제 붙여넣기]
```
