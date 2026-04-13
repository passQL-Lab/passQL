# 🎨[디자인][FE] 에러 상태 UI 전면 개선 — ErrorFallback·홈화면 인라인 에러·버튼 스타일 통일

**라벨**: `작업전`
**담당자**: 

---

🖌️요청 내용
---

서비스 전반의 에러 상태 UI가 일관성 없고 미완성처럼 보이는 문제를 개선한다.

**개선 대상 및 내용**

1. **`ErrorFallback` 컴포넌트 전면 개선**
   - 기존: 텍스트 한 줄 + 재시도 버튼만 존재. 빈 공간이 허전하고 에러 원인을 전혀 안내하지 않음
   - 개선: `card-base` 카드 안에 lucide-react 아이콘 + 제목 + 설명 텍스트 + 재시도 버튼으로 구성
   - `errorType` prop (`network` / `server` / `auth` / `generic`) 추가 — 단, 호출부에서 원인을 정확히 알 수 없는 경우 기본값 `generic`("데이터를 불러올 수 없어요") 사용. 원인 추측으로 하드코딩하는 것은 금지
   - 재시도 버튼: `btn-secondary`(44px, 너무 큼) → `btn-compact`(32px)로 교체

2. **홈화면 인라인 에러 버튼 통일**
   - 기존: daisyUI `btn btn-xs btn-outline btn-primary` — 인디고 배경이 꽉 차는 큰 스타일로 나타남
   - 개선: 프로젝트 커스텀 `btn-compact`로 통일

3. **홈화면 카드 스타일 통일**
   - 기존: daisyUI `card bg-white p-4 sm:p-6 shadow-sm` 혼용
   - 개선: 디자인 시스템 `card-base`로 전면 교체

4. **홈화면 에러 섹션 레이아웃 개선**
   - 히트맵 에러: 가로 배치(텍스트|버튼) → 세로 중앙 정렬로 변경
   - 통계/준비도 에러: 가로 한 줄 카드 → 로딩 skeleton과 동일한 2칸 그리드 자리에 `col-span-2` 카드로 배치 (레이아웃 안정)

5. **에러 시 페이지 헤딩 유지**
   - 기존: `Stats`, `CategoryCards` 에러 발생 시 헤딩 없이 `ErrorFallback` 카드만 단독 반환
   - 개선: 헤딩("내 실력, 한눈에" / "AI문제 풀기")을 항상 먼저 렌더링하고, 에러 카드를 그 아래에 배치

6. **SQL 실행 에러 인라인 UI 개선** (`AnswerFeedback`)
   - 기존: 에러 메시지 날것 텍스트 + 재시도 버튼이 스타일 없이 나열
   - 개선: `error-card` 클래스로 감싸고 `AlertCircle` 아이콘 추가, `RefreshCw` 아이콘 포함 재시도 버튼

7. **오늘의 문제 없음 fallback 문구 수정**
   - 기존: "AI문제 풀기 / SQL AI문제를 풀어보세요" — 홍보 문구처럼 어색
   - 개선: "오늘의 문제 / 오늘은 등록된 문제가 없어요"

---

🎯기대 결과
---

- 에러 상태에서도 사이트가 완성도 있어 보임
- 버튼 스타일이 페이지 전체에서 일관되게 동작
- 에러 원인을 잘못 추측해서 "서버에 문제가 생겼어요" 같은 틀린 안내가 뜨지 않음
- 에러 발생 시에도 페이지 제목/헤딩이 유지되어 현재 위치를 알 수 있음

---

📋참고 자료
---

- 수정 파일: `client/src/components/ErrorFallback.tsx`
- 수정 파일: `client/src/pages/Home.tsx`
- 수정 파일: `client/src/pages/Stats.tsx`
- 수정 파일: `client/src/pages/Questions.tsx`
- 수정 파일: `client/src/pages/CategoryCards.tsx`
- 수정 파일: `client/src/pages/AnswerFeedback.tsx`
- 디자인 시스템: `client/.claude/rules/Design.md`

---

💡추가 요청 사항
---

- 추후 `ApiError.status`를 기반으로 `errorType`을 정확히 분류하는 로직 추가 고려 (401 → auth, 5xx → server, network error → network)

---

🙋‍♂️담당자
---

- 프론트엔드:
