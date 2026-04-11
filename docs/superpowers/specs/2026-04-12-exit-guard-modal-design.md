# 문제 풀이 중 이탈 방지 경고 모달 설계

**날짜**: 2026-04-12  
**이슈**: #028

---

## 개요

문제 풀이 도중 다른 화면으로 이동 시도 시 경고 모달을 띄워 풀이 기록 유실을 방지한다.  
React Router DOM v7의 `useBlocker` 훅으로 앱 내 네비게이션을 차단하고, 공통 `ConfirmModal` 컴포넌트로 사용자에게 의사를 확인한다.

---

## 적용 범위

| 화면 | 파일 | 차단 조건 | 차단 해제 시점 |
|---|---|---|---|
| 연습 세션 | `src/pages/PracticeSet.tsx` | 세션 진입 직후 | `shouldNavigateToResult === true` (마지막 문제 완료) |
| 데일리 챌린지 | `src/pages/DailyChallenge.tsx` | 진입 직후 | `feedback` state가 설정된 후 |
| 단독 문제 풀이 | `src/pages/QuestionDetail.tsx` | `practiceMode === false`이고 진입 직후 | 제출(`submitAnswer`) 완료 후 |

---

## 컴포넌트 설계

### `ConfirmModal` (`src/components/ConfirmModal.tsx`)

범용 Confirm 다이얼로그. 이탈 방지 외에도 재사용 가능하도록 설계한다.

**Props**

```typescript
interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;      // 파괴적 액션 레이블 (예: "나가기")
  readonly cancelLabel: string;       // 유지 액션 레이블 (예: "계속 풀기")
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}
```

**레이아웃**

- 오버레이: `rgba(17, 24, 39, 0.5)` fixed inset-0
- 모바일: 화면 하단 바텀시트 (`rounded-t-2xl`, drag handle 없음 — 버튼으로만 조작)
- 데스크톱: 중앙 모달 (max-width 400px, `rounded-2xl`)
- 카드: `#FFFFFF` bg, `1px solid #E5E7EB` border
- 제목: Pretendard 18px weight 700 `#111827`
- 설명: Pretendard 14px weight 400 `#6B7280`
- 버튼 배치: 세로 스택 (cancelLabel이 위, confirmLabel이 아래)
  - cancelLabel(계속 풀기): Primary 버튼 (`#4F46E5`)
  - confirmLabel(나가기): Secondary 버튼 (`#FFFFFF` + `1px solid #4F46E5`, text `#4F46E5`)

**동작**

- 오버레이 클릭 → `onCancel` 호출 (이탈 취소)
- ESC 키 → `onCancel` 호출

---

## useBlocker 연동 패턴

각 페이지에서 동일한 패턴으로 사용한다.

```typescript
// 차단 활성화 조건 — 각 페이지마다 다름
const blocker = useBlocker(shouldBlock);

// blocker.state === "blocked" 일 때 모달 표시
// onConfirm → blocker.proceed()
// onCancel  → blocker.reset()
```

**각 페이지별 `shouldBlock` 조건**

- `PracticeSet`: `!shouldNavigateToResult` (결과 페이지로 이동하기 직전까지 true)
- `DailyChallenge`: `feedback === null` (제출 완료 전까지 true)
- `QuestionDetail`: `!practiceMode && !submitted` (단독 모드이고 미제출 상태)

`QuestionDetail`의 `submitted` state는 신규 추가. 기존 `submitAnswer` 호출 성공 직후 `true`로 설정.

---

## 모달 문구

| 항목 | 내용 |
|---|---|
| 제목 | 풀이를 그만할까요? |
| 설명 | 지금 나가면 현재 풀이 기록이 저장되지 않아요. |
| 취소 버튼 (Primary) | 계속 풀기 |
| 확인 버튼 (Secondary) | 나가기 |

---

## 변경 파일 목록

| 파일 | 변경 유형 |
|---|---|
| `src/components/ConfirmModal.tsx` | 신규 생성 |
| `src/pages/PracticeSet.tsx` | `useBlocker` + `ConfirmModal` 연결 |
| `src/pages/DailyChallenge.tsx` | `useBlocker` + `ConfirmModal` 연결 |
| `src/pages/QuestionDetail.tsx` | `submitted` state 추가, `useBlocker` + `ConfirmModal` 연결 |

---

## 제외 범위

- 브라우저 탭 닫기 / 새로고침 차단 (`beforeunload`) — 과도한 UX 방해로 제외
- `practiceMode === true`인 `QuestionDetail` — 부모(`PracticeSet`, `DailyChallenge`)가 이미 차단하므로 중복 불필요
