# 🚀[기능개선][문제풀이] SchemaViewer 테이블 레이아웃 및 시각성 개선

## 개요

문제 풀기 화면의 스키마 표시 영역(`SchemaViewer`)에서 카드 배경색 누락, 가로 레이아웃으로 인한 테이블 찌그러짐, 테이블명 식별 어려움 문제를 개선했다. 세로 스택 레이아웃으로 전환하고 카드 내부 가로 스크롤을 추가해 칼럼이 많은 테이블도 잘리지 않게 처리했다. 인라인 `style` 속성을 전부 제거하고 Tailwind 유틸리티 클래스로 교체했다.

## 변경 사항

### 레이아웃 구조
- `client/src/components/SchemaViewer.tsx`: 테이블 목록 컨테이너를 `flex gap-2 overflow-x-auto`(가로 나열)에서 `space-y-3`(세로 스택)으로 변경. 각 테이블 카드 래퍼의 `w-full min-w-0` 및 `scrollSnapAlign` 속성 제거

### 스타일
- `client/src/components/SchemaViewer.tsx`: 스키마 구조 카드 및 샘플 데이터 카드에 `bg-surface-card`(`#FFFFFF`) 배경색 명시. 모든 인라인 `style={{ }}` 속성을 Tailwind 유틸리티 클래스(`border-border`, `text-text-caption`, `text-brand`, `bg-accent-light`, `bg-surface-page`, `text-body`)로 교체

### 테이블 헤더
- `client/src/components/SchemaViewer.tsx`: 테이블명 단독 표시에서 `Table2`(lucide-react) 아이콘 + 테이블명 조합으로 변경. 헤더 패딩을 `px-2 py-0.5`에서 `px-3 py-1.5`로 확대해 터치 영역 확보

### 가로 스크롤
- `client/src/components/SchemaViewer.tsx`: 스키마 구조 테이블과 샘플 데이터 테이블 각각에 `overflow-x-auto` 래퍼 `<div>` 추가. 카드 외부가 아닌 카드 내부에서만 가로 스크롤이 발생하도록 격리

## 주요 구현 내용

기존 구조는 테이블 목록 전체를 하나의 가로 스크롤 컨테이너에 넣는 방식이었다. 테이블이 1개일 때는 `w-full`로 전체 폭을 차지하지만, 4개가 되면 각각 `min-w-0`으로 줄어들어 칼럼명이 잘리는 문제가 있었다.

변경 후 구조:
- 테이블 카드들은 세로로 나열 (`space-y-3`)
- 각 카드 내부의 `<table>`만 `overflow-x-auto` 래퍼로 감쌈
- 테이블 카드 자체는 항상 전체 폭(`w-full`)을 유지하면서, 칼럼이 많으면 카드 안에서 가로 스크롤

## 주의사항

- `bg-surface-page`, `bg-accent-light`, `text-body` 클래스는 tokens.css의 `@theme` 등록 변수가 아닌 components.css/typography.css의 커스텀 클래스다. 다른 컴포넌트에서도 동일하게 사용 중인 클래스이므로 일관성은 유지됨
- 짝수 행 배경색(`bg-surface-page`) 처리가 기존 인라인 스타일에서 조건부 className으로 변경됨 — 빈 문자열(`""`)이 className에 포함되는 구조이므로 Tailwind 퍼지에 영향 없음
