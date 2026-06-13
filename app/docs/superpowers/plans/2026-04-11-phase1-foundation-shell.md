# passQL App — Phase 1: Foundation & Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** passQL 앱의 기초 구조를 구축한다 — 디자인 시스템 토큰, 바텀 네비게이션 쉘, go_router 라우팅, 앱 부트스트랩.

**Architecture:** layer-first(`core/`, `presentation/`, `router/`) 구조로 구성. ProviderScope(Riverpod) + MaterialApp.router(go_router) + ScreenUtilInit(반응형)을 조합한 부트스트랩. ShellRoute로 바텀 탭 4개를 구현하며, 탭 바깥의 full-screen 라우트(문제 상세, 결과, 연습)는 루트 네비게이터에서 처리한다.

**Tech Stack:** Flutter 3.x · go_router ^17.0.1 · flutter_riverpod ^2.6.1 · flutter_screenutil ^5.9.3 · flutter_dotenv ^6.0.0 · font_awesome_flutter ^11.0.0

---

## 파일 구조 (생성/수정 대상)

```
lib/
├── core/
│   ├── app_colors.dart        ← 수정: Design System 색상 추가
│   ├── text_styles.dart       ← 수정: JetBrains Mono 스타일 추가, body/code 구분
│   └── app_theme.dart         ← 생성: MaterialApp ThemeData
├── router/
│   ├── app_router.dart        ← 생성: GoRouter 인스턴스 + ShellRoute
│   └── app_routes.dart        ← 생성: 경로 상수
├── presentation/
│   ├── widgets/
│   │   └── app_shell.dart     ← 생성: 바텀 네비게이션 쉘
│   └── pages/
│       ├── home/
│       │   └── home_page.dart             ← 생성: 플레이스홀더
│       ├── questions/
│       │   ├── topic_list_page.dart       ← 생성: 플레이스홀더
│       │   └── question_detail_page.dart  ← 생성: 플레이스홀더 (라우트 연결용)
│       ├── result/
│       │   └── result_page.dart           ← 생성: 플레이스홀더 (라우트 연결용)
│       ├── practice/
│       │   ├── practice_page.dart         ← 생성: 플레이스홀더 (라우트 연결용)
│       │   └── practice_result_page.dart  ← 생성: 플레이스홀더 (라우트 연결용)
│       ├── stats/
│       │   └── stats_page.dart            ← 생성: 플레이스홀더
│       └── settings/
│           └── settings_page.dart         ← 생성: 플레이스홀더
└── main.dart                  ← 수정: ProviderScope + ScreenUtilInit + MaterialApp.router

test/
├── core/
│   └── app_colors_test.dart   ← 생성
├── router/
│   └── app_router_test.dart   ← 생성
└── presentation/
    └── widgets/
        └── app_shell_test.dart ← 생성
```

---

## Task 1: AppColors — Design System 색상 추가

**Files:**
- Modify: `lib/core/app_colors.dart`
- Test: `test/core/app_colors_test.dart`

현재 AppColors는 blue 기반 팔레트다. Design System(`Design.md`)은 `#4F46E5` 인디고를 브랜드 컬러로 사용한다. 기존 색상은 보존하고 Design System 토큰을 추가한다.

- [ ] **Step 1: 테스트 파일 생성 (FAIL)**

`test/core/app_colors_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:passql_app/core/app_colors.dart';

void main() {
  group('AppColors — Design System 토큰', () {
    test('브랜드 인디고가 #4F46E5다', () {
      expect(AppColors.brandIndigo.value, equals(const Color(0xFF4F46E5).value));
    });

    test('페이지 배경이 #FAFAFA다', () {
      expect(AppColors.pageBg.value, equals(const Color(0xFFFAFAFA).value));
    });

    test('카드 배경이 #FFFFFF다', () {
      expect(AppColors.cardBg.value, equals(const Color(0xFFFFFFFF).value));
    });

    test('코드 블록 배경이 #F3F4F6다', () {
      expect(AppColors.codeBg.value, equals(const Color(0xFFF3F4F6).value));
    });

    test('기본 테두리가 #E5E7EB다', () {
      expect(AppColors.borderDefault.value, equals(const Color(0xFFE5E7EB).value));
    });

    test('성공 색상이 #22C55E다', () {
      expect(AppColors.success.value, equals(const Color(0xFF22C55E).value));
    });

    test('에러 색상이 #EF4444다', () {
      expect(AppColors.error.value, equals(const Color(0xFFEF4444).value));
    });
  });
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
flutter test test/core/app_colors_test.dart
```
Expected: `AppColors.brandIndigo` 없음으로 컴파일 에러

