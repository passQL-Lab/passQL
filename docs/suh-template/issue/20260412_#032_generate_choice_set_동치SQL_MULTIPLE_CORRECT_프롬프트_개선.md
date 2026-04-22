# ⚙️[기능개선][AI] generate_choice_set 동치 SQL 패턴 금지 프롬프트 개선

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- `executionMode=EXECUTABLE`, `choiceSetPolicy=AI_ONLY` 문제에서 선택지 생성 시 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 에러가 반복 발생한다.
- Non EQUI Self Join (Running Total) 같이 SQL 동치 표현이 구조적으로 많은 문제에서 AI가 문법만 다른 동치 SQL을 오답 선지로 생성한다.
- 예시 동치 패턴: `INNER JOIN` → `JOIN`, `B.SALARY <= A.SALARY` → `A.SALARY >= B.SALARY`, `GROUP BY A.ID, A.NAME` → `GROUP BY A.NAME`
- 현재 v3 프롬프트에 "오답은 결과가 달라야 한다"는 규칙은 있으나 구체적인 동치 패턴 예시가 없어 AI가 반복 실수한다.
- 3회 재시도 후에도 실패 시 사용자에게 선택지가 표시되지 않는다.

🛠️해결 방안 / 제안 기능
---

- `generate_choice_set` 프롬프트 v4 추가 — system_prompt에 동치 SQL 패턴 구체적 예시와 금지 규칙 명시
- 금지 패턴 목록: 키워드 변형, 조건 방향 전환, GROUP BY 컬럼 조합, 컬럼 별칭 변경, ORDER BY 기본값 생략, 불필요한 DISTINCT 추가
- "오답 작성 전 기준 SQL과 같은 결과를 낼 가능성을 먼저 점검하라" 지시 추가

⚙️작업 내용
---

- `V0_0_73__improve_choice_set_prompt_anti_equivalence.sql` 마이그레이션 추가 (완료)
  - `generate_choice_set` v3 비활성화
  - `generate_choice_set` v4 활성화 — 동치 패턴 금지 규칙 포함

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
