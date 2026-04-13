# 🎨[디자인][AnswerFeedback] 단일 문제 결과 화면 UI 전면 개선 v2

**라벨**: `작업전`
**담당자**: 

---

🖌️요청 내용
---

홈화면의 AI 추천문제 및 오늘의 문제에서 진입하는 단일 문제 결과 화면(`AnswerFeedback`)의 UI를 전면 개선한다.

현재 문제점:
- EXECUTABLE 모드에서 A/B/C/D 선택지가 모두 펼쳐져 표시되어 정보 과부하 발생
- 문제를 풀고 나면 어떤 문제였는지 확인하는 수단이 없음
- "SQL 실행 비교" 섹션이 너무 길어 해설 등 핵심 정보에 접근하기 어려움
- 실제 SQL을 실행하고 있다는 점(학습 실습 가능)이 UI에서 드러나지 않음

🎯기대 결과
---

**문제 보기 토글 카드 추가**
- 상단에 접이식 "문제 보기" 카드 추가 (기본: 접힘)
- lucide `BookOpen` 아이콘 사용 (프로젝트 기존 아이콘)
- 펼치면 토픽 뱃지 + 문제 지문(stem) 표시

**SQL 실행 비교 섹션 아코디언 구조 개편**
- 내 선택 카드 + 정답 카드: 기본 펼침 (결과 테이블 바로 노출)
- 나머지 선택지: 기본 접힘 (SQL 프리뷰 + 행수 pill 표시)
- 정답일 경우: "내 선택 · 정답" 단일 카드만 펼침
- A/B/C/D 키 레이블 제거 — 정답/내 선택 뱃지로 구분

**실행 버튼 구조**
- SQL 섹션 상단에 "모두 실행" 버튼 (미실행 선택지 일괄 실행)
- 접힌 카드 내부에 개별 "실행" 버튼 병행 제공

📋참고 자료
---

- 관련 파일: `client/src/pages/AnswerFeedback.tsx`
- 관련 파일: `client/src/pages/QuestionDetail.tsx` (stem/topicName navigate state 추가 필요)
- 디자인 시스템: `client/.claude/rules/Design.md`
- 목업: `.superpowers/brainstorm/1353-1776007085/content/answer-feedback-full.html`

💡추가 요청 사항
---

- `style={{ }}` 인라인 금지, daisyUI 클래스 및 `src/styles/components.css` 커스텀 클래스 사용
- `FeedbackState` 인터페이스에 `stem`, `topicName` 필드 추가 필요
- `QuestionDetail.tsx`에서 navigate state에 `stem`, `topicName` 전달 필요
- 기존 dead code 제거: `AiExplanationSheet`, `diffMutation`, `diffExplain` import

🙋‍♂️담당자
---

- 프론트엔드: 