- [ ] **Step 3: `lib/core/app_colors.dart` 업데이트**

기존 코드 끝 `}` 닫기 직전에 다음 섹션 추가:

```dart
import 'package:flutter/material.dart';

/// 앱 전역 색상 팔레트
class AppColors {
  AppColors._();

  // ============================================
  // 기본 색상 (Base Colors) — 기존 유지
  // ============================================

  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF080A0C);

  static const Color black900 = Color(0xFF1E232A);
  static const Color black800 = Color(0xFF333D48);
  static const Color black700 = Color(0xFF485665);
  static const Color black600 = Color(0xFF5D6F83);
  static const Color black500 = Color(0xFF76899E);
  static const Color black400 = Color(0xFF93A2B3);
  static const Color black300 = Color(0xFFB1BCC8);
  static const Color black200 = Color(0xFFCFD6DD);
  static const Color black100 = Color(0xFFEDF0F2);

  static const Color green = Color(0xFF38F55B);
  static const Color green800 = Color(0xFF7AF391);
  static const Color green500 = Color(0xFFACF8BA);
  static const Color green100 = Color(0xFFEFFEF2);

  static const Color blue = Color(0xFF3F63D9);
  static const Color blue800 = Color(0xFF6582E1);
  static const Color blue500 = Color(0xFF9FB1EC);
  static const Color blue100 = Color(0xFFECF0FC);

  static const Color red = Color(0xFFF5383B);
  static const Color red900 = Color(0xFFE64C4F);
  static const Color red800 = Color(0xFFE76062);
  static const Color red500 = Color(0xFFFA9C9E);
  static const Color red100 = Color(0xFFFEECEC);

  static const Color yellow = Color(0xFFF5EF38);
  static const Color yellow900 = Color(0xFFF7F260);

  static const Color deepGreen = Color(0xFF00CE75);
  static const Color deepGreen900 = Color(0xFF33D890);

  // ============================================
  // Design System 토큰 (Design.md 기준)
  // ============================================

  // --- 배경 ---
  /// 페이지 캔버스 배경 — Scaffold backgroundColor
  static const Color pageBg = Color(0xFFFAFAFA);

  /// 카드/모달 배경 — Card, Container
  static const Color cardBg = Color(0xFFFFFFFF);

  /// 코드 블록 배경 — SQL 코드, 스키마 DDL
  static const Color codeBg = Color(0xFFF3F4F6);

  /// 테이블 짝수 행 배경
  static const Color zebraRow = Color(0xFFFAFAFA);

  // --- 텍스트 ---
  /// 주 텍스트 — 문제 지문, 제목
  static const Color textPrimary = Color(0xFF111827);

  /// 보조 텍스트 — 라벨, 설명
  static const Color textSecondary = Color(0xFF6B7280);

  /// 캡션 텍스트 — 타임스탬프, disabled
  static const Color textCaption = Color(0xFF9CA3AF);

  // --- 브랜드 인디고 ---
  /// 기본 브랜드 컬러 — CTA 버튼, 활성 상태, 링크
  static const Color brandIndigo = Color(0xFF4F46E5);

  /// 인디고 라이트 — 뱃지 배경, 사이드바 활성, hover tint
  static const Color accentLight = Color(0xFFEEF2FF);

  /// 인디고 미디엄 — 히트맵 중간 톤, secondary 강조
  static const Color accentMedium = Color(0xFF818CF8);

  // --- 테두리 ---
  /// 기본 테두리 — 카드, 입력 필드
  static const Color borderDefault = Color(0xFFE5E7EB);

  /// 흐린 테두리 — 라디오 버튼 미선택
  static const Color borderMuted = Color(0xFFD1D5DB);

  // --- 시맨틱: 성공 ---
  /// SQL 실행 성공, 정답
  static const Color success = Color(0xFF22C55E);
  static const Color successLight = Color(0xFFF0FDF4);
  static const Color successText = Color(0xFF16A34A);

  // --- 시맨틱: 에러 ---
  /// SQL 실행 에러, 오답
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEF2F2);
  static const Color errorText = Color(0xFFDC2626);

  // --- 시맨틱: 경고 ---
  /// 난이도 별, 스트릭 뱃지
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color warningText = Color(0xFFD97706);

  // --- 다크 UI ---
  /// 토스트 메시지 배경
  static const Color toastBg = Color(0xFF1F2937);

  /// 모달/바텀시트 오버레이
  static const Color overlay = Color(0x801F2937);

  // --- 히트맵 5단계 ---
  static const Color heatmap0 = Color(0xFFF5F5F5);
  static const Color heatmap1 = Color(0xFFEEF2FF);
  static const Color heatmap2 = Color(0xFFC7D2FE);
  static const Color heatmap3 = Color(0xFF818CF8);
  static const Color heatmap4 = Color(0xFF4F46E5);
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
flutter test test/core/app_colors_test.dart
```
Expected: `All tests passed.`

