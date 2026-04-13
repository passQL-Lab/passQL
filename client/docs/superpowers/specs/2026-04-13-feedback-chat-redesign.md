# 건의사항 페이지 채팅 스타일 리디자인

**날짜:** 2026-04-13
**이슈:** #229

---

## 개요

기존 "입력 카드 + 목록 카드" 2단 구조를 **채팅/버블 스타일**로 전면 교체한다. 각 건의사항을 말풍선 버블로 표시하고, 상태(PENDING/REVIEWED/APPLIED)를 버블 색상으로 구분한다. 입력은 하단 고정 textarea로 유지한다.

---

## 디자인 결정

### 레이아웃

- **상단**: SubpageLayout 헤더 (뒤로가기 + "건의사항" 타이틀) — 기존 유지
- **중단**: 스크롤 가능한 채팅 영역 (버블 목록, 날짜 구분선)
- **하단**: 고정 입력 영역 (textarea + 글자수 카운터 + 보내기 버튼)
- 오프라인 배너는 헤더 아래 상단에 표시 (기존 위치 유지)

### 버블 스타일 (상태별)

| 상태 | 배경 | 보더 | 텍스트 | Pill |
|------|------|------|--------|------|
| PENDING | `#4F46E5` (인디고 solid) | 없음 | `#fff` | 반투명 흰색 |
| REVIEWED | `#EEF2FF` (인디고 연한) | `1px solid #C7D2FE` | `#111827` | `#4F46E5` solid |
| APPLIED | `#F0FDF4` (그린 연한) | `1px solid #BBF7D0` | `#111827` | `#16A34A` solid |

- 버블 radius: `16px 16px 3px 16px` (우측 하단만 뾰족)
- 모든 버블 오른쪽 정렬 (`justify-content: flex-end`)
- 버블 내부 하단: 날짜 + 상태 pill (우측 정렬)

### 날짜 구분선

- 날짜가 바뀔 때마다 "2주 전 / 3일 전 / 방금" 구분선 삽입
- 스타일: 양쪽 `#E5E7EB` 1px 라인 + 중앙 텍스트 (`9.5px`, `#9CA3AF`)

### 빈 상태 (Empty State)

- 말풍선 아이콘 (`MessageSquare`, lucide-react) + 회색 아이콘 박스
- 타이틀: "아직 보낸 건의가 없어요" (`12px`, `#6B7280`)
- 설명: "궁금한 점이나 원하는 기능을 자유롭게 남겨주세요" (`10.5px`, `#9CA3AF`)
- 채팅 영역 중앙 세로 정렬

### 입력 영역

- 배경 `#fff`, 상단 `1px solid #E5E7EB` 구분선
- Textarea wrap: `#FAFAFA` 배경, `1.5px solid #E5E7EB` 보더, `12px` radius
  - 포커스 시: 보더 `#4F46E5`
- Textarea: 최소 3행, 최대 500자, `resize: none`
- 하단 푸터: 글자수 카운터 (입력 시 숫자 인디고 강조) + 보내기 버튼
- 보내기 버튼: 1자 이상 시 활성 (`#4F46E5`), 미입력 시 비활성 (`#E5E7EB`)
- 전송 실패 시: textarea wrap 아래 인라인 에러 배너 (빨간 배경 + 재시도 버튼)

### 오프라인 배너

- 헤더 바로 아래 `#FFFBEB` 배경, `#FDE68A` 하단 보더
- WifiOff 아이콘 + "오프라인 상태예요. 연결되면 다시 시도할 수 있어요."
- 오프라인 시 textarea + 보내기 버튼 disabled

---

## 컴포넌트 변경 범위

### 교체 대상

| 파일 | 변경 내용 |
|------|----------|
| `src/components/FeedbackForm.tsx` | **전면 교체** — 하단 입력 영역 컴포넌트로 내부 재작성 (파일명 유지) |
| `src/components/FeedbackList.tsx` | **전면 교체** → 채팅 버블 목록 렌더링 |
| `src/components/FeedbackItem.tsx` | **전면 교체** → 단일 버블 컴포넌트 |
| `src/pages/SettingsFeedback.tsx` | 레이아웃 구조 교체 (채팅 영역 + 고정 입력) |

### 새 파일

없음 — 기존 파일명 유지하거나 내부 교체.

### 유지되는 것

- `src/api/feedback.ts` — 변경 없음
- `src/hooks/useFeedback.ts` — 변경 없음
- `src/types/api.ts` — 변경 없음
- `SubpageLayout` — 변경 없음

---

## 데이터 흐름

```
SettingsFeedback
  ├── SubpageLayout (헤더)
  ├── [offline] OfflineBanner
  ├── FeedbackList          ← useMyFeedback() 쿼리
  │     ├── [empty] EmptyState
  │     ├── [loading] SkeletonBubbles (2개)
  │     └── [data] FeedbackItem × N (날짜 구분선 포함)
  └── FeedbackForm          ← useSubmitFeedback() mutation
        ├── Textarea
        ├── CharCounter + SendButton
        └── [error] ErrorBanner
```

---

## 날짜 구분선 로직

`createdAt` 기준으로 인접한 두 아이템의 날짜가 다르면 구분선 삽입.
구분선 텍스트는 기존 `formatRelativeTime` 함수 재사용 (일 단위 이상만 표시).

```
오늘 → "오늘"
1일 전 → "어제"
2–6일 전 → "N일 전"
7일 이상 → "N주 전"
```

---

## 스켈레톤 로딩

로딩 중: 버블 형태의 스켈레톤 2개 (`animate-pulse`, 오른쪽 정렬, 인디고 연한 배경)

---

## 에러 처리

- **목록 조회 실패**: `ErrorFallback` 컴포넌트 (기존 유지)
- **전송 실패**: 인라인 에러 배너 (기존 FeedbackForm 패턴 유지)
- **오프라인**: 상단 배너 + 입력/전송 disabled
