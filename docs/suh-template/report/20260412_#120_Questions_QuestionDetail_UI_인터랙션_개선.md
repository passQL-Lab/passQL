### 📌 작업 개요

Questions / QuestionDetail 페이지 UI 개선 작업. 토픽 카드 hover 인터랙션 강화, 클릭 가능한 카드의 시각적 피드백 통일, 전체 카드 레이아웃 shadow 적용, QuestionDetail 전체화면 집중 모드 전환 등을 구현.

---

### 🎯 구현 목표

- 카테고리/문제 목록 카드의 hover 인터랙션이 명확해 클릭 가능한 요소임을 즉시 인지
- 토픽 코드별 lucide-react 아이콘 매핑 (추후 카드 렌더링에 활용)
- 화면 전체 depth 표현을 shadow-sm 기반으로 통일
- QuestionDetail을 AppLayout에서 분리해 집중 모드 레이아웃 지원

---

### ✅ 구현 내용

#### 토픽 아이콘 상수 파일 신규 생성
- **파일**: `src/constants/topicIcons.ts`
- **변경 내용**: 9개 토픽 코드를 lucide-react 아이콘에 매핑하는 `TOPIC_ICON_MAP` 상수와 `getTopicIcon()` 헬퍼 함수 생성
- **이유**: 토픽 의미에 맞는 아이콘을 카드에 표시해 시각적 인식성 향상. `Readonly<Record<...>>` 타입으로 불변 보장

| 토픽 코드 | 아이콘 |
|---|---|
| `data_modeling` | Database |
| `sql_basic_select` | Table |
| `sql_ddl_dml_tcl` | PencilLine |
| `sql_function` | Sigma |
| `sql_join` | Combine |
| `sql_subquery` | Layers |
| `sql_group_aggregate` | BarChart3 |
| `sql_window` | AppWindow |
| `sql_hierarchy_pivot` | Network |

#### Questions.tsx — 카드 hover 인터랙션 강화
- **파일**: `src/pages/Questions.tsx`
- **변경 내용**:
  - 토픽 카드: `shadow-sm` 추가, hover 시 `shadow-md + -translate-y-0.5 + border-brand` + `transition-all duration-200` 적용
  - 문제 목록 카드: 동일 패턴 (`hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200`) 적용
  - 토픽 카드 중복 캡션 제거 (서브토픽 수만 표시)
- **이유**: hover 시 카드가 살짝 올라오고 브랜드 색 테두리가 나타나 클릭 가능 요소임을 직관적으로 전달

#### QuestionDetail.tsx — AppLayout 밖으로 이동 (전체화면 집중 모드)
- **파일**: `src/App.tsx` (라우팅 구조 변경)
- **변경 내용**: `/questions/:questionUuid` 경로를 AppLayout 래퍼 밖으로 이동해 하단 탭바, 사이드바 없는 전체화면 집중 모드로 전환
- **이유**: 문제 풀이 화면에서 네비게이션 요소가 공간을 차지하지 않도록 분리

#### Home.tsx — 카드 shadow 및 hover 통일
- **파일**: `src/pages/Home.tsx`
- **변경 내용**:
  - 오늘의 문제, 시험 일정, 학습 현황, 통계, 추천 문제 카드 전체에 `shadow-sm` 추가
  - 추천 문제 카드: `Link` 의 `block` 처리로 `space-y-3` 간격 정상 적용
  - 추천 문제 카드 간격 `space-y-2 → space-y-3`으로 통일
  - 섹션 간 divider `my-8` 추가 (디자인 시스템 spacing-module 32px 기준)
  - 클릭 가능한 카드 hover 패턴 (`hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200`) 전면 적용

#### ChoiceCard / ChoiceReview — shadow 및 마진 통일
- **파일**: `src/components/ChoiceCard.tsx`, `src/components/ChoiceReview.tsx`
- **변경 내용**: 문제 지문/선택지 카드에 `shadow-sm` 추가, 제출 버튼 좌우 마진을 초이스 카드와 통일
- **이유**: 화면 전반의 depth 표현을 일관되게 유지

#### 버튼 shadow 추가
- **변경 내용**: `btn-primary`, `btn-secondary`, `btn-compact` 클래스에 `shadow` 추가
- **이유**: 버튼을 배경에서 시각적으로 분리해 클릭 가능성 명확화

---

### 🔧 주요 변경사항 상세

#### hover 인터랙션 패턴 통일
Questions 토픽 카드, 문제 목록 카드, Home 추천 문제 카드 모두 동일한 패턴 적용:

```
hover:shadow-md hover:-translate-y-0.5 hover:border-brand transition-all duration-200
```

미묘한 Y축 이동(-0.5 = -2px)과 그림자 강화로 "떠오르는" 피드백 제공. 브랜드 인디고 테두리는 브랜드 인식과 상호작용 신호를 동시에 전달.

#### 추천 문제 Link block 처리
기존 `space-y-3` 컨테이너 안에 `Link` 컴포넌트를 배치했으나 `display: inline`이 기본값이어 간격이 적용되지 않는 문제 수정. `Link` 에 `className="block"` 추가.

**특이사항**:
- `topicIcons.ts` 파일은 생성됐으나 현재 Questions.tsx 카드 렌더링에는 아직 미적용 상태. 아이콘 표시 연동은 후속 작업 예정.

---

### 📌 참고사항

- hover 인터랙션의 `transition-all duration-200` 은 디자인 시스템 Motion 가이드의 200ms 기준을 준수
- QuestionDetail 전체화면 분리는 DailyChallenge, PracticeSet 등 이미 집중 모드를 사용하는 페이지와 동일한 라우팅 패턴으로 통일
- `topicIcons.ts` 의 `TOPIC_ICON_MAP`은 API 응답의 실제 토픽 코드 기준으로 키를 교정 (fallback 랜덤 로직 제거)