- [ ] **Step 5: 커밋**

```bash
git add lib/core/app_colors.dart test/core/app_colors_test.dart
git commit -m "feat: Design System 색상 토큰 추가 (AppColors) #1"
```

---

## Task 2: TextStyles — JetBrains Mono + Design System 스케일 추가

**Files:**
- Modify: `lib/core/text_styles.dart`

Design System은 SQL 코드/UUID/테이블 값에 JetBrains Mono를 사용한다. pubspec.yaml에는 이미 패키지가 없으므로 **시스템 monospace** 폴백을 사용한다 (JetBrains Mono 폰트 파일은 별도 추가 필요 — 이 태스크에서는 `fontFamily: 'monospace'` 사용).

Design System 5단계 텍스트 스케일(28/22/16/14/12px)에 맞는 별칭도 추가한다.

- [ ] **Step 1: `lib/core/text_styles.dart` 파일 끝 `}` 바로 앞에 추가**

```dart
  // ============================================
  // Design System 스케일 별칭 (Design.md 기준)
  // ============================================

  /// H1 — 페이지 제목, 큰 숫자 (28px Bold)
  static TextStyle get dsH1 => TextStyle(
    fontFamily: 'Pretendard-Bold',
    fontSize: 28.sp,
    height: 1.3,
    letterSpacing: -0.32,
  );

  /// H2 — 섹션 제목, 카드 헤더 (22px Bold)
  static TextStyle get dsH2 => TextStyle(
    fontFamily: 'Pretendard-Bold',
    fontSize: 22.sp,
    height: 1.3,
    letterSpacing: -0.32,
  );

  /// Body — 문제 지문, 본문 (16px Regular)
  static TextStyle get dsBody => TextStyle(
    fontFamily: 'Pretendard-Regular',
    fontSize: 16.sp,
    height: 1.6,
    letterSpacing: -0.16,
  );

  /// Secondary — 라벨, 설명, 필터 (14px Regular)
  static TextStyle get dsSecondary => TextStyle(
    fontFamily: 'Pretendard-Regular',
    fontSize: 14.sp,
    height: 1.6,
    letterSpacing: -0.16,
  );

  /// Caption — 타임스탬프, 메타 (12px Regular)
  static TextStyle get dsCaption => TextStyle(
    fontFamily: 'Pretendard-Regular',
    fontSize: 12.sp,
    height: 1.5,
    letterSpacing: 0,
  );

  // ============================================
  // 코드 스타일 (JetBrains Mono — monospace 폴백)
  // ============================================

  /// SQL 코드 블록, 스키마 DDL (14px monospace)
  static TextStyle get code => const TextStyle(
    fontFamily: 'monospace',
    fontSize: 14,
    height: 1.5,
    letterSpacing: 0,
  );

  /// 테이블 셀 값, 에러 코드, UUID (13px monospace)
  static TextStyle get codeSmall => const TextStyle(
    fontFamily: 'monospace',
    fontSize: 13,
    height: 1.5,
    letterSpacing: 0,
  );
```

