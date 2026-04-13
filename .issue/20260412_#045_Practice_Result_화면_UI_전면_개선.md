# 🎨[디자인][PracticeResult] Practice Result 화면 UI 전면 개선

**라벨**: `작업전`
**담당자**: 

---

🖌️요청 내용
---

현재 Practice Result 화면(StepNavigator + PracticeResult)의 전반적인 UI/UX가 일관성 없고 AI 교육 프로젝트 브랜딩이 부족하여 전면 개선이 필요함

**StepNavigator 문제점**
- 첫 스텝에만 홈 아이콘(직사각형 bordered box)이 표시되고, 이후 스텝에서는 `<` 뒤로가기 아이콘으로 바뀌어 시각적 불일치 발생
- 상단 `1/3` 텍스트와 하단 점 인디케이터(•••)가 중복으로 존재
- "다음 >" 버튼의 ChevronRight 아이콘 불필요
- "다른 카테고리 ⊞" 텍스트 및 아이콘이 맥락에 맞지 않음

**PracticeResult 스텝별 문제점**
- 스텝 1: ScoreCountUp 완료 후 통계 수치(정답률/총시간/평균)가 한꺼번에 표시되어 애니메이션 없음. "평균"이 무엇의 평균인지 불명확
- 스텝 2: AI 리뷰 코멘트가 단순 텍스트 덩어리로 AI 프로젝트 브랜딩 부재
- 스텝 3: 문제 카드 클릭 시 문제 preview 없음

---

🎯기대 결과
---

**StepNavigator 개선**
- 상단 헤더(홈 버튼, N/total 텍스트) 완전 제거 — 결과 화면은 단방향 흐름
- 점 인디케이터를 상단으로 이동하여 진행 단계를 첫눈에 파악 가능
- 하단 버튼: 중간 스텝 "다음", 마지막 스텝 "카테고리 목록으로" (아이콘 제거)

**스텝 1 — 점수 화면**
- ScoreCountUp 카운트업 완료 후 통계 항목이 150ms 간격으로 순차 등장 (staggered 애니메이션, 아래에서 위로 + fade in, 300ms ease-out)
- 각 레이블 앞에 lucide-react 회색 아이콘 표시: `🎯 정답률` / `🕐 총 시간` / `⏱ 문제당 평균`
- "평균" → "문제당 평균"으로 레이블 명확화

**스텝 2 — AI 리뷰**
- `Sparkles` 아이콘 + "AI 분석" 인디고 pill 뱃지 추가
- 코멘트를 인디고 왼쪽 border 카드로 감싸 AI 생성 콘텐츠임을 시각적으로 구분

**스텝 3 — 문제별 결과**
- 문제 카드 클릭 시 300ms ease-out 아코디언으로 펼치기
- 펼쳐지면 문제 전체 지문 + 내가 선택한 답 + 정답 여부 표시
- 한 번에 하나의 카드만 펼쳐짐

---

📋참고 자료
---

- 스펙 문서: `docs/superpowers/specs/2026-04-12-practice-result-ui-redesign.md`
- 관련 파일: `client/src/components/StepNavigator.tsx`, `client/src/pages/PracticeResult.tsx`

---

💡추가 요청 사항
---

- 인라인 `style={{ }}` 사용 금지 — Tailwind CSS 유틸리티 클래스만 사용
- 아이콘은 반드시 `lucide-react` 패키지 사용, 이모지 금지
- 디자인 시스템(`client/.claude/rules/Design.md`) 준수

---

🙋‍♂️담당자
---

- 프론트엔드: 
