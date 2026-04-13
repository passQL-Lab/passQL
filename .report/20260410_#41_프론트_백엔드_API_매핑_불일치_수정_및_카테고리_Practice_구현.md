### 📌 작업 개요

프론트-백엔드 API 필드명 불일치(snake_case→camelCase) 수정, 카테고리 기반 Practice 세트 풀이 기능 구현, Three.js 3D 통계 시각화 추가, 브랜딩(로고/파비콘) 적용. 총 51개 커밋.

**보고서 파일**: `.report/20260410_#41_프론트_백엔드_API_매핑_불일치_수정_및_카테고리_Practice_구현.md`

---

### 🎯 구현 목표

1. 프론트 AI 타입/API를 백엔드 camelCase 스펙에 맞춰 수정
2. 미지원 choiceSetId / generateChoices 관련 코드 제거
3. 홈 화면 API 연동 및 구텐베르크 레이아웃
4. 카테고리 카드 선택 → 10문제 순차 풀이 → 3스텝 결과 요약
5. Three.js 3D 바 차트 통계 시각화 + 2D/3D 토글
6. passQL 로고/파비콘 브랜딩 적용

---

### ✅ 구현 내용

#### Phase 1: API 매핑 불일치 수정

##### 타입 수정
- **파일**: `src/types/api.ts`
- **변경**: `ExplainErrorPayload.error_message` → `errorMessage`, `DiffExplainPayload.question_id`(number) → `questionUuid`(string), `selected_key` → `selectedChoiceKey`, `SubmitPayload`에서 `choiceSetId` 제거, 미사용 SSE 타입 제거
- **이유**: 백엔드(Spring) camelCase 스펙과 일치시켜 API 호출 실패 방지

##### API 호출부 수정
- **파일**: `src/api/ai.ts`, `src/api/questions.ts`
- **변경**: body 필드명 camelCase 변환, `generateChoices()` 함수 삭제
- **이유**: 프론트는 백엔드 스펙만 따름

#### Phase 2: 홈 화면 API 연동

##### 홈 화면 4개 API 병렬 호출
- **파일**: `src/pages/Home.tsx`, `src/hooks/useHome.ts`
- **변경**: greeting, 오늘의 문제, 추천 문제, 시험 일정 API 연동. 구텐베르크 레이아웃 적용

##### 히트맵 캘린더 + 유사 문제 추천
- **파일**: `src/components/HeatmapCalendar.tsx`, `src/pages/AnswerFeedback.tsx`
- **변경**: 30일 학습 기록 히트맵, 오답 시 유사 문제 추천 섹션

#### Phase 3: 카테고리 Practice 세트 풀이

##### 카테고리 카드 목록
- **파일**: `src/pages/CategoryCards.tsx`, `src/constants/topicIcons.ts`
- **변경**: 기존 필터 드롭다운 → 반응형 카드 그리드(2열/3열). lucide 아이콘 동적 매핑. 문제 생성 실패 시 에러 피드백 표시

##### 로딩 오버레이 + 마이크로카피
- **파일**: `src/components/LoadingOverlay.tsx`, `src/constants/microcopy.ts`
- **변경**: 유머 톤 마이크로카피 6종 3초마다 랜덤 전환

##### Practice Store
- **파일**: `src/stores/practiceStore.ts`
- **변경**: `submitAndAdvance` 단일 액션으로 결과 기록 + 인덱스 이동 + 타이머 리셋을 1회 `set()`으로 처리. 점진적 문제 추가(`addQuestion`) 지원

##### Practice API + Mock Fallback
- **파일**: `src/api/practice.ts`, `src/api/mock-data.ts`
- **변경**: 첫 문제만 즉시 반환, 나머지 9문제 점진 추가(0.5~2초 간격). `VITE_USE_MOCK=false`여도 practice 엔드포인트 자동 mock fallback

