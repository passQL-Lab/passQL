# 설정 탭 재설계 — 건의사항 서브페이지 분리

## 배경 및 목적

현재 `Settings.tsx`에는 건의사항 입력 폼(`FeedbackForm`)과 목록(`FeedbackList`)이 풀(full) UI로 노출되어 있다.
설정 항목이 늘어날수록 이 구조는 설정 탭을 무겁게 만든다.
설정 탭은 순수 row 목록으로 정리하고, 각 기능은 서브페이지로 이동하는 표준 패턴(iOS 설정 앱, 토스 등)으로 전환한다.

이번 작업은 **건의사항 서브페이지 분리**를 구현한다.

---

## 최종 구조

### 라우팅

```
/settings             → Settings.tsx (AppLayout 안 — 탭바 있음)
/settings/feedback    → SettingsFeedback.tsx (AppLayout 밖 — 탭바 없음)
```

`/settings/feedback`은 `QuestionDetail`, `DailyChallenge`와 동일한 독립 라우트 패턴.
설정 서브페이지는 "탭 간 이동이 불필요한 화면"이므로 탭바를 숨기는 것이 표준.

### Settings.tsx 변경 후 레이아웃

```
계정
  닉네임          [재생성 버튼]    (row 유지)
  디바이스 ID     [복사 버튼]      (row 유지)

건의사항
  건의사항        [ChevronRight]   ← 클릭 시 navigate('/settings/feedback')

앱 정보
  버전            v0.0.115         (row 유지)

개발자
  localStorage 초기화  [초기화 버튼]  (row 유지)
```

FeedbackForm, FeedbackList, feedbackCount pill, isOnline 오프라인 배너는 Settings.tsx에서 제거.

### SettingsFeedback.tsx (신규 페이지)

- 상단: `ChevronLeft` 뒤로가기 버튼 + "건의사항" 제목 헤더 (sticky)
- 본문: 오프라인 배너 + `FeedbackForm` + `FeedbackList` (기존 컴포넌트 그대로 이동)
- 스타일: `QuestionDetail` 헤더 패턴 참고

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `client/src/App.tsx` | 수정 | `/settings/feedback` 독립 라우트 추가 |
| `client/src/pages/Settings.tsx` | 수정 | 건의사항 섹션 → SettingsRow + ChevronRight로 교체, FeedbackForm/List/관련 import 제거 |
| `client/src/pages/SettingsFeedback.tsx` | 신규 | 건의사항 서브페이지 (헤더 + FeedbackForm + FeedbackList) |

---

## 결정 사항

- **독립 라우트(flat route)** 선택 — Nested Route 대신. 탭바 숨김 처리가 자연스럽고, 이미 프로젝트에서 같은 패턴 사용 중.
- **기존 컴포넌트 재사용** — `FeedbackForm`, `FeedbackList` 수정 없이 그대로 이동.
- **오프라인 배너** — Settings.tsx에서 제거하고 SettingsFeedback.tsx로 이동.
- **feedbackCount pill** — Settings.tsx의 건의사항 섹션 헤더에서 제거. (서브페이지 이동 후 불필요)

---

## 범위 외 (별도 이슈)

- `version.yml` `project_type` 변경 및 `package.json` 버전 동기화 — 버전 순서 충돌 위험으로 별도 처리
- 계정 섹션 서브페이지 분리 — 현재 row 인라인으로 충분, 추후 검토