> **Note:** `.sp`를 코드 스타일에 사용하지 않는 이유 — 코드 가독성은 고정 픽셀이 더 예측 가능하다.

- [ ] **Step 2: 정적 분석 통과 확인**

```bash
flutter analyze lib/core/text_styles.dart
```
Expected: `No issues found!`

- [ ] **Step 3: 커밋**

```bash
git add lib/core/text_styles.dart
git commit -m "feat: Design System 텍스트 스케일 + 코드 스타일 추가 #1"
```

---

## Task 3: AppTheme — MaterialApp ThemeData 생성

**Files:**
- Create: `lib/core/app_theme.dart`

- [ ] **Step 1: `lib/core/app_theme.dart` 파일 생성**

```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'text_styles.dart';

/// MaterialApp에 주입할 ThemeData.
///
/// 목표: Design.md의 "그림자 없음, 명시적 보더, 배경색 차이로 elevation 표현" 원칙 적용.
class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.pageBg,
    colorScheme: const ColorScheme.light(
      primary: AppColors.brandIndigo,
      onPrimary: AppColors.white,
      secondary: AppColors.accentMedium,
      onSecondary: AppColors.white,
      surface: AppColors.cardBg,
      onSurface: AppColors.textPrimary,
      error: AppColors.error,
      onError: AppColors.white,
    ),
    // 앱바
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.cardBg,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      shadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: AppTextStyles.dsH2.copyWith(color: AppColors.textPrimary),
    ),
    // 카드 — 그림자 없음, 명시적 보더
    cardTheme: CardTheme(
      color: AppColors.cardBg,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.borderDefault),
      ),
      margin: EdgeInsets.zero,
    ),
    // ElevatedButton — Primary CTA
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandIndigo,
        foregroundColor: AppColors.white,
        minimumSize: const Size.fromHeight(44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
        textStyle: AppTextStyles.label_16,
      ),
    ),
    // OutlinedButton — Secondary
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.brandIndigo,
        minimumSize: const Size.fromHeight(44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: const BorderSide(color: AppColors.brandIndigo),
        textStyle: AppTextStyles.label16Medium,
      ),
    ),
    // BottomNavigationBar
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.cardBg,
      selectedItemColor: AppColors.brandIndigo,
      unselectedItemColor: AppColors.textCaption,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: AppTextStyles.dsCaption,
      unselectedLabelStyle: AppTextStyles.dsCaption,
    ),
    // Divider
    dividerTheme: const DividerThemeData(
      color: AppColors.borderDefault,
      thickness: 1,
      space: 0,
    ),
    // 폰트
    fontFamily: 'Pretendard-Regular',
  );
}
```

- [ ] **Step 2: 정적 분석 통과 확인**

```bash
flutter analyze lib/core/app_theme.dart
```
Expected: `No issues found!`

- [ ] **Step 3: 커밋**

```bash
git add lib/core/app_theme.dart
git commit -m "feat: AppTheme — MaterialApp ThemeData 생성 #1"
```

---

## Task 4: 플레이스홀더 페이지 생성 (탭 4개 + 풀스크린 4개)

**Files:**
- Create: `lib/presentation/pages/home/home_page.dart`
- Create: `lib/presentation/pages/questions/topic_list_page.dart`
- Create: `lib/presentation/pages/questions/question_detail_page.dart`
- Create: `lib/presentation/pages/result/result_page.dart`
- Create: `lib/presentation/pages/practice/practice_page.dart`
- Create: `lib/presentation/pages/practice/practice_result_page.dart`
- Create: `lib/presentation/pages/stats/stats_page.dart`
- Create: `lib/presentation/pages/settings/settings_page.dart`

이 페이지들은 Phase 2+ 계획에서 구현된다. 지금은 라우팅 연결을 위한 최소한의 Scaffold만 만든다.

- [ ] **Step 1: 탭 페이지 4개 생성**

`lib/presentation/pages/home/home_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 홈 화면 — 플레이스홀더 (Phase 2에서 구현)
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('홈')),
    );
  }
}
```

