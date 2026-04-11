# Questions 토픽 카드 UI 개선 스펙

**날짜:** 2026-04-12
**이슈:** #120
**대상 파일:** `src/constants/topicIcons.ts`, `src/pages/Questions.tsx`

---

## 문제 정의

1. **아이콘 키 불일치**: `TOPIC_ICON_MAP`의 키(`JOIN`, `GROUP_BY` 등)가 실제 API 토픽 코드(`sql_join`, `sql_group_aggregate` 등)와 달라, 9개 토픽 전부 fallback 아이콘(캐시 순서 기반 랜덤)으로 표시됨.
2. **토픽명 중복**: 카드 내에서 `displayName`이 제목과 캡션 두 곳에 렌더링됨.

---

## 변경 범위

### 1. `src/constants/topicIcons.ts`

**현재:** 5개 잘못된 코드 명시 + fallback 랜덤 로직

**변경 후:**
- `TOPIC_ICON_MAP`을 9개 토픽 코드 완전 명시로 교체
- `FALLBACK_ICONS`, `dynamicCache`, fallback 분기 제거
- 존재하지 않는 코드 요청 시 `HelpCircle` fallback 1개만 유지

**아이콘 매핑:**

| 코드 | 토픽명 | 아이콘 (lucide-react) |
|------|--------|----------------------|
| `data_modeling` | 데이터 모델링의 이해 | `Database` |
| `sql_basic_select` | SELECT 기본 | `Table` |
| `sql_ddl_dml_tcl` | DDL / DML / TCL | `PencilLine` |
| `sql_function` | SQL 함수 (문자/숫자/날짜/NULL) | `Sigma` |
| `sql_join` | 조인 (JOIN) | `Combine` |
| `sql_subquery` | 서브쿼리 | `Layers` |
| `sql_group_aggregate` | 그룹함수 / 집계 | `BarChart3` |
| `sql_window` | 윈도우 함수 | `AppWindow` |
| `sql_hierarchy_pivot` | 계층 쿼리 / PIVOT | `Network` |

### 2. `src/pages/Questions.tsx`

**현재 카드 구조:**
```
아이콘
displayName  ← 제목
displayName  ← 캡션 (중복)
```

**변경 후 카드 구조:**
```
아이콘
displayName  ← 제목만
```

- 카드 내 `subtopics.length > 0` 조건부 캡션 제거
- 카드 중앙 정렬 구조 유지 (아이콘 → 텍스트)

### 3. 카드 그림자 & 호버 인터랙션

> 디자인 시스템은 기본적으로 그림자 없음 정책이나, 사용자 요청에 따라 토픽 카드에 한해 적용.

**기본 상태:**
- `shadow-sm` — 카드에 미세한 입체감 부여 (`0 1px 3px rgba(0,0,0,0.08)`)
- border: `1px solid #E5E7EB` 유지

**호버 상태 (transition: all 200ms ease):**
- `hover:shadow-md` — 그림자 확장으로 카드가 떠오르는 느낌
- `hover:-translate-y-0.5` — 위로 2px 살짝 올라오는 리프트 효과
- `hover:border-[#4F46E5]` — 보더 브랜드 인디고로 전환
- 아이콘 색상: `group-hover` 시 `text-brand` 유지 (이미 인디고)

**Tailwind 클래스 변경 (카드 버튼):**
```
기존: card-base flex flex-col ... hover:bg-surface transition-colors
변경: card-base flex flex-col ... shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#4F46E5] transition-all duration-200
```

---

## 변경하지 않는 것

- `getTopicIcon()` 함수 시그니처 — 호출부(`Questions.tsx`) 변경 없음
- 카드 그리드 레이아웃, 패딩, 정렬
- `QuestionDetail.tsx` 미포함 (이번 스펙 범위 외)

---

## 파일별 작업 요약

| 파일 | 작업 |
|------|------|
| `src/constants/topicIcons.ts` | TOPIC_ICON_MAP 키 교정 + fallback 제거 |
| `src/pages/Questions.tsx` | 카드 캡션 제거 + shadow/hover 인터랙션 추가 |
