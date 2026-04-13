# 🎨[디자인][AnswerFeedback] 단일 문제 결과 화면 UI 전면 개선

**라벨**: `작업전`
**담당자**: 

---

🖌️요청 내용
---

단일 문제 풀기(`/questions/:uuid/result`) 결과 화면(`AnswerFeedback`)의 헤더 및 전체 UI를 개선한다.

현재 문제점:
- 원형 아이콘(Check/X)이 너무 크고 AI스러운 인상을 줌
- 선택지/정답 카드에 왼쪽 4px 보더가 있어 답답해 보임
- "AI에게 자세히 물어보기" 버튼이 불필요하게 노출됨
- 헤더 디자인이 passQL 디자인 시스템과 이질적

🎯기대 결과
---

**헤더 변경 (B 방향)**
- 원형 아이콘 제거
- 상단 3px 컬러 바 (오답: `#EF4444`, 정답: `#22C55E`) 좌→우 슬라이드인 애니메이션
- 헤더 배경 항상 흰색 유지
- 헤더 내부: 도트 + 상태 eyebrow ("오답" / "정답") → 큰 제목 ("틀렸어요" / "맞혔어요!") → 부제목

**선택지/정답 카드**
- 왼쪽 4px 보더 제거
- 기존 배경색(`#FEF2F2` / `#F0FDF4`) + border만 유지

**버튼**
- "문제 목록으로" 버튼 항상 인디고(`#4F46E5` / `btn-primary`) 고정

**제거**
- "AI에게 자세히 물어보기" 버튼 완전 제거

**애니메이션**
- 헤더: slideDown
- 선택지/정답/해설 카드: 순차 slideUp (stagger)

📋참고 자료
---

- 관련 파일: `client/src/pages/AnswerFeedback.tsx`
- 디자인 시스템: `client/.claude/rules/Design.md`
- 목업: `.superpowers/brainstorm/1353-1776007085/content/result-b-refined.html`

💡추가 요청 사항
---

- 코드 내부 스타일은 `style={{ }}` 인라인 금지, daisyUI 클래스 최대 활용
- Tailwind CSS 유틸리티 또는 `src/styles/components.css` 커스텀 클래스 사용

🙋‍♂️담당자
---

- 프론트엔드: 
