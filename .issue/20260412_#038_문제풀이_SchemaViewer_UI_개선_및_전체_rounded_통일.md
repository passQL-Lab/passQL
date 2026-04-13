# 🎨[디자인][문제풀이] SchemaViewer UI 개선 및 전체 rounded 통일

**라벨**: `작업전`
**담당자**: 

---

🖌️요청 내용
---

- `SchemaViewer` 컴포넌트의 스키마 표시 UI 전반 개선
- `schemaIntent`(DB 설계자용 메모) UI 노출 제거
- DDL 접기/펼치기 토글 제거
- "EMP 샘플" 등 어색한 레이블 제거
- 스키마 구조 카드와 샘플 데이터 카드를 분리(8px 간격)하여 같은 스타일로 통일
- PK/FK 표현을 아이콘 대신 `ID(PK)`, `DEPT_ID(FK)` 인라인 텍스트로 변경
- 전체 컴포넌트 `rounded-lg` / `rounded-2xl` / `rounded-md` → `rounded-xl`로 통일
- fixed bottom 버튼 영역의 불필요한 `border-t border-border` 제거

🎯기대 결과
---

- 문제 풀이 화면에서 스키마 정보가 compact하고 일관된 스타일로 표시됨
- 사용자에게 불필요한 정보(schemaIntent, DDL) 노출 없이 컬럼 구조와 샘플 데이터만 전달
- 앱 전체 카드/컨테이너 radius가 `rounded-xl`(12px)로 통일되어 시각적 일관성 확보
- 버튼 위 불필요한 구분선 제거로 UI 깔끔함 향상

📋참고 자료
---

- 관련 파일: `client/src/components/SchemaViewer.tsx`
- 관련 파일: `client/src/pages/QuestionDetail.tsx`
- 관련 파일: `client/src/pages/AnswerFeedback.tsx`
- rounded 변경 대상: `ChoiceCard`, `SqlPlayground`, `LoadingOverlay`, `ChoiceReview`, `StepNavigator`, `StatsAnalysisCard`, `PracticeFeedbackBar`, `ConfirmModal`, `AiExplanationSheet`, `PracticeSet`, `DailyChallenge`, `CategoryCards`, `Questions`, `PracticeResult`

💡추가 요청 사항
---

- `HeatmapCalendar`의 `rounded-sm`(히트맵 셀)과 `rounded-full`(원형 요소)은 변경 대상에서 제외
- `ConfirmModal`, `AiExplanationSheet`의 `rounded-t-xl`(바텀시트 상단 모서리)은 유지

🙋‍♂️담당자
---

- 프론트엔드:
