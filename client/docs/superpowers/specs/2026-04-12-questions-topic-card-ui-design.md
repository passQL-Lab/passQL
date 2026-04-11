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

---

## 변경하지 않는 것

- `getTopicIcon()` 함수 시그니처 — 호출부(`Questions.tsx`) 변경 없음
- 카드 레이아웃, 그리드, hover 스타일
- `QuestionDetail.tsx` 미포함 (이번 스펙 범위 외)

---

## 파일별 작업 요약

| 파일 | 작업 |
|------|------|
| `src/constants/topicIcons.ts` | TOPIC_ICON_MAP 키 교정 + fallback 제거 |
| `src/pages/Questions.tsx` | 카드 캡션(중복 displayName) 제거 |