`lib/presentation/pages/questions/topic_list_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 문제 탭 — 토픽 선택 화면 플레이스홀더 (Phase 3에서 구현)
class TopicListPage extends StatelessWidget {
  const TopicListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('문제')),
    );
  }
}
```

`lib/presentation/pages/stats/stats_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 통계 화면 플레이스홀더 (Phase 4에서 구현)
class StatsPage extends StatelessWidget {
  const StatsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('통계')),
    );
  }
}
```

`lib/presentation/pages/settings/settings_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 설정 화면 플레이스홀더 (Phase 5에서 구현)
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('설정')),
    );
  }
}
```

- [ ] **Step 2: 풀스크린 페이지 4개 생성**

`lib/presentation/pages/questions/question_detail_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 문제 상세/풀기 화면 플레이스홀더 (Phase 3에서 구현)
class QuestionDetailPage extends StatelessWidget {
  final String questionUuid;

  const QuestionDetailPage({super.key, required this.questionUuid});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('문제 풀기')),
      body: Center(child: Text('문제 UUID: $questionUuid')),
    );
  }
}
```

`lib/presentation/pages/result/result_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 정답/오답 피드백 화면 플레이스홀더 (Phase 3에서 구현)
///
/// [extra]는 Phase 3에서 SubmitResult 타입으로 교체된다.
class ResultPage extends StatelessWidget {
  final Object? extra;

  const ResultPage({super.key, this.extra});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('결과')),
      body: const Center(child: Text('결과 화면')),
    );
  }
}
```

`lib/presentation/pages/practice/practice_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 연습 모드 화면 플레이스홀더 (Phase 4에서 구현)
class PracticePage extends StatelessWidget {
  final String sessionId;

  const PracticePage({super.key, required this.sessionId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('연습 모드')),
      body: Center(child: Text('세션 ID: $sessionId')),
    );
  }
}
```

`lib/presentation/pages/practice/practice_result_page.dart`:
```dart
import 'package:flutter/material.dart';

/// 연습 결과 화면 플레이스홀더 (Phase 4에서 구현)
class PracticeResultPage extends StatelessWidget {
  const PracticeResultPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('연습 결과')),
      body: const Center(child: Text('연습 결과 화면')),
    );
  }
}
```

- [ ] **Step 3: 정적 분석 통과 확인**

```bash
flutter analyze lib/presentation/
```
Expected: `No issues found!`

- [ ] **Step 4: 커밋**

```bash
git add lib/presentation/
git commit -m "feat: 플레이스홀더 페이지 8개 생성 #1"
```

---

## Task 5: AppShell — 바텀 네비게이션 쉘

**Files:**
- Create: `lib/presentation/widgets/app_shell.dart`
- Test: `test/presentation/widgets/app_shell_test.dart`

ShellRoute의 `builder`에 전달되는 `child`를 감싸는 Scaffold. 현재 라우트 경로를 기반으로 선택된 탭을 결정한다.

- [ ] **Step 1: 테스트 파일 생성 (FAIL)**

`test/presentation/widgets/app_shell_test.dart`:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:passql_app/presentation/widgets/app_shell.dart';

