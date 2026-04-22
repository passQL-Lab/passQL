# ⚙️[기능개선][FE] EXECUTABLE 문제 채점 시 실제 DB 실행 마이크로카피 추가

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- 채점 중 로딩 화면과 채점 결과 피드백 바에 "채점 중이에요" / "정답이에요!" 문구만 표시됨
- passQL의 핵심 기술 차별점인 **실제 Oracle DB에서 SQL을 직접 실행하여 정답 판정**하는 사실이 사용자에게 전혀 노출되지 않음
- EXECUTABLE 문제와 CONCEPT_ONLY 문제가 동일한 UX로 표시되어 차별성이 없음

🛠️해결 방안 / 제안 기능
---

- EXECUTABLE 문제 채점 중 `LoadingOverlay`에 실제 DB 실행 사실을 알리는 랜덤 마이크로카피 표시
- 채점 완료 후 `PracticeFeedbackBar` 해설 아래에 동일한 취지의 랜덤 문구 표시
- CONCEPT_ONLY 문제에는 표시하지 않음
- 문구는 5개 중 랜덤으로 노출 (매번 다른 표현으로 신선함 유지)

⚙️작업 내용
---

- `client/src/constants/microcopy.ts` — `EXECUTABLE_GRADING_MESSAGES` 배열 및 `getRandomExecutableGradingMessage()` 함수 추가
- `client/src/components/LoadingOverlay.tsx` — `isExecutable` prop 추가, 채점 중일 때 랜덤 문구 표시
- `client/src/components/PracticeFeedbackBar.tsx` — `result.correctResult != null` 조건으로 EXECUTABLE 판단, 해설 하단에 랜덤 문구 표시
- `client/src/pages/PracticeSet.tsx` — `displayQuestion.executionMode === "EXECUTABLE"` 전달
- `client/src/pages/QuestionDetail.tsx` — `question.executionMode === "EXECUTABLE"` 전달

🙋‍♂️담당자
---

- 프론트엔드: 
