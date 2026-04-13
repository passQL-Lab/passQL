# ⚙️[기능개선][AI] generate_choice_set 동치 SQL 패턴 금지 프롬프트 개선 #126

## 개요

`EXECUTABLE` + `AI_ONLY` 문제에서 선택지 생성 시 AI가 문법만 다른 동치 SQL을 오답 선지로 반복 생성하여 `CHOICE_SET_VALIDATION_MULTIPLE_CORRECT` 에러가 발생하는 문제를 두 가지 방향으로 해결했다.

1. **근본 원인 개선**: v4 프롬프트에 동치 패턴 금지 규칙을 추가해 AI가 동치 SQL을 생성하는 빈도 자체를 낮춤
2. **최후 방어선 추가**: 3회 재시도 후에도 `MULTIPLE_CORRECT`로 실패하면 AI의 `isCorrect` 판단을 신뢰해 fallback 저장 — 사용자에게 선택지를 최대한 보여줌

## 변경 사항

### 프롬프트 버전 전환 (DB 마이그레이션)
- `server/PQL-Web/src/main/resources/db/migration/V0_0_73__improve_choice_set_prompt_anti_equivalence.sql`
  - `generate_choice_set` v3 → `is_active = FALSE` 비활성화
  - `generate_choice_set` v4 신규 INSERT — 동치 SQL 패턴 금지 규칙 포함

### MULTIPLE_CORRECT Fallback 저장 (백엔드 로직)
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetSaveService.java`
  - `saveWithAiCorrect()` 메서드 추가 — `sandboxValidationPassed=false`, AI `isCorrect` 직접 사용
- `server/PQL-Domain-Question/src/main/java/com/passql/question/service/ChoiceSetGenerationService.java`
  - `generate()` 최종 실패 분기에 fallback 로직 추가
  - 조건: `MULTIPLE_CORRECT` + AI `isCorrect=true` 개수가 1개 이상 && 전체 개수 미만 → fallback 저장 후 반환
  - 전부 정답(`aiCorrectCount == choices.size()`)이거나 0개이면 기존대로 에러

## 주요 구현 내용

**기존 v3의 한계**

"오답은 결과가 달라야 한다"는 추상적 규칙만 존재하여 AI가 아래와 같은 동치 변형을 오답으로 반복 생성했다.

| 동치 패턴 유형 | 예시 |
|---|---|
| 키워드 변형 | `INNER JOIN` → `JOIN`, `!=` → `<>` |
| 조건 방향 전환 | `B.SALARY <= A.SALARY` → `A.SALARY >= B.SALARY` |
| GROUP BY 컬럼 조합 | `GROUP BY A.ID, A.NAME` → `GROUP BY A.NAME` |
| 컬럼 별칭 변형 | `AS TOTAL` → `AS TOTAL_SALARY` |
| ORDER BY 기본값 | `ORDER BY A.NAME ASC` → `ORDER BY A.NAME` |
| 서브쿼리 ↔ JOIN 변환 | 결과가 동일한 경우 |
| 불필요한 DISTINCT | 중복 없는 쿼리에 DISTINCT 추가 |

**v4 개선 사항**

`system_prompt`에 위 7가지 동치 패턴을 구체적 예시와 함께 명시적으로 금지했다. AI가 오답 선지를 생성하기 전 "이 SQL이 기준 SQL과 같은 결과를 낼 가능성이 있는가?"를 먼저 점검하도록 유도 문구도 추가했다.

**MULTIPLE_CORRECT Fallback 로직**

3회 재시도 후에도 `MULTIPLE_CORRECT`로 실패한 경우, AI의 `isCorrect` 마킹을 신뢰해 저장한다. "동치 SQL 찾기" 유형은 샌드박스가 "실행 결과가 같다"는 것만 알고, AI는 "의미론적으로 어떤 게 정답인지"를 알고 있기 때문이다. 정답이 여러 개여도 사용자가 그 중 하나를 고르면 정답 처리되므로 학습 목적상 문제없다.

| fallback 조건 | 처리 |
|---|---|
| `isCorrect=true` 1~3개 | fallback 저장 (`sandboxValidationPassed=false`), 선택지 표시 |
| `isCorrect=true` 4개 (전부) | 에러 — 문제로서 의미 없음 |
| `isCorrect=true` 0개 | 에러 |

## 주의사항

- v4는 `WHERE NOT EXISTS` 가드를 사용하므로 마이그레이션 재실행 시 중복 INSERT되지 않는다.
- v4 배포 이후에도 Sandbox 검증(`CHOICE_SET_VALIDATION_MULTIPLE_CORRECT`)은 그대로 유지된다. 프롬프트 개선은 에러 발생 빈도를 줄이는 것이지 검증 자체를 우회하지 않는다.
- 동치 패턴 목록은 실제 실패 사례 기반으로 작성되었다. 신규 동치 패턴이 발견되면 v5 마이그레이션으로 추가해야 한다.
- fallback으로 저장된 세트는 `sandbox_validation_passed=false`로 기록되어 추후 데이터 품질 모니터링에 활용할 수 있다.