void main() {
  // 라우터 없이 AppShell 단독 렌더링을 위한 최소 설정
  GoRouter _makeRouter(String initialLocation) {
    return GoRouter(
      initialLocation: initialLocation,
      routes: [
        ShellRoute(
          builder: (_, __, child) => AppShell(child: child),
          routes: [
            GoRoute(path: '/home', builder: (_, __) => const SizedBox()),
            GoRoute(path: '/questions', builder: (_, __) => const SizedBox()),
            GoRoute(path: '/stats', builder: (_, __) => const SizedBox()),
            GoRoute(path: '/settings', builder: (_, __) => const SizedBox()),
          ],
        ),
      ],
    );
  }

  Widget _buildApp(GoRouter router) => ProviderScope(
        child: MaterialApp.router(routerConfig: router),
      );

  testWidgets('바텀 네비 탭이 4개 렌더링된다', (tester) async {
    await tester.pumpWidget(_buildApp(_makeRouter('/home')));
    await tester.pumpAndSettle();

    expect(find.text('홈'), findsOneWidget);
    expect(find.text('문제'), findsOneWidget);
    expect(find.text('통계'), findsOneWidget);
    expect(find.text('설정'), findsOneWidget);
  });

  testWidgets('/questions 경로에서 문제 탭이 선택된다', (tester) async {
    await tester.pumpWidget(_buildApp(_makeRouter('/questions')));
    await tester.pumpAndSettle();

    final nav = tester.widget<BottomNavigationBar>(
      find.byType(BottomNavigationBar),
    );
    // 인덱스 1 = 문제 탭
    expect(nav.currentIndex, equals(1));
  });

  testWidgets('탭 탭하면 해당 경로로 이동한다', (tester) async {
    await tester.pumpWidget(_buildApp(_makeRouter('/home')));
    await tester.pumpAndSettle();

    await tester.tap(find.text('통계'));
    await tester.pumpAndSettle();

    // 통계 탭(인덱스 2)이 선택되었는지 확인
    final nav = tester.widget<BottomNavigationBar>(
      find.byType(BottomNavigationBar),
    );
    expect(nav.currentIndex, equals(2));
  });
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
flutter test test/presentation/widgets/app_shell_test.dart
```
Expected: `AppShell` 클래스 없음으로 컴파일 에러

- [ ] **Step 3: `lib/presentation/widgets/app_shell.dart` 생성**

```dart
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';

/// 바텀 네비게이션 탭 정보
typedef _TabInfo = ({String path, IconData icon, String label});

/// ShellRoute builder에서 사용하는 바텀 네비게이션 쉘.
///
/// 탭 선택 상태는 현재 라우트 경로로 결정한다 — 별도 상태 불필요.
class AppShell extends StatelessWidget {
  final Widget child;

  const AppShell({super.key, required this.child});

  static const List<_TabInfo> _tabs = [
    (path: '/home', icon: FontAwesomeIcons.house, label: '홈'),
    (path: '/questions', icon: FontAwesomeIcons.book, label: '문제'),
    (path: '/stats', icon: FontAwesomeIcons.chartSimple, label: '통계'),
    (path: '/settings', icon: FontAwesomeIcons.gear, label: '설정'),
  ];

  /// 현재 경로에서 탭 인덱스 결정. 매칭 없으면 0(홈) 반환.
  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) => context.go(_tabs[index].path),
        items: _tabs
            .map(
              (tab) => BottomNavigationBarItem(
                icon: FaIcon(tab.icon),
                label: tab.label,
              ),
            )
            .toList(),
      ),
    );
  }
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
flutter test test/presentation/widgets/app_shell_test.dart
```
Expected: `All tests passed.`

- [ ] **Step 5: 커밋**

```bash
git add lib/presentation/widgets/app_shell.dart test/presentation/widgets/app_shell_test.dart
git commit -m "feat: AppShell — 바텀 네비게이션 쉘 구현 #1"
```

---

## Task 6: AppRouter — go_router + ShellRoute 설정

**Files:**
- Create: `lib/router/app_routes.dart`
- Create: `lib/router/app_router.dart`
- Test: `test/router/app_router_test.dart`

- [ ] **Step 1: 테스트 파일 생성 (FAIL)**

`test/router/app_router_test.dart`:
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:passql_app/router/app_routes.dart';

void main() {
  group('AppRoutes 경로 상수', () {
    test('홈 경로가 /home이다', () {
      expect(AppRoutes.home, equals('/home'));
    });
    test('문제 경로가 /questions이다', () {
      expect(AppRoutes.questions, equals('/questions'));
    });
    test('통계 경로가 /stats이다', () {
      expect(AppRoutes.stats, equals('/stats'));
    });
    test('설정 경로가 /settings이다', () {
      expect(AppRoutes.settings, equals('/settings'));
    });
    test('문제 상세 경로 생성', () {
      const uuid = 'abc-123';
      expect(AppRoutes.questionDetail(uuid), equals('/questions/abc-123'));
    });
    test('결과 경로 생성', () {
      const uuid = 'abc-123';
      expect(AppRoutes.questionResult(uuid), equals('/questions/abc-123/result'));
    });
    test('연습 경로 생성', () {
      const sessionId = 'session-1';
      expect(AppRoutes.practice(sessionId), equals('/practice/session-1'));
    });
    test('연습 결과 경로 생성', () {
      const sessionId = 'session-1';
      expect(
        AppRoutes.practiceResult(sessionId),
        equals('/practice/session-1/result'),
      );
    });
  });
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
flutter test test/router/app_router_test.dart
```
Expected: `AppRoutes` 없음으로 컴파일 에러

