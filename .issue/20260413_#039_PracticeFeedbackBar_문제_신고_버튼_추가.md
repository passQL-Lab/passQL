# ⚙️[기능추가][문제신고] PracticeFeedbackBar에 문제 신고 버튼 추가

**라벨**: `작업전`
**담당자**: 

---

📝현재 문제점
---

- 문제 신고 API(POST `/api/questions/{questionUuid}/report`)와 관리자 화면은 구현 완료
- 그러나 신고 진입점이 세션 종료 후 결과 화면(`PracticeResult`)에만 존재
- 사용자가 문제를 풀고 제출 직후 정답/오답 바텀시트(`PracticeFeedbackBar`)에는 신고 버튼이 없어 즉시 신고 불가

🛠️해결 방안 / 제안 기능
---

- `PracticeFeedbackBar` 헤더 우측 상단에 신고 아이콘 버튼 추가
- 아이콘: `lucide-react`의 `Flag` (신고/오류 표시 의미)
- 클릭 시 `ReportModal` 표시 — 기존 모달 컴포넌트 재사용
- 이미 신고한 제출(`submissionUuid` 기준)이면 아이콘 비활성화 (`opacity-40`, `cursor-not-allowed`)
- 신고 완료 시 토스트 표시 (기존 `PracticeResult`의 토스트 패턴 동일)

⚙️작업 내용
---

**`client/src/components/PracticeFeedbackBar.tsx`**
- Props 추가:
  - `questionUuid: string` — 신고 대상 문제 UUID
  - `submissionUuid?: string` — 제출 UUID (없으면 신고 버튼 미표시)
  - `choiceSetUuid?: string` — 선택지 세트 UUID (신고 정확도 향상용)
  - `onReport?: () => void` — 신고 버튼 클릭 핸들러 (모달 열기)
  - `isReported?: boolean` — 이미 신고한 경우 비활성화 여부
- 헤더 오른쪽 상단에 `Flag` 아이콘 버튼 배치
  - 정답/오답 상태와 무관하게 항상 표시 (submissionUuid 있을 때만)
  - 이미 신고 시: `opacity-40 cursor-not-allowed` + `disabled`

**`client/src/pages/PracticeSet.tsx`**
- `feedback` state에 `submissionUuid`, `choiceSetUuid` 포함 여부 확인 (`SubmitResult` 타입에 이미 존재)
- `PracticeFeedbackBar` 호출부에 신고 관련 props 전달
- 신고 완료된 submissionUuid 목록 state 관리 (`Set<string>`)
- `ReportModal` import 및 마운트 (feedback 상태일 때만)
- 신고 완료 시 토스트 표시

**API 명세 (기존 구현 완료, 연동만 필요)**

```
POST /api/questions/{questionUuid}/report
Header: X-Member-UUID: {memberUuid}
Body:
{
  "submissionUuid": "uuid",          // 필수
  "choiceSetUuid": "uuid",           // 선택 (선택지 세트 UUID)
  "categories": ["WRONG_ANSWER"],    // 필수, 1개 이상
  "detail": "기타 상세 내용"          // ETC 선택 시 필수
}
카테고리 값: WRONG_ANSWER | WEIRD_QUESTION | WEIRD_CHOICES | WEIRD_EXECUTION | ETC

응답: 201 Created (body 없음)
에러:
- 400: categories 비어있거나, ETC 선택 시 detail 없거나, submissionUuid 없음
- 409: 이미 해당 submissionUuid로 신고한 경우 (REPORT_ALREADY_EXISTS)
```

**신고 카테고리 한국어 표시 문구**

| enum 값 | 표시 문구 |
|---------|----------|
| `WRONG_ANSWER` | 정답이 틀렸다 |
| `WEIRD_QUESTION` | 문제 자체가 이상하다 |
| `WEIRD_CHOICES` | 선택지가 이상하다 |
| `WEIRD_EXECUTION` | SQL 실행 결과가 이상하다 |
| `ETC` | 기타 |

**신고 모달 안내 문구**
- 모달 제목: `문제 신고`
- ETC textarea placeholder: `구체적인 내용을 입력해주세요`
- 제출 버튼: `신고하기`
- 취소 버튼: `취소`
- 신고 완료 토스트: `신고가 접수되었습니다.`
- 이미 신고 완료 상태: 아이콘 비활성화, 별도 문구 없음

🙋‍♂️담당자
---

- 프론트엔드: 
