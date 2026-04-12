# 오늘의 문제 완료 카드 디자인 개선

## 문제

`Home.tsx`의 오늘의 문제 완료 상태 카드가 `border-l-4 border-sem-success` (왼쪽 4px 굵은 초록선) + `bg-sem-success-light` 조합을 사용 중.

두 가지 문제:
1. 왼쪽 굵은선이 카드 좌측 border-radius를 시각적으로 깨뜨림
2. 이 패턴은 SQL 실행 결과의 시맨틱 카드 전용 스타일 — 완료 상태와 맥락 불일치

## 결정된 디자인

**C-2: 회색 dimmed 카드**

완료된 항목은 "이미 끝난 일"임을 회색 dimming으로 표현. 초록은 우측 상단 "완료" 텍스트 레이블에만 사용.

### 시각 스펙

| 속성 | 현재 | 변경 후 |
|------|------|---------|
| 배경 | `bg-sem-success-light` (`#F0FDF4`) | `bg-[#F3F4F6]` |
| 테두리 | `border-l-4 border-sem-success` | `border border-border` (1px, 기본) |
| border-radius | `rounded-t-none rounded-l-none` (선 때문에 깨짐) | `rounded-xl` (정상) |
| 라벨 | `text-sem-success-text` 초록 텍스트 | `text-text-caption` (`#9CA3AF`) |
| 문제 줄기 | `text-body` 검정 | `text-text-caption` (`#9CA3AF`) |
| badge-topic | 정상 opacity | `opacity-50` |
| 별점 | 정상 opacity | `opacity-40` |
| 우측 상단 | 초록 원형 체크 아이콘 | `완료` 텍스트 레이블 (체크 아이콘 + 텍스트, `text-sem-success-text`) |
| cursor | `cursor-default` | `cursor-default` (유지) |
| 클릭 동작 | 없음 | 없음 (유지) |

### 완료 인디케이터

```tsx
<span className="flex items-center gap-1 text-xs font-semibold text-sem-success-text">
  <Check size={11} strokeWidth={3} />
  완료
</span>
```

## 변경 범위

- **파일 1개**: `src/pages/Home.tsx`
- **변경 라인**: 완료 상태 분기 (`today.alreadySolvedToday === true`) 블록만
- 미완료 상태 카드, 시험 일정 카드, 기타 섹션 변경 없음

## 미변경 사항

- `components.css`의 `.error-card`, `.modal-card` 등 시맨틱 카드 클래스 — 이 스펙과 무관
- daisyUI `badge badge-warning` 사용 안 함 — `badge-topic`과 시각 충돌 방지
- 완료 카드는 비인터랙티브 유지 (`cursor-default`, 클릭 핸들러 없음)