- [ ] **Step 3: `lib/router/app_routes.dart` 생성**

```dart
/// 앱 내 모든 라우트 경로 상수.
///
/// 문자열 경로를 직접 사용하는 대신 이 클래스를 참조한다 — 오타 방지.
abstract final class AppRoutes {
  // ── 탭 루트 ──────────────────────────────────
  static const String home = '/home';
  static const String questions = '/questions';
  static const String stats = '/stats';
  static const String settings = '/settings';

  // ── 풀스크린 ─────────────────────────────────
  /// 문제 상세 경로. [uuid]는 questionUuid.
  static String questionDetail(String uuid) => '/questions/$uuid';

  /// 결과 화면 경로. [uuid]는 questionUuid.
  static String questionResult(String uuid) => '/questions/$uuid/result';

  /// 연습 모드 경로. [sessionId]는 클라이언트 생성 UUID.
  static String practice(String sessionId) => '/practice/$sessionId';

  /// 연습 결과 경로.
  static String practiceResult(String sessionId) =>
      '/practice/$sessionId/result';
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
flutter test test/router/app_router_test.dart
```
Expected: `All tests passed.`

- [ ] **Step 5: `lib/router/app_router.dart` 생성**

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../presentation/pages/home/home_page.dart';
import '../presentation/pages/questions/topic_list_page.dart';
import '../presentation/pages/questions/question_detail_page.dart';
import '../presentation/pages/result/result_page.dart';
import '../presentation/pages/practice/practice_page.dart';
import '../presentation/pages/practice/practice_result_page.dart';
import '../presentation/pages/stats/stats_page.dart';
import '../presentation/pages/settings/settings_page.dart';
import '../presentation/widgets/app_shell.dart';
import 'app_routes.dart';

// 루트 네비게이터 키 — 풀스크린 라우트(탭 바깥)에서 사용
final _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');

// 쉘 네비게이터 키 — 탭 내 이동에서 사용
final _shellKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

/// 앱 전역 라우터.
///
/// - ShellRoute: 바텀 탭 4개 (홈/문제/통계/설정)
/// - 루트 라우트: 풀스크린 페이지 (문제 상세, 결과, 연습)
abstract final class AppRouter {
  static final GoRouter router = GoRouter(
    navigatorKey: _rootKey,
    initialLocation: AppRoutes.home,
    routes: [
      // ── 탭 쉘 ────────────────────────────────
      ShellRoute(
        navigatorKey: _shellKey,
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: HomePage()),
          ),
          GoRoute(
            path: AppRoutes.questions,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: TopicListPage()),
          ),
          GoRoute(
            path: AppRoutes.stats,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: StatsPage()),
          ),
          GoRoute(
            path: AppRoutes.settings,
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: SettingsPage()),
          ),
        ],
      ),

      // ── 풀스크린: 문제 상세 + 결과 ────────────
      GoRoute(
        path: '/questions/:questionUuid',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => QuestionDetailPage(
          questionUuid: state.pathParameters['questionUuid']!,
        ),
        routes: [
          GoRoute(
            path: 'result',
            parentNavigatorKey: _rootKey,
            builder: (_, state) => ResultPage(extra: state.extra),
          ),
        ],
      ),

      // ── 풀스크린: 연습 모드 + 연습 결과 ────────
      GoRoute(
        path: '/practice/:sessionId',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => PracticePage(
          sessionId: state.pathParameters['sessionId']!,
        ),
        routes: [
          GoRoute(
            path: 'result',
            parentNavigatorKey: _rootKey,
            builder: (_, __) => const PracticeResultPage(),
          ),
        ],
      ),
    ],
  );
}
```

- [ ] **Step 6: 정적 분석 통과 확인**

```bash
flutter analyze lib/router/
```
Expected: `No issues found!`

- [ ] **Step 7: 커밋**

```bash
git add lib/router/ test/router/
git commit -m "feat: AppRouter + AppRoutes — go_router ShellRoute 설정 #1"
```

---

## Task 7: main.dart 업데이트 — 앱 부트스트랩

**Files:**
- Modify: `lib/main.dart`
- Test: `test/widget_test.dart`

- [ ] **Step 1: `test/widget_test.dart` 스모크 테스트 작성 (FAIL)**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:passql_app/router/app_router.dart';
import 'package:passql_app/core/app_theme.dart';

void main() {
  testWidgets('앱이 크래시 없이 시작된다', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: ScreenUtilInit(
          designSize: const Size(375, 812),
          minTextAdapt: true,
          child: MaterialApp.router(
            title: 'passQL',
            theme: AppTheme.light,
            routerConfig: AppRouter.router,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 홈 탭이 보인다
    expect(find.text('홈'), findsOneWidget);
  });
}
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
flutter test test/widget_test.dart
```
Expected: `AppTheme.light` 또는 `AppRouter.router` 없음으로 에러

