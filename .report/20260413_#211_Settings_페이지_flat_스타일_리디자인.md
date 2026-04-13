# Settings 페이지 flat 스타일 리디자인

**이슈**: [#211](https://github.com/passQL-Lab/passQL/issues/211)

---

### 📌 작업 개요

Settings 페이지가 카드(`bg-surface-card border rounded-2xl`) 기반 레이아웃을 사용해 설정 항목이 늘어날수록 시각적으로 무거워지는 구조적 문제를 해결. iOS 설정 앱·토스 스타일의 flat 리스트 패턴으로 전환하고, row 레이아웃·타이포·여백·피드백 UX를 함께 개선.

---

### ✅ 구현 내용

#### 1. SettingsRow — 카드 래퍼 제거 및 레이아웃 전환

- **파일**: `src/components/SettingsRow.tsx`
- **변경 내용**:
  - `isLast` prop 제거 — 구분선 관리를 부모의 `divide-y`로 위임
  - 레이아웃을 vertical(label 위 / value 아래) → **horizontal(label 왼쪽 / value 오른쪽)** 로 전환
  - label: `text-sm font-medium text-text-primary` (왼쪽 식별자)
  - value + action: 오른쪽 flex 정렬
  - 패딩: `px-5 py-4` → `px-4 py-3.5` (더 컴팩트한 밀도)
- **이유**: iOS/토스 표준 한 줄 설정 row 패턴. label이 식별자, value가 보조 정보 역할로 명확히 분리

#### 2. SettingsSection — 섹션 헤더 경량화

- **파일**: `src/components/SettingsSection.tsx`
- **변경 내용**:
  - 기존 인디고 pill count 장식 제거 — 소문자 회색 라벨만 유지
  - 라벨 크기: `text-xs` → `text-sm`
  - 라벨 하단 여백: `mb-1` → `mb-2` (그룹 소유감 강화)
- **이유**: rounded card elevation 대신 텍스트 라벨 + 섹션 간 여백으로만 시각적 위계 표현

#### 3. Settings.tsx + DevPage.tsx — 그룹 배경 패턴 전환

- **파일**: `src/pages/Settings.tsx`, `src/pages/DevPage.tsx`
- **변경 내용**:
  - 카드 래퍼(`bg-surface-card border rounded-2xl`) 제거
  - `bg-surface-card border-y border-border divide-y divide-border` 패턴으로 교체
  - section 태그 인라인 `mt-6` 중복 제거 (SettingsSection의 `mt-6` 로직에 위임)
  - footer 여백 `mt-8` → `mt-12`
- **이유**: iOS grouped table 패턴 — 흰 띠가 페이지 배경(#FAFAFA) 위에 떠오르는 구조. rounded 카드 대신 전체 너비 border-y로 섹션 그룹 구분

#### 4. 피드백 UX 개선

- **파일**: `src/pages/Settings.tsx`
- **변경 내용**:
  - 닉네임 재설정 성공 시 `"닉네임이 변경됐어요"` toast 표시 (`mutate` onSuccess 콜백)
  - 복사 아이콘: wrapper 색상 상속 제거 → `<Check>`에 `text-sem-success` 직접 지정해 초록 체크 정상 표시
  - toast 배경: `bg-toast-bg` → `bg-brand`(인디고 `#4F46E5`)

---

### 🔧 주요 변경사항 상세

#### SettingsRow 구조 변화

```
[변경 전] vertical
닉네임              ↺
퀴즈고수

[변경 후] horizontal
닉네임       퀴즈고수 ↺
```

`flex-1`을 label에 부여해 value+action을 자연스럽게 오른쪽으로 밀어내는 구조. `onClick` 유무에 따라 `<button>` / `<div>` 분기 렌더링은 유지.

#### 섹션 그룹 래퍼 변화

```
[변경 전]
<div class="bg-surface-card border border-border rounded-2xl">
  <!-- rows -->
</div>

[변경 후]
<div class="bg-surface-card border-y border-border divide-y divide-border">
  <!-- rows -->
</div>
```

좌우 border와 rounded 코너를 제거하고 상하 border-y만 남겨 full-width flat 패턴 완성.

#### DevPage 동기화

DevPage도 동일한 SettingsRow·SettingsSection을 사용하므로 wrapper 패턴만 동일하게 교체. localStorage 초기화 row의 `isLast` prop 제거.

---

### 🧪 테스트 및 검증

- 닉네임 재설정 버튼 클릭 → 인디고 toast 표시 확인
- 디바이스 ID 복사 버튼 클릭 → 2초간 초록 체크 아이콘 표시 후 복귀 확인
- 버전 row 5회 연속 클릭 → 개발자 모드 Easter Egg 동작 확인
- DevPage 레이아웃 Settings와 동일하게 적용 확인

---

### 📌 참고사항

- `SettingsSection`의 `count` prop은 인터페이스에 남겨두되 현재 렌더링하지 않음 (하위 호환)
- `SettingsRow`의 `isLast` prop은 완전 제거 — 기존 호출부 모두 수정 완료
- `divide-y`는 직계 자식 간에만 border를 생성하므로 조건부 렌더링(`devUnlocked && ...`)과 함께 사용해도 마지막 row border 문제 없음
