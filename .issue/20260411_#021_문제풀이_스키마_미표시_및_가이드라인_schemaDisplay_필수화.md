# ⚙️[기능개선][문제풀이] 문제풀이 화면 스키마 미표시 및 가이드라인 schemaDisplay 필수화

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- EXECUTABLE 문제 풀이 화면에서 "스키마 보기" 버튼이 표시되지 않아 테이블 구조를 확인할 수 없음
- 기존 등록된 모든 문제의 `schema_display` 컬럼이 NULL — 문제 등록 시 가이드라인이 해당 필드를 "선택" 사항으로 명시해 AI 변환 시 생략됨
- `question-bulk-guide.md`, `question-register-guide.md`의 필드 규칙 표와 AI 변환 프롬프트 모두 `schemaDisplay`를 선택으로 표기 → AI가 일관되게 필드를 누락
- 사용자가 SQL 실행 결과를 예측하려면 테이블 구조(컬럼명·타입)를 반드시 알아야 하는데 화면에 아무 정보도 없는 상태

🛠️해결 방안 / 제안 기능
---

- `question-bulk-guide.md`, `question-register-guide.md`의 `schemaDisplay` 필드 규칙을 **EXECUTABLE 필수**로 변경
- 두 가이드의 AI 변환 프롬프트 섹션에 `schemaDisplay` 작성 규칙 및 예시 명시 (`schemaDdl`을 보고 반드시 생성)
- 프론트엔드 `SchemaViewer` 컴포넌트에 폴백 로직 추가: `schemaDisplay`가 null이면 `schemaDdl`(CREATE TABLE 문)을 파싱해 테이블 카드로 렌더링
- `QuestionDetail` 페이지의 스키마 섹션 노출 조건을 `schemaDisplay` 존재 여부에서 `schemaDisplay || schemaDdl` 존재 여부로 완화

🙋‍♂️담당자
---

- **백엔드**: 
- **프론트엔드**: 
- **디자인**: 