##### 세트 풀이 래퍼
- **파일**: `src/pages/PracticeSet.tsx`
- **변경**: 진행률 바 + 홈 버튼 + QuestionDetail 재활용. store 기반 문제 전환(navigate 제거). Zustand 셀렉터 개별 구독

##### 3스텝 결과 요약
- **파일**: `src/pages/PracticeResult.tsx`, `src/components/ScoreCountUp.tsx`, `src/components/StepNavigator.tsx`
- **변경**:
  - 스텝 1: 점수 카운트업 (이징 + 바운스 + 색상 전환)
  - 스텝 2: 대화체 인사 + 강/약점 하이라이트 + Tip
  - 스텝 3: 문제별 결과 카드 + "다시" 버튼
  - 홈 버튼(첫 스텝) / 뒤로가기(이후) + dot indicator + 스와이프

##### QuestionDetail 레이아웃 통일
- **파일**: `src/pages/QuestionDetail.tsx`
- **변경**: practice/일반 모드 동일 UI. sticky 지문(토글) + 스키마(토글) + 스크롤 선택지 + 하단 버튼

#### Phase 4: 성능 최적화

- `recordResult` + `nextQuestion` + `startTimer` 3개 `set()` → `submitAndAdvance` 1개로 통합
- URL 기반 인덱스 제거 → store 기반 문제 전환 (navigate 리렌더 제거)
- 전체 store 구독 → 셀렉터 개별 구독
- practice 모드 `submitAnswer` API 호출 제거
- **결과**: 문제 전환 시 리렌더 4~5회 → 1회

#### Phase 5: Three.js 3D 통계 시각화

##### 3D 바 차트 컴포넌트
- **파일**: `src/components/Stats3DChart.tsx`
- **변경**: Three.js r183 기반 3D 막대 차트. 카테고리별 높이 = 정답률, 색상 = 성취도(빨강→주황→인디고→초록). 드래그 회전, 스크롤 확대, 호버 툴팁(카테고리명/정답률/풀이수/프로그레스바), 클릭 시 해당 카테고리 Practice 시작. ease-out cubic 성장 애니메이션

**특이사항**:
- Three.js r183은 r128 대비 물리 기반 조명 시스템 변경. 동일 밝기를 위해 조명 강도를 대폭 상향 (ambient 2.8, directional 1.8)
- `MeshStandardMaterial`의 emissive/metalness/roughness 튜닝으로 선명한 색감 확보

##### 2D 바 차트 컴포넌트
- **파일**: `src/components/Stats2DChart.tsx`
- **변경**: 정답률 순 정렬 프로그레스 바 카드 리스트. 클릭 시 Practice 시작

##### Stats 페이지 리뉴얼
- **파일**: `src/pages/Stats.tsx`
- **변경**: 제목 "내 실력, 한눈에" + 부제 "약한 막대를 눌러 바로 연습해보세요". 2D/3D 토글 (BarChart3/Box 아이콘 세그먼트 컨트롤). 카테고리별 통계 데이터 API 연동

##### Mock 데이터 일관성
- **파일**: `src/api/mock-data.ts`
- **변경**: `MOCK_CATEGORY_STATS`를 `MOCK_TOPICS`에서 자동 생성하여 카테고리 수 일관성 유지. `/progress?memberUuid` 경로 매칭 수정 (`===` → `startsWith`)

#### Phase 6: 브랜딩 (로고/파비콘)

##### 로고 적용
- **파일**: `src/components/AppLayout.tsx`, `src/pages/Settings.tsx`, `src/assets/logo/logo.png`
- **변경**: 데스크톱 사이드바 상단에 로고 이미지. 사이드바 하단에 작은 로고(opacity 40%) + "© 2026 passQL". 설정 페이지 하단에 로고 + 저작권 표시

##### 파비콘 변경
- **파일**: `index.html`, `public/favicon.png`
- **변경**: `favicon.svg` → `favicon.png` 교체

#### Phase 7: 코드 품질 (코드리뷰 반영)

