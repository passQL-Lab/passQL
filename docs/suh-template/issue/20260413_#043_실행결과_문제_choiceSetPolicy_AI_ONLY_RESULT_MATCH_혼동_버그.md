# ❗[버그][Question] "실행 결과로 올바른 것은?" 문제가 AI_ONLY로 등록되어 선택지가 SQL 쿼리로 생성되는 버그

**라벨**: `작업전`
**담당자**: 

---

🗒️설명
---

- "다음 SQL의 실행 결과로 올바른 것은?" stem을 가진 EXECUTABLE 문제가 `choiceSetPolicy: AI_ONLY`로 등록되어 있어, 선택지가 **결과 테이블이 아닌 SQL 쿼리**로 생성된다.
- 해당 유형은 `RESULT_MATCH` 정책이어야 선택지가 실행 결과 테이블(JSON 배열)로 생성되지만, `AI_ONLY`로 등록되어 "동일한 결과를 내는 SQL"이 선택지로 나온다.
- **원인**: 문제 등록 가이드 문서(`question-single-guide.md`, `question-bulk-guide.md`)의 JSON 예시와 AI 변환 프롬프트에서 `AI_ONLY`와 `RESULT_MATCH`의 stem 패턴을 혼동하여 기술하고 있었음.

🔄재현 방법
---

1. 관리자 페이지에서 문제 목록 조회 (토픽: 윈도우 함수)
2. stem이 "다음 SQL의 실행 결과로 올바른 것은?"인 문제 확인 (예: `b3abd2eb`)
3. `choiceSetPolicy`가 `AI_ONLY`로 되어 있고, 선택지가 SQL 쿼리 4개로 생성되어 있음
4. 사용자 앱에서 해당 문제를 풀면 "실행 결과를 고르라"는 질문에 SQL 쿼리가 선택지로 표시됨

📸참고 자료
---

- 영향받는 문제 예시: `b3abd2eb-eaae-4841-95aa-0a44ba9c9320` (LAG 함수 문제)
- 가이드 문서는 이미 수정 완료 (stem 패턴과 choiceSetPolicy 매핑 일치하도록)

✅예상 동작
---

- stem이 "다음 SQL의 실행 결과로 올바른 것은?"이면 `choiceSetPolicy: RESULT_MATCH`로 등록되어야 한다.
- 선택지는 SQL 쿼리가 아닌 **실행 결과 테이블**(JSON 배열 → 컴팩트 테이블)로 표시되어야 한다.
- `AI_ONLY`는 "다음 SQL과 동일한 실행 결과를 내는 SQL은?" 유형에만 사용되어야 한다.

⚙️환경 정보
---

- **영향 범위**: 기존에 AI_ONLY로 잘못 등록된 "실행 결과로 올바른 것은?" 유형 문제 전체
- **가이드 문서 수정**: 완료 (`question-single-guide.md`, `question-bulk-guide.md`)
- **기존 문제 데이터 수정**: 미완료 (choiceSetPolicy 변경 + 선택지 재생성 필요)

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
