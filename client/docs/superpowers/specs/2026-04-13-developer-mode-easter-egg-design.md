# 개발자 모드 Easter Egg 잠금 해제 설계

**이슈**: #208  
**날짜**: 2026-04-13  
**브랜치**: `20260413_#208_개발자_모드_Easter_Egg_잠금_해제`

---

## 목표

설정 화면의 개발자 전용 기능을 일반 사용자에게 숨기고, Easter Egg 방식으로만 접근 가능하게 한다. 개발자 기능은 확장성을 위해 별도 페이지(`/dev`)로 분리한다.

---

## 아키텍처

```
Settings.tsx
  └── 버전 row (5번 클릭 → devUnlocked = true)
  └── "개발자 모드" row (devUnlocked일 때만 노출) → navigate('/dev')

DevPage.tsx (신규)
  └── localStorage 초기화 기능
```

---

## 컴포넌트 설계

### 1. Settings.tsx 변경

**추가 state/ref:**
- `devUnlocked: boolean` — 기본값 `false`, 세션 한정 (React state, 새로고침 시 리셋)
- `clickCount: useRef<number>` — 버전 row 클릭 카운터
- `toastMsg: string | null` — 현재 표시할 toast 메시지
- `toastTimerRef: useRef<ReturnType<typeof setTimeout> | null>` — toast 자동 소멸 타이머

**버전 row 클릭 핸들러 (`handleVersionClick`):**
```
clickCount.current += 1

if count === 3 → showToast("개발자 모드까지 2번 남았습니다")
if count === 4 → showToast("개발자 모드까지 1번 남았습니다")
if count >= 5 → setDevUnlocked(true) + showToast("개발자 모드가 활성화되었습니다")
```

**showToast 헬퍼:**
- `setToastMsg(msg)` 호출
- 기존 타이머 클리어 후 2초 뒤 `setToastMsg(null)`

**버전 row 변경:**
- `onClick={handleVersionClick}` 추가
- `cursor-pointer` 클래스 추가 (클릭 가능함을 암시)

**개발자 모드 row (조건부 렌더링):**
- `devUnlocked &&` 조건으로 앱 정보 섹션 하단에 row 추가
- 라벨: "개발자 모드"
- 클릭 시: `navigate('/dev')`
- 아이콘: `ChevronRight` (lucide-react)

**Toast 렌더링:**
- daisyUI `toast` + `alert` 클래스 조합
- `toastMsg`가 null이 아닐 때만 렌더링
- 위치: `toast toast-bottom toast-center`
- 스타일: 디자인 시스템의 Toast Background(`#1F2937`) 적용

**stagger 인덱스 조정:**
- 기존 `s5` (개발자 도구 섹션) 제거 → `devUnlocked` 조건부 렌더링으로 교체
- `s6` (로고) → `s5`로 당김

### 2. DevPage.tsx (신규)

**경로**: `src/pages/DevPage.tsx`

**기능:**
- 뒤로가기 버튼 (← 설정으로)
- localStorage 초기화

**localStorage 초기화 UX (2단계):**
- 1차 클릭: toast 경고 표시 + `confirmClear = true` 전환
  - toast: "초기화하면 풀이 기록, 닉네임이 모두 삭제되고 새 계정으로 시작됩니다. 되돌릴 수 없어요."
  - 버튼 텍스트: "진짜요?" (3초 후 자동 복원)
- 2차 클릭: `localStorage.clear()` + `window.location.reload()`

**Toast 렌더링:**
- Settings.tsx와 동일한 daisyUI toast 패턴

### 3. 라우터 등록

`App.tsx` (또는 라우터 정의 파일)에 `/dev` 경로 추가:
```tsx
<Route path="/dev" element={<DevPage />} />
```

---

## 데이터 흐름

```
[버전 row 클릭]
  → clickCount.current++
  → count 3~4: toast 카운트다운
  → count 5: devUnlocked = true + toast "활성화"
  → [개발자 모드 row 노출]
  → 클릭 → navigate('/dev')

[DevPage]
  → [초기화 버튼 1차 클릭] → toast 경고 + confirmClear = true
  → [초기화 버튼 2차 클릭] → localStorage.clear() + reload
```

---

## 범위 외 (이번 이슈에서 제외)

- `/dev` 접근 제한 없음 (URL 직접 입력 허용 — 개발자 도구 특성상 허용 가능)
- 개발자 모드 활성화 상태를 localStorage/sessionStorage에 저장하지 않음
- 추가 개발자 기능 구현 (확장성만 확보)
