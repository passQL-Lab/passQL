# 개발자 모드 잠금 해제 설계

**날짜**: 2026-04-13  
**관련 파일**: `client/src/pages/Settings.tsx`

---

## 개요

현재 설정 화면의 "개발자" 섹션(localStorage 초기화 버튼)이 모든 사용자에게 항상 노출되어 있다. 이를 숨기고, 앱 정보 항목을 5번 연속 클릭하는 Easter Egg 방식으로만 잠금 해제되도록 변경한다.

---

## 요구사항

### 1. 개발자 섹션 기본 숨김

- `Settings.tsx`의 개발자 섹션(`SettingsSection label="개발자"`)을 기본적으로 렌더링하지 않는다.
- `useState<boolean>(false)`으로 `devUnlocked` 상태를 관리한다.
- `devUnlocked === true`일 때만 조건부 렌더링한다.
- **세션 한정**: 새로고침/앱 재시작 시 다시 숨겨진다. localStorage에 저장하지 않는다.

### 2. 앱 정보 클릭 카운트 감지

- "앱 정보" 섹션의 버전 `SettingsRow` 전체를 클릭 가능하게 변경한다.
- 클릭 횟수는 `useRef<number>`로 관리한다 (리렌더 불필요).
- 이미 `devUnlocked === true`이면 클릭 이벤트 무시한다.

**클릭별 동작:**

| 클릭 횟수 | 동작 |
|-----------|------|
| 1~2번 | 아무것도 안 뜸 |
| 3번 | toast: "개발자 모드까지 2번 남았습니다" |
| 4번 | toast: "개발자 모드까지 1번 남았습니다" |
| 5번 | toast: "개발자 모드가 활성화되었습니다" + `devUnlocked = true` |

### 3. Toast 구현

- daisyUI 5의 `toast` + `alert` 컴포넌트 조합을 사용한다.
- `Settings.tsx` 내에서 로컬 `toastMsg: string | null` state로 관리한다.
- toast는 2초 후 자동으로 사라진다. `useRef<ReturnType<typeof setTimeout>>`으로 타이머 관리.
- toast 위치: `toast toast-bottom toast-center` (daisyUI 기본 하단 중앙).
- "개발자 모드까지 N번 남았습니다": `alert alert-info` 스타일
- "개발자 모드가 활성화되었습니다": `alert alert-success` 스타일

### 4. localStorage 초기화 warning 문구 개선

- 1차 클릭 시 기존 "진짜요?" 텍스트 변경 → 버튼 레이블을 "확인 후 초기화"로 변경
- 동시에 toast로 경고 메시지 표시:
  > "초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로 시작됩니다. 되돌릴 수 없어요."
- 2차 클릭 시: `localStorage.clear()` + `window.location.reload()` (기존 동일)
- toast 스타일: `alert alert-warning`

---

## 변경 범위

### `client/src/pages/Settings.tsx` 만 수정

- `devUnlocked` state 추가
- `clickCount` ref 추가  
- `toastMsg` state + `toastTimerRef` 추가
- 버전 row에 `onClick` 핸들러 추가
- 개발자 섹션 조건부 렌더링 (`{devUnlocked && ...}`)
- toast 렌더링 블록 추가 (JSX 최하단)
- `handleClearStorage` 1차 클릭 시 toast 경고 추가

### 변경하지 않는 것

- `SettingsRow`, `SettingsSection` 컴포넌트 — props 변경 없음
- stagger 인덱스 — devUnlocked 섹션은 조건부라 stagger에서 제외해도 무방

---

## UX 흐름

```
[앱 정보 - 버전 row 클릭]
  1번 클릭 → 없음
  2번 클릭 → 없음
  3번 클릭 → toast(info): "개발자 모드까지 2번 남았습니다"
  4번 클릭 → toast(info): "개발자 모드까지 1번 남았습니다"
  5번 클릭 → toast(success): "개발자 모드가 활성화되었습니다"
             → 개발자 섹션 페이드인 표시

[개발자 섹션 - 초기화 클릭]
  1차 클릭 → toast(warning): 경고 문구 + 버튼 "확인 후 초기화" 전환
  2차 클릭 → localStorage.clear() + reload() → 새 계정 등록
```

---

## 미결 사항

- 없음
