## 제목

🎨 [기능개선][설정] Settings 페이지 flat 스타일 리디자인

## 본문

## 📝 현재 문제점

- Settings.tsx가 카드(`bg-surface-card border rounded-2xl`) 기반 레이아웃을 사용
- iOS 설정 앱, 토스 등 표준 모바일 패턴과 달리 설정 탭이 카드 컨테이너 중심 구조
- 설정 항목이 늘어날수록 카드가 중첩되어 시각적으로 무거워지는 구조적 문제

## 🛠️ 해결 방안 / 제안 기능

iOS 설정 앱 스타일의 flat 리스트 패턴으로 전환:

- **Section 헤더**: 회색 소문자 라벨만 (SettingsSection 컴포넌트 경량화)
- **Row**: 카드 컨테이너 제거 → 풀 너비 row + 얇은 구분선(border-bottom)만
- **시각적 위계**: rounded card elevation 대신 section 간 여백과 구분선으로 표현
- **기존 SettingsRow 컴포넌트** 재사용 (wrapper만 변경)

참고 패턴: iOS 설정 앱, 토스 설정 화면

## ⚙️ 작업 내용

- `src/pages/Settings.tsx`: 카드 wrapper 제거, flat row 스타일 적용
- `src/components/SettingsSection.tsx`: 섹션 헤더 스타일 경량화
- `src/components/SettingsRow.tsx`: `isLast` prop 불필요 → border-bottom 구분선 방식으로 변경

## 🔗 선행 작업

- #209 완료 후 진행 (건의사항 서브페이지 분리)

## 🙋‍♂️ 담당자

- 프론트엔드: @EM-H20
