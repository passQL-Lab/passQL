# passQL Design System (Inspired by Linear)

## 1. Visual Theme & Atmosphere

passQL은 라이트 모드 우선의 학습 도구 디자인 — `#FAFAFA` 연회색 캔버스 위에 순백색(`#FFFFFF`) 카드가 톤 차이로 떠오르는 구조. 전체적인 인상은 차분한 정밀함: 콘텐츠(SQL 코드, 문제 지문)가 가장 눈에 띄고, 장식적 요소는 최소화. "Notion의 명확성 + Linear의 정밀성" 사이의 미학.

타이포그래피는 Pretendard Variable을 UI 전체에 사용하며, SQL 코드와 기술적 값(UUID, 에러 코드, 실행 결과)에만 JetBrains Mono를 사용. 폰트 스케일은 28/22/16/14/12px 5단계로 압축적이며, heading에서 body로의 위계가 명확.

색상 체계는 무채색 기반(#111827 ~ #9CA3AF 그레이 스케일) + 단일 브랜드 인디고(#4F46E5). 인디고는 CTA 버튼, 활성 상태, 링크에만 사용하며 장식적으로 쓰지 않음. 시맨틱 색상(초록/빨강/노랑)은 SQL 실행 결과와 정답/오답 피드백에만 등장.

**핵심 특성:**
- 라이트 모드 네이티브: `#FAFAFA` 페이지 배경, `#FFFFFF` 카드, `#F3F4F6` 코드 배경
- Pretendard Variable — 한국어/영문 UI 전체, JetBrains Mono — SQL/코드 전용
- 브랜드 인디고: `#4F46E5` (primary) / `#EEF2FF` (accent light) / `#818CF8` (accent medium)
- 명시적 보더: `#E5E7EB` 1px solid — 반투명 대신 명확한 경계선
- 그림자 없음 (`--depth: 0`) — elevation은 배경색 차이(#FAFAFA → #FFFFFF)로 표현
- 시맨틱 색상은 SQL 실행 결과에만 사용: Success `#22C55E`, Error `#EF4444`, Warning `#F59E0B`
- 12px 카드 radius, 8px 버튼 radius, 999px pill radius
- lucide-react 아이콘만 사용 — 이모지/유니코드 심볼 금지

## 2. Color Palette & Roles

### Background Surfaces
- **Page Background** (`#FAFAFA`): 메인 캔버스. 순백이 아닌 연회색으로 눈의 피로 방지.
- **Card Surface** (`#FFFFFF`): 카드, 모달, 사이드바 배경. Page 위에 올라온 콘텐츠 영역.
- **Code Background** (`#F3F4F6`): SQL 코드 블록, 스키마 DDL 배경. 콘텐츠와 코드를 시각적으로 분리.
- **Zebra Row** (`#FAFAFA`): 데이터 테이블 짝수 행 배경.

### Text & Content
- **Primary Text** (`#111827`): 문제 지문, 제목, 본문. 순흑이 아닌 다크 네이비로 부드러운 대비.
- **Secondary Text** (`#6B7280`): 라벨, 설명, 부가 정보. 14px에서 주로 사용.
- **Caption Text** (`#9CA3AF`): 타임스탬프, disabled 상태, 최소 강조 텍스트.

### Brand & Accent
- **Brand Indigo** (`#4F46E5`): Primary CTA, 활성 상태, 인터랙티브 요소. 유일한 유채색.
- **Accent Light** (`#EEF2FF`): 뱃지 배경, 사이드바 활성 항목, hover tint.
- **Accent Medium** (`#818CF8`): 히트맵 중간 톤, secondary 강조.

### Semantic Colors
- **Success** (`#22C55E`): SQL 실행 성공, 정답 표시.
- **Success Light** (`#F0FDF4`): 성공 카드 배경.
- **Success Text** (`#16A34A`): 성공 메타데이터 텍스트.
- **Error** (`#EF4444`): SQL 실행 에러, 오답 표시.
- **Error Light** (`#FEF2F2`): 에러 카드 배경.
- **Error Text** (`#DC2626`): 에러 메타데이터 텍스트.
- **Warning** (`#F59E0B`): 난이도 별, 스트릭 뱃지.
- **Warning Light** (`#FEF3C7`): 스트릭 pill 배경.
- **Warning Text** (`#D97706`): 스트릭 텍스트.

### Border & Divider
- **Border Default** (`#E5E7EB`): 카드 테두리, 구분선, 입력 필드 기본 보더.
- **Border Muted** (`#D1D5DB`): 라디오 버튼 미선택 상태, drag handle.

### Dark UI (역전 영역)
- **Toast Background** (`#1F2937`): 토스트 메시지 다크 배경.
- **Dialog Overlay** (`rgba(17, 24, 39, 0.5)`): 모달/바텀시트 오버레이.

### Heatmap Scale (5단계)
- Level 0 (`#F5F5F5`): 0–30% 숙련도
- Level 1 (`#EEF2FF`): 31–50%
- Level 2 (`#C7D2FE`): 51–70%
- Level 3 (`#818CF8`): 71–85%
- Level 4 (`#4F46E5`): 86–100%

## 3. Typography Rules

### Font Family
- **UI**: `Pretendard Variable`, fallbacks: `Pretendard, sans-serif`
- **Code**: `JetBrains Mono`, fallbacks: `monospace`
- Pretendard는 한국어+영문 모두 커버. 별도 영문 폰트 불필요.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Use |
|------|------|------|--------|-------------|-----|
| Heading 1 | Pretendard | 28px | 700 | 1.3 | 페이지 제목, 큰 숫자(통계) |
| Heading 2 | Pretendard | 22px | 700 | 1.3 | 섹션 제목, 카드 헤더 |
| Body | Pretendard | 16px | 400 | 1.6 | 문제 지문, 본문 텍스트 |
| Secondary | Pretendard | 14px | 400 | 1.6 | 라벨, 설명, 필터 텍스트 |
| Caption | Pretendard | 12px | 400 | 1.5 | 타임스탬프, 버전, 메타 |
| Code | JetBrains Mono | 14px | 400 | 1.5 | SQL 코드 블록, 스키마 DDL |
| Code Small | JetBrains Mono | 13px | 400 | 1.5 | 테이블 셀 값, 에러 코드, UUID |

### Principles
- **Pretendard for ALL UI**: heading, body, button, label, navigation, description — 예외 없이 Pretendard.
- **JetBrains Mono for code ONLY**: SQL 코드 블록, 스키마 DDL, 실행 결과 테이블 값, 에러 코드, UUID 문자열.
- **Weight 3단계**: 400 (본문), 500 (사이드바 항목, 뱃지), 700 (제목, CTA 버튼).
- **한국어 텍스트 전체**: 모든 UI 텍스트는 한국어. 영문은 SQL 코드와 기술 용어에서만.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#4F46E5`
- Text: `#FFFFFF`, 16px weight 700
- Height: 44px, Padding: 0 24px
- Radius: 8px
- Hover: `opacity: 0.9`
- Use: 제출, 다음 문제, 주요 CTA

**Secondary Button**
- Background: `#FFFFFF`
- Text: `#4F46E5`, 16px weight 600
- Border: `1px solid #4F46E5`
- Height: 44px, Radius: 8px
- Hover: background → `#EEF2FF`
- Use: 유사 문제 복습, 보조 액션

**Compact Button**
- Background: transparent
- Text: `#4F46E5`, 14px weight 500
- Border: `1px solid #4F46E5`
- Height: 32px, Padding: 0 12px
- Radius: 8px
- Use: SQL "실행" 버튼 (코드 블록 옆 인라인)

**Disabled Button**
- Background: `#E5E7EB`
- Text: `#9CA3AF`
- Cursor: not-allowed
- Use: 선택지 미선택 시 제출 버튼

### Cards & Containers
- Background: `#FFFFFF` (solid — 반투명 아님)
- Border: `1px solid #E5E7EB`
- Radius: 12px
- Padding: 20px
- Shadow: 없음 (배경색 차이로 elevation 표현)

### Code Block
- Background: `#F3F4F6`
- Border-left: `4px solid #4F46E5`
- Radius: 8px
- Padding: 16px
- Font: JetBrains Mono 14px, line-height 1.5
- Use: SQL 코드 표시, 스키마 DDL

### Data Table
- Width: 100%, border-collapse
- Header: Pretendard 13px weight 700, color `#6B7280`
- Cell: JetBrains Mono 13px, tabular-nums
- Row height: 36px
- Zebra: even rows `#FAFAFA`
- Use: SQL 실행 결과 테이블

### Error Card
- Background: `#FEF2F2`
- Border-left: `4px solid #EF4444`
- Radius: 8px, Padding: 16px
- Use: SQL 실행 에러 결과

### Success Card
- Background: `#F0FDF4`
- Border-left: `4px solid #22C55E`
- Radius: 8px, Padding: 16px
- Use: SQL 실행 성공 결과

### Badge (Topic Pill)
- Background: `#EEF2FF`
- Text: `#4F46E5`, 12px weight 500
- Radius: 999px
- Height: 24px, Padding: 2px 10px
- Use: 토픽 태그 (JOIN, GROUP BY 등)

### Filter Dropdown
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Radius: 999px
- Height: 40px, Padding: 0 16px
- Active: border `#4F46E5` + bg `#EEF2FF`
- Use: 토픽/난이도 필터

### Radio Button
- Size: 20px circle
- Default: `2px solid #D1D5DB`
- Selected: `#4F46E5` filled + 8px white inner dot
- Use: 문제 선택지 A/B/C/D

### Toast
- Background: `#1F2937` (dark)
- Text: white, 14px
- Radius: 8px
- Position: fixed bottom center
- Use: 일시적 알림

### Dialog / Bottom Sheet
- Overlay: `rgba(17, 24, 39, 0.5)`
- Mobile: rounded-t-2xl, drag handle (40px x 4px, `#D1D5DB`)
- Desktop: centered modal, 520px, 16px radius
- Use: AI 해설 시트

### Navigation
- **Mobile**: Fixed bottom tab bar, 56px height, 4 tabs
  - Active: `#4F46E5` icon + text
  - Inactive: `#9CA3AF` icon, `#6B7280` text
- **Desktop**: Left sidebar 220px, sticky
  - Active: `#EEF2FF` background + `#4F46E5` text
  - Hover: `#FAFAFA` background
  - Font: 14px weight 500

## 5. Layout Principles

### Spacing System
- Base unit: 4px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px
- Section gap: 24px (`--spacing-section`)
- Module gap: 32px (`--spacing-module`)

### Grid & Container
- Content max-width: 720px (centered)
- Desktop sidebar: 220px
- Mobile: single column, 16px horizontal padding
- Card gap: 12px

### Whitespace Philosophy
- **밝음이 공간**: `#FAFAFA` 배경 자체가 여백. 카드와 카드 사이의 회색 공간이 자연스러운 구분선.
- **콘텐츠가 왕**: SQL 코드와 문제 지문이 가장 눈에 띄어야 함. 장식 요소 없음.
- **충분한 내부 패딩**: 카드 내부 20px 패딩으로 콘텐츠에 숨 쉴 공간.

### Border Radius Scale
- Button (8px): 버튼, 입력 필드, 코드 블록
- Card (12px): 카드, 드롭다운
- Sheet (16px): 모달, 바텀시트
- Pill (999px): 필터, 뱃지, 라디오 버튼 그룹
- Circle (50%): 아이콘 버튼, 아바타

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (Level 0) | `#FAFAFA` bg, no border | 페이지 배경 |
| Surface (Level 1) | `#FFFFFF` bg + `1px solid #E5E7EB` | 카드, 입력 필드, 사이드바 |
| Code (Level 1b) | `#F3F4F6` bg + `4px left border #4F46E5` | SQL 코드 블록 |
| Semantic (Level 1c) | `#F0FDF4` or `#FEF2F2` bg + `4px left border` | 성공/에러 결과 카드 |
| Overlay (Level 2) | `rgba(17, 24, 39, 0.5)` | 모달 오버레이 |
| Toast (Level 3) | `#1F2937` bg, white text | 토스트 메시지 |

**Elevation 철학**: 그림자 대신 배경색 차이로 depth 표현. `#FAFAFA` → `#FFFFFF` → `#F3F4F6` 세 단계의 밝기 차이가 시각적 위계를 만든다. 4px 좌측 색상 보더가 시맨틱 카드의 유일한 장식 요소.

## 7. Do's and Don'ts

### Do
- Pretendard를 모든 UI 텍스트에 사용 — heading, body, button, label 예외 없음
- JetBrains Mono는 SQL 코드, 에러 코드, UUID, 테이블 값에만 사용
- `#4F46E5` 인디고는 interactive 요소(버튼, 링크, 활성 상태)에만 사용
- 카드는 항상 `#FFFFFF` + `1px solid #E5E7EB` + 12px radius
- 시맨틱 색상(초록/빨강)은 SQL 실행 결과와 정답/오답에만 사용
- lucide-react 아이콘만 사용 — `import { IconName } from "lucide-react"`
- 에러 시 ErrorFallback 컴포넌트로 graceful 처리
- 로딩 시 skeleton UI (animate-pulse) 표시

### Don't
- 이모지, 유니코드 심볼(✓, ✕, →, ★ 등)을 코드에 사용하지 않음
- `#4F46E5` 인디고를 장식적으로 사용하지 않음 — interactive 전용
- 그림자(box-shadow)로 elevation을 표현하지 않음 — 배경색 차이 사용
- 순흑(`#000000`)이나 순백(`#FFFFFF`)을 텍스트에 사용하지 않음 — `#111827`과 배경은 `#FAFAFA`
- Pretendard에서 weight 800+ 사용하지 않음 — 최대 700
- SQL 코드가 아닌 일반 텍스트에 JetBrains Mono 사용하지 않음
- 4px 좌측 보더를 시맨틱 의미 없이 장식으로 사용하지 않음 — 코드 블록과 시맨틱 카드 전용
- glassmorphism, gradient, noise texture 사용하지 않음

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 1024px | 하단 탭바, 단일 컬럼, 16px 패딩 |
| Desktop | >= 1024px | 좌측 사이드바 220px, 중앙 720px 콘텐츠 |

### Navigation 전환
- Mobile: 하단 탭바 56px (홈/문제/통계/설정)
- Desktop: 좌측 사이드바 220px + 중앙 정렬 콘텐츠

### Collapsing Strategy
- 카드: 단일 컬럼 유지 (모바일/데스크톱 동일)
- 통계 카드: 2열 그리드 → 모바일에서도 2열 유지 (좁은 카드)
- 히트맵: 4열(데스크톱) → 3열(모바일)
- 필터 드롭다운: 가로 나열 유지

### Dialog 전환
- Mobile: 바텀시트 (rounded-t-2xl, 90vh, drag handle)
- Desktop: 중앙 모달 (520px, 80vh, 16px radius)

## 9. Agent Prompt Guide

### Quick Color Reference
- Page Background: `#FAFAFA`
- Card Background: `#FFFFFF`
- Primary CTA: `#4F46E5`
- Accent Light: `#EEF2FF`
- Heading text: `#111827`
- Body text: `#6B7280`
- Caption text: `#9CA3AF`
- Border: `#E5E7EB`
- Code bg: `#F3F4F6`
- Success: `#22C55E` / `#F0FDF4`
- Error: `#EF4444` / `#FEF2F2`
- Toast bg: `#1F2937`

### Example Component Prompts
- "카드 만들기: `#FFFFFF` bg, `1px solid #E5E7EB` border, 12px radius, 20px padding. 제목 Pretendard 22px weight 700 `#111827`. 본문 16px weight 400 `#111827`."
- "SQL 코드 블록: `#F3F4F6` bg, `4px solid #4F46E5` left border, 8px radius, 16px padding. JetBrains Mono 14px `#111827`."
- "Primary 버튼: `#4F46E5` bg, white text, Pretendard 16px weight 700, 44px height, 8px radius. Hover: opacity 0.9."
- "토픽 뱃지: `#EEF2FF` bg, `#4F46E5` text, 12px weight 500, 999px radius, 24px height."
- "에러 카드: `#FEF2F2` bg, `4px solid #EF4444` left border, 8px radius. 에러 코드 JetBrains Mono bold `#EF4444`. 메시지 Pretendard 14px `#111827`."

### Iteration Guide
1. 모든 텍스트에 Pretendard — SQL/코드만 JetBrains Mono
2. `#4F46E5` 인디고는 클릭 가능한 요소에만 — 장식 금지
3. Weight 3단계: 400(본문), 500(라벨), 700(제목/CTA)
4. Elevation = 배경색 차이 (`#FAFAFA` → `#FFFFFF`) — 그림자 없음
5. 4px 좌측 색상 보더 = 코드 블록(인디고) + 시맨틱 카드(초록/빨강)
6. 아이콘은 반드시 lucide-react — 이모지 금지
7. 한국어 텍스트 전체 — 영문은 SQL과 기술 용어에서만
