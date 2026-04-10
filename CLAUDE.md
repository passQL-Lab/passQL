# passQL App (Flutter)

## Tech Stack

- **Flutter** 3.x + **Dart** SDK ^3.9.2
- **상태관리**: flutter_riverpod ^2.6.1 + riverpod_annotation (코드 생성)
- **라우팅**: go_router ^17.0.1
- **HTTP 클라이언트**: Dio ^5.9.0 + Retrofit 4.7.3
- **인증**: Firebase Auth ^6.1.3 + Google Sign-In + Apple Sign-In
- **지도**: google_maps_flutter ^2.14.0
- **실시간 통신**: stomp_dart_client ^3.0.1 (WebSocket/STOMP)
- **불변 데이터 모델**: freezed ^2.5.7 + json_serializable
- **코드 생성**: build_runner ^2.4.14

## 주요 패키지 요약

| 카테고리 | 패키지 |
|----------|--------|
| 상태관리 | flutter_riverpod, riverpod_annotation, riverpod_generator |
| 네트워크 | dio, retrofit, retrofit_generator |
| 인증 | firebase_auth, google_sign_in, sign_in_with_apple, flutter_secure_storage |
| 라우팅 | go_router |
| 지도/위치 | google_maps_flutter, geolocator |
| 알림/푸시 | firebase_messaging, flutter_local_notifications |
| Firebase | firebase_core, firebase_remote_config, firebase_crashlytics |
| 데이터 모델 | freezed_annotation, json_annotation |
| UI | flutter_screenutil, flutter_svg, animations, shimmer, toggle_switch |
| QR | qr_flutter (생성), mobile_scanner (스캔) |
| 기타 | shared_preferences, flutter_dotenv, uuid, package_info_plus, device_info_plus, vibration, url_launcher, share_plus, font_awesome_flutter |

## Project Structure

```
lib/
├── main.dart               # 앱 진입점
├── core/                   # 공통 유틸리티, 상수, 테마
│   ├── constants/
│   ├── theme/
│   └── utils/
├── data/                   # API 클라이언트, 모델, 리포지토리
│   ├── models/             # freezed 데이터 모델
│   ├── repositories/       # 리포지토리 구현체
│   └── sources/            # Retrofit API 정의
├── domain/                 # 비즈니스 로직, 유스케이스
├── presentation/           # UI 레이어
│   ├── pages/              # 화면 단위 컴포넌트
│   ├── widgets/            # 공용 위젯
│   └── providers/          # Riverpod 프로바이더
└── router/                 # go_router 라우팅 설정
assets/
├── fonts/                  # Pretendard, Moneygraphy 폰트
├── icons/                  # SVG 아이콘
└── .env                    # 환경 변수
docs/                       # API 문서 및 기획 문서
```

## 코드 생성

모델/API 변경 후 반드시 실행:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
# 또는 watch 모드
flutter pub run build_runner watch --delete-conflicting-outputs
```

## Local Skills (`.agents/skills/`)

### flutter-dart-code-review

Flutter/Dart 코드 리뷰 시 참조. 위젯 best practice, 상태관리 패턴, Dart 이디엄.

### find-skills

새로운 스킬이 필요할 때 `npx skills find [query]`로 검색.

## 금지 규칙

- **`git push` 절대 금지** — 어떤 상황에서도 원격에 push하지 않는다
- **커밋 시 Co-Authored-By 태그 금지** — 커밋 메시지에 절대 추가하지 않는다
- **파일 삭제 시 반드시 사용자 허락** — 확인 없이 파일을 삭제하지 않는다
- **모르면 모른다고 말하기** — 확실하지 않은 내용을 추측하지 않는다
- **답변은 항상 한국어로** — 코드/커맨드 제외 모든 응답은 한국어
- **코드 주석 필수** — 실무 수준의 간결한 한국어 주석 작성 (WHY 중심, 과하지 않게)

## Icon Policy

- 코드에서 이모지(emoji) 사용 절대 금지.
- UI 아이콘은 `font_awesome_flutter` 또는 Flutter 기본 `Icons` 사용.
- SVG 아이콘은 `flutter_svg` 패키지로 렌더링.

## Rules (`.claude/rules/`)

### api-guide

API 연동 시 반드시 참조. 엔드포인트 스펙, 코드 패턴, 에러 처리 규칙 포함.

- 프론트는 백엔드(Spring)하고만 통신. AI 서버 직접 호출 금지.
- 새 API 추가 시 Retrofit 인터페이스 정의 후 코드 생성 사용.

## Git Conventions

- 커밋 메시지에 반드시 이슈 태그를 붙인다. 형식: `<type>: <description> #<issue-number>`
- 예: `feat: 카테고리 연습 모드 추가 #41`

## Commands

```bash
flutter run                          # 개발 서버 (연결된 기기/에뮬레이터)
flutter run --flavor dev             # dev 플레이버 실행
flutter build apk --release          # Android 릴리즈 빌드
flutter build ipa --release          # iOS 릴리즈 빌드
flutter test                         # 전체 테스트 실행
flutter analyze                      # 정적 분석
flutter pub get                      # 패키지 설치
flutter pub run build_runner build --delete-conflicting-outputs  # 코드 생성
```