##### 에러 핸들링 개선
- **파일**: `src/pages/CategoryCards.tsx`
- **변경**: 문제 생성 실패 시 에러 묵살 → "문제 생성에 실패했어요. 다시 시도해주세요." 에러 배너 표시

##### 프로덕션 안전성
- **파일**: `src/api/client.ts`
- **변경**: `console.warn` mock miss 경고에 `IS_DEV` 가드 추가

---

### 📦 의존성 변경

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `three` | 0.183.2 | 3D 통계 바 차트 렌더링 |
| `@types/three` | - | Three.js TypeScript 타입 |

---

### 🔧 주요 변경사항 상세

#### 신규 파일 (12개)
| 파일 | 역할 |
|------|------|
| `src/pages/CategoryCards.tsx` | 카테고리 카드 그리드 + 로딩 오버레이 |
| `src/pages/PracticeSet.tsx` | 세트 풀이 래퍼 |
| `src/pages/PracticeResult.tsx` | 3스텝 결과 요약 |
| `src/stores/practiceStore.ts` | Practice Zustand 스토어 |
| `src/api/practice.ts` | 문제 생성/결과 제출 API + mock fallback |
| `src/components/LoadingOverlay.tsx` | 로딩 오버레이 + 마이크로카피 |
| `src/components/ScoreCountUp.tsx` | 점수 카운트업 애니메이션 |
| `src/components/StepNavigator.tsx` | 3스텝 네비게이션 |
| `src/components/Stats3DChart.tsx` | Three.js 3D 바 차트 |
| `src/components/Stats2DChart.tsx` | 2D 프로그레스 바 차트 |
| `src/constants/topicIcons.ts` | 카테고리 아이콘 매핑 |
| `src/constants/microcopy.ts` | 로딩 마이크로카피 |

#### 수정 파일 (주요)
| 파일 | 변경 요약 |
|------|-----------|
| `src/types/api.ts` | Practice/CategoryStats 타입 추가, AI payload camelCase |
| `src/api/mock-data.ts` | practice mock, 카테고리 통계 자동 생성, 경로 매칭 수정 |
| `src/pages/QuestionDetail.tsx` | 레이아웃 통일, practiceMode/questionUuid prop |
| `src/pages/Stats.tsx` | 3D/2D 토글, 카테고리 클릭→Practice 시작 |
| `src/components/AppLayout.tsx` | 로고 적용, 사이드바 하단 저작권 |
| `src/App.tsx` | practice 라우트 추가, Questions→CategoryCards 교체 |

---

### 🧪 테스트 및 검증

- **빌드**: `npm run build` 통과
- **테스트**: `npx vitest run` — 8 파일, 98 테스트 전체 통과
- **배포**: Vercel production 배포 완료
- **코드리뷰**: CRITICAL 0건, HIGH 3건 (의도적 mock 하드코딩 2건 + 에러 핸들링 1건 수정완료)
- **수동 플로우 검증**:
  1. `/questions` → 카테고리 카드 표시
  2. 카드 클릭 → 로딩 오버레이 → 문제 풀이
  3. 10문제 완료 → 3스텝 결과 (점수 카운트업 + AI 분석 + 문제별 결과)
  4. `/stats` → 3D 바 차트 + 2D 토글 + 막대 클릭→Practice
  5. 로고/파비콘 정상 표시

---

### 📌 참고사항

- **백엔드 미확정 API**: `/practice/generate`, `/practice/submit`, `/progress/categories`는 mock으로 동작. 백엔드 확정 시 `practiceFetch` fallback 제거
- **정답 판별**: mock에서 선택지 "A" 하드코딩 (`PracticeSet.tsx:37`). 실제 API 연동 시 백엔드가 판별
- **Three.js r183 조명**: r128 대비 물리 기반 조명 스케일이 다름. ambient 2.8 / directional 1.8로 보정
- **총 커밋**: 51개, 모두 `#41` 태그 포함