- [ ] **Step 3: `lib/main.dart` 교체**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/app_theme.dart';
import 'router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // .env 파일 로드 (assets/.env)
  await dotenv.load(fileName: '.env');

  runApp(
    const ProviderScope(
      child: PassqlApp(),
    ),
  );
}

class PassqlApp extends StatelessWidget {
  const PassqlApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      // iPhone 14 기준 디자인 사이즈
      designSize: const Size(390, 844),
      minTextAdapt: true,
      builder: (_, __) => MaterialApp.router(
        title: 'passQL',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
flutter test test/widget_test.dart
```
Expected: `All tests passed.`

- [ ] **Step 5: 앱 직접 실행으로 동작 확인**

```bash
flutter run
```
Expected: 앱 실행 → 바텀 탭 4개 표시 → 탭 전환 정상 동작

- [ ] **Step 6: 전체 테스트 실행**

```bash
flutter test
```
Expected: `All tests passed.`

- [ ] **Step 7: 커밋**

```bash
git add lib/main.dart test/widget_test.dart
git commit -m "feat: main.dart 앱 부트스트랩 — ProviderScope + ScreenUtil + AppRouter #1"
```

---

## Self-Review

### 스펙 커버리지 체크

| 항목 | 태스크 | 커버됨? |
|------|--------|--------|
| Design System 색상 토큰 | Task 1 | ✓ |
| Pretendard + monospace 타이포 | Task 2 | ✓ |
| MaterialApp ThemeData | Task 3 | ✓ |
| 바텀 탭 4개 (홈/문제/통계/설정) | Task 4 + 5 | ✓ |
| 탭 외부 풀스크린 라우트 | Task 6 | ✓ |
| ProviderScope 설정 | Task 7 | ✓ |
| ScreenUtilInit 설정 | Task 7 | ✓ |
| dotenv 로드 | Task 7 | ✓ |
| 플레이스홀더 페이지 | Task 4 | ✓ |

### 플레이스홀더 스캔
- 없음. 모든 구현이 최소하지만 동작 가능한 코드로 채워져 있다.

### 타입 일관성
- `AppRoutes.questionDetail(uuid)` → router에서 `/questions/:questionUuid`로 매칭 ✓
- `AppRoutes.practice(sessionId)` → router에서 `/practice/:sessionId`로 매칭 ✓
- `AppShell._tabs` 경로 `/home`, `/questions`, `/stats`, `/settings` → AppRoutes 상수와 일치 ✓
- `AppTheme.light` → main.dart와 widget_test.dart에서 동일하게 참조 ✓

---

계획이 `docs/superpowers/plans/2026-04-11-phase1-foundation-shell.md`에 저장되었습니다.

**두 가지 실행 방법:**

**1. Subagent-Driven (권장)** — 태스크별 신규 서브에이전트 디스패치, 태스크 간 검토 가능

**2. Inline Execution** — 현재 세션에서 executing-plans 스킬로 일괄 실행, 체크포인트에서 검토

**어떤 방법으로 진행할까요?**
