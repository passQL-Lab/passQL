# Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디바이스 UUID 기반 회원 등록 + 홈 화면 7개 API 병렬 호출 + 홈 UI 컴포넌트 구현

**Architecture:** 
- data layer (Dio + Retrofit + Freezed models) → Riverpod providers → UI widgets
- 앱 시작 시 SharedPreferences에서 memberUuid 확인 → 없으면 POST /members/register → 저장
- 홈 화면 진입 시 6개 API 병렬 호출 (greeting, progress, today, recommendations, exam, heatmap)

**Tech Stack:** Flutter 3.x, Riverpod 2.x, Dio 5.x, Retrofit 4.x, Freezed 2.x, SharedPreferences, device_info_plus

---

## File Map

**New Files:**
- `lib/core/network/dio_client.dart` — Dio Provider (baseUrl, timeout)
- `lib/data/models/member/member_register_response.dart` — POST /members/register 응답
- `lib/data/models/member/member_me_response.dart` — GET /members/me 응답
- `lib/data/models/home/question_summary.dart` — 오늘의 문제/추천 문제 공용 모델
- `lib/data/models/home/greeting_response.dart` — GET /home/greeting 응답
- `lib/data/models/home/today_question_response.dart` — GET /questions/today 응답
- `lib/data/models/home/recommendations_response.dart` — GET /questions/recommendations 응답
- `lib/data/models/progress/readiness_response.dart` — 합격 준비도 중첩 모델
- `lib/data/models/progress/progress_response.dart` — GET /progress 응답
- `lib/data/models/progress/heatmap_response.dart` — GET /progress/heatmap 응답
- `lib/data/models/exam/exam_schedule_response.dart` — GET /exam-schedules/selected 응답
- `lib/data/sources/member_api.dart` — Retrofit MemberApiClient
- `lib/data/sources/home_api.dart` — Retrofit HomeApiClient
- `lib/data/sources/question_api.dart` — Retrofit QuestionApiClient
- `lib/data/sources/progress_api.dart` — Retrofit ProgressApiClient
- `lib/data/sources/exam_schedule_api.dart` — Retrofit ExamScheduleApiClient
- `lib/presentation/providers/member_store.dart` — UUID 영속성 + 등록 로직
- `lib/presentation/providers/home_providers.dart` — 홈 화면 데이터 FutureProvider
- `lib/presentation/widgets/home/greeting_section.dart` — 인사 섹션 위젯
- `lib/presentation/widgets/home/today_question_card.dart` — 오늘의 문제 카드
- `lib/presentation/widgets/home/exam_schedule_card.dart` — 시험 일정 카드
- `lib/presentation/widgets/home/readiness_card.dart` — 합격 준비도 카드
- `lib/presentation/widgets/home/fallback_stats_section.dart` — readiness 없을 때 통계 카드
- `lib/presentation/widgets/home/heatmap_widget.dart` — 히트맵 위젯
- `lib/presentation/widgets/home/recommendations_section.dart` — 추천 문제 리스트

**Modified Files:**
- `lib/main.dart` — ConsumerWidget으로 변경 + 앱 시작 시 UUID 등록
- `lib/presentation/pages/home/home_page.dart` — 실제 홈 화면 구현

---

## Task 1: Dio HTTP Client Provider

**Files:**
- Create: `lib/core/network/dio_client.dart`

- [ ] **Step 1: Dio Provider 생성**

```dart
// lib/core/network/dio_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 앱 전역 Dio 인스턴스 Provider.
/// 
/// baseUrl은 .env의 BACKEND_BASE_URL에서 읽음.
/// 타임아웃 25초, JSON Content-Type 기본 설정.
final dioProvider = Provider<Dio>((ref) {
  final baseUrl = dotenv.env['BACKEND_BASE_URL'] ?? '';
  return Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 25),
      receiveTimeout: const Duration(seconds: 25),
      headers: {'Content-Type': 'application/json'},
    ),
  );
});
```

- [ ] **Step 2: 디렉토리 구조 확인**

```bash
mkdir -p lib/core/network lib/data/models/member lib/data/models/home lib/data/models/progress lib/data/models/exam lib/data/sources lib/presentation/providers lib/presentation/widgets/home
```

---

## Task 2: Freezed 데이터 모델 생성

**Files:**
- Create: `lib/data/models/member/member_register_response.dart`
- Create: `lib/data/models/member/member_me_response.dart`
- Create: `lib/data/models/home/question_summary.dart`
- Create: `lib/data/models/home/greeting_response.dart`
- Create: `lib/data/models/home/today_question_response.dart`
- Create: `lib/data/models/home/recommendations_response.dart`
- Create: `lib/data/models/progress/readiness_response.dart`
- Create: `lib/data/models/progress/progress_response.dart`
- Create: `lib/data/models/progress/heatmap_response.dart`
- Create: `lib/data/models/exam/exam_schedule_response.dart`

- [ ] **Step 1: MemberRegisterResponse**

```dart
// lib/data/models/member/member_register_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_register_response.freezed.dart';
part 'member_register_response.g.dart';

/// POST /members/register 응답.
/// 최초 실행 시 서버가 발급하는 UUID와 닉네임.
@freezed
class MemberRegisterResponse with _$MemberRegisterResponse {
  const factory MemberRegisterResponse({
    required String memberUuid,
    required String nickname,
  }) = _MemberRegisterResponse;

  factory MemberRegisterResponse.fromJson(Map<String, dynamic> json) =>
      _$MemberRegisterResponseFromJson(json);
}
```

- [ ] **Step 2: MemberMeResponse**

```dart
// lib/data/models/member/member_me_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'member_me_response.freezed.dart';
part 'member_me_response.g.dart';

/// GET /members/me 응답.
@freezed
class MemberMeResponse with _$MemberMeResponse {
  const factory MemberMeResponse({
    required String memberUuid,
    required String nickname,
  }) = _MemberMeResponse;

  factory MemberMeResponse.fromJson(Map<String, dynamic> json) =>
      _$MemberMeResponseFromJson(json);
}
```

- [ ] **Step 3: QuestionSummary (공용 모델)**

```dart
// lib/data/models/home/question_summary.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'question_summary.freezed.dart';
part 'question_summary.g.dart';

/// 오늘의 문제/추천 문제 카드에서 사용하는 축약 문제 모델.
/// difficulty: 1(쉬움), 2(보통), 3(어려움)
@freezed
class QuestionSummary with _$QuestionSummary {
  const factory QuestionSummary({
    required String questionUuid,
    String? topicName,
    String? stemPreview,
    int? difficulty,
    String? executionMode,
  }) = _QuestionSummary;

  factory QuestionSummary.fromJson(Map<String, dynamic> json) =>
      _$QuestionSummaryFromJson(json);
}
```

- [ ] **Step 4: GreetingResponse**

```dart
// lib/data/models/home/greeting_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'greeting_response.freezed.dart';
part 'greeting_response.g.dart';

/// GET /home/greeting 응답.
/// message에 {nickname} 플레이스홀더 포함 — 프론트에서 치환.
/// messageType: GENERAL | COUNTDOWN | URGENT | EXAM_DAY
@freezed
class GreetingResponse with _$GreetingResponse {
  const factory GreetingResponse({
    required String nickname,
    required String message,
    required String messageType,
  }) = _GreetingResponse;

  factory GreetingResponse.fromJson(Map<String, dynamic> json) =>
      _$GreetingResponseFromJson(json);
}
```

- [ ] **Step 5: TodayQuestionResponse**

```dart
// lib/data/models/home/today_question_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'question_summary.dart';

part 'today_question_response.freezed.dart';
part 'today_question_response.g.dart';

/// GET /questions/today 응답.
/// question이 null이면 오늘의 문제 없음.
@freezed
class TodayQuestionResponse with _$TodayQuestionResponse {
  const factory TodayQuestionResponse({
    QuestionSummary? question,
    @Default(false) bool alreadySolvedToday,
  }) = _TodayQuestionResponse;

  factory TodayQuestionResponse.fromJson(Map<String, dynamic> json) =>
      _$TodayQuestionResponseFromJson(json);
}
```

- [ ] **Step 6: RecommendationsResponse**

```dart
// lib/data/models/home/recommendations_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'question_summary.dart';

part 'recommendations_response.freezed.dart';
part 'recommendations_response.g.dart';

/// GET /questions/recommendations 응답.
@freezed
class RecommendationsResponse with _$RecommendationsResponse {
  const factory RecommendationsResponse({
    @Default([]) List<QuestionSummary> questions,
  }) = _RecommendationsResponse;

  factory RecommendationsResponse.fromJson(Map<String, dynamic> json) =>
      _$RecommendationsResponseFromJson(json);
}
```

- [ ] **Step 7: ReadinessResponse (중첩 모델)**

```dart
// lib/data/models/progress/readiness_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'readiness_response.freezed.dart';
part 'readiness_response.g.dart';

/// 합격 준비도 블록.
/// score = accuracy × coverage × recency (0.0~1.0)
/// toneKey: NO_EXAM | ONBOARDING | POST_EXAM | TODAY | SPRINT | PUSH | STEADY | EARLY
@freezed
class ReadinessResponse with _$ReadinessResponse {
  const factory ReadinessResponse({
    required double score,
    required double accuracy,
    required double coverage,
    required double recency,
    String? lastStudiedAt,
    required int recentAttemptCount,
    required int coveredTopicCount,
    required int activeTopicCount,
    int? daysUntilExam,
    required String toneKey,
  }) = _ReadinessResponse;

  factory ReadinessResponse.fromJson(Map<String, dynamic> json) =>
      _$ReadinessResponseFromJson(json);
}
```

- [ ] **Step 8: ProgressResponse**

```dart
// lib/data/models/progress/progress_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'readiness_response.dart';

part 'progress_response.freezed.dart';
part 'progress_response.g.dart';

/// GET /progress 응답.
/// correctRate: 0.0~1.0 (마지막 시도 기준, 소수점 둘째 자리 반올림)
/// streakDays: 연속 학습 일수 (하루 그레이스 적용)
@freezed
class ProgressResponse with _$ProgressResponse {
  const factory ProgressResponse({
    required int solvedCount,
    required double correctRate,
    required int streakDays,
    ReadinessResponse? readiness,
  }) = _ProgressResponse;

  factory ProgressResponse.fromJson(Map<String, dynamic> json) =>
      _$ProgressResponseFromJson(json);
}
```

- [ ] **Step 9: HeatmapResponse**

```dart
// lib/data/models/progress/heatmap_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'heatmap_response.freezed.dart';
part 'heatmap_response.g.dart';

/// 히트맵 단일 날짜 엔트리.
/// 제출 이력 없는 날짜는 entries 배열에서 생략됨 (sparse array).
@freezed
class HeatmapEntry with _$HeatmapEntry {
  const factory HeatmapEntry({
    required String date,       // YYYY-MM-DD
    required int solvedCount,
    required int correctCount,
  }) = _HeatmapEntry;

  factory HeatmapEntry.fromJson(Map<String, dynamic> json) =>
      _$HeatmapEntryFromJson(json);
}

/// GET /progress/heatmap 응답.
@freezed
class HeatmapResponse with _$HeatmapResponse {
  const factory HeatmapResponse({
    @Default([]) List<HeatmapEntry> entries,
  }) = _HeatmapResponse;

  factory HeatmapResponse.fromJson(Map<String, dynamic> json) =>
      _$HeatmapResponseFromJson(json);
}
```

- [ ] **Step 10: ExamScheduleResponse**

```dart
// lib/data/models/exam/exam_schedule_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'exam_schedule_response.freezed.dart';
part 'exam_schedule_response.g.dart';

/// GET /exam-schedules/selected 응답.
/// 선택된 시험 없으면 서버가 200 + null body 반환.
@freezed
class ExamScheduleResponse with _$ExamScheduleResponse {
  const factory ExamScheduleResponse({
    required String examScheduleUuid,
    required String certType,     // SQLD | SQLP
    required int round,
    required String examDate,     // YYYY-MM-DD
    required bool isSelected,
  }) = _ExamScheduleResponse;

  factory ExamScheduleResponse.fromJson(Map<String, dynamic> json) =>
      _$ExamScheduleResponseFromJson(json);
}
```

---

## Task 3: Retrofit API 클라이언트 인터페이스

**Files:**
- Create: `lib/data/sources/member_api.dart`
- Create: `lib/data/sources/home_api.dart`
- Create: `lib/data/sources/question_api.dart`
- Create: `lib/data/sources/progress_api.dart`
- Create: `lib/data/sources/exam_schedule_api.dart`

- [ ] **Step 1: MemberApiClient**

```dart
// lib/data/sources/member_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/member/member_register_response.dart';
import '../models/member/member_me_response.dart';

part 'member_api.g.dart';

@RestApi()
abstract class MemberApiClient {
  factory MemberApiClient(Dio dio, {String baseUrl}) = _MemberApiClient;

  /// 최초 실행 시 UUID 발급. 요청 body 없음.
  @POST('/members/register')
  Future<MemberRegisterResponse> register();

  /// 닉네임 조회 — 홈/설정 화면에서 사용.
  @GET('/members/me')
  Future<MemberMeResponse> getMe(@Query('memberUuid') String memberUuid);
}
```

- [ ] **Step 2: HomeApiClient**

```dart
// lib/data/sources/home_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/home/greeting_response.dart';

part 'home_api.g.dart';

@RestApi()
abstract class HomeApiClient {
  factory HomeApiClient(Dio dio, {String baseUrl}) = _HomeApiClient;

  /// 홈 화면 인사 메시지. message에 {nickname} 플레이스홀더 포함.
  @GET('/home/greeting')
  Future<GreetingResponse> getGreeting(@Query('memberUuid') String memberUuid);
}
```

- [ ] **Step 3: QuestionApiClient**

```dart
// lib/data/sources/question_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/home/today_question_response.dart';
import '../models/home/recommendations_response.dart';

part 'question_api.g.dart';

@RestApi()
abstract class QuestionApiClient {
  factory QuestionApiClient(Dio dio, {String baseUrl}) = _QuestionApiClient;

  /// 오늘의 데일리 챌린지 문제.
  /// memberUuid 제공 시 alreadySolvedToday 필드 포함.
  @GET('/questions/today')
  Future<TodayQuestionResponse> getTodayQuestion(
    @Query('memberUuid') String? memberUuid,
  );

  /// 랜덤 추천 문제 N개. size 기본 3, 최대 5.
  @GET('/questions/recommendations')
  Future<RecommendationsResponse> getRecommendations({
    @Query('size') int? size,
    @Query('excludeQuestionUuid') String? excludeQuestionUuid,
  });
}
```

- [ ] **Step 4: ProgressApiClient**

```dart
// lib/data/sources/progress_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/progress/progress_response.dart';
import '../models/progress/heatmap_response.dart';

part 'progress_api.g.dart';

@RestApi()
abstract class ProgressApiClient {
  factory ProgressApiClient(Dio dio, {String baseUrl}) = _ProgressApiClient;

  /// 전체 학습 현황 (solvedCount, correctRate, streakDays, readiness).
  @GET('/progress')
  Future<ProgressResponse> getProgress(@Query('memberUuid') String memberUuid);

  /// 날짜별 학습 히트맵. from/to 미지정 시 최근 30일.
  @GET('/progress/heatmap')
  Future<HeatmapResponse> getHeatmap(
    @Query('memberUuid') String memberUuid, {
    @Query('from') String? from,
    @Query('to') String? to,
  });
}
```

- [ ] **Step 5: ExamScheduleApiClient**

```dart
// lib/data/sources/exam_schedule_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/exam/exam_schedule_response.dart';

part 'exam_schedule_api.g.dart';

@RestApi()
abstract class ExamScheduleApiClient {
  factory ExamScheduleApiClient(Dio dio, {String baseUrl}) = _ExamScheduleApiClient;

  /// 선택된 시험 일정. 선택된 일정 없으면 200 + null body.
  @GET('/exam-schedules/selected')
  Future<ExamScheduleResponse?> getSelectedSchedule();
}
```

---

## Task 4: 코드 생성 실행

- [ ] **Step 1: build_runner 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

예상 출력: `[INFO] Build succeeded!` — 각 모델의 `.freezed.dart`, `.g.dart` 파일 생성 확인

- [ ] **Step 2: 생성 파일 확인**

```bash
ls lib/data/models/member/
ls lib/data/models/home/
ls lib/data/models/progress/
ls lib/data/models/exam/
ls lib/data/sources/
```

각 디렉토리에 `.freezed.dart`, `.g.dart` 파일이 있어야 함.

- [ ] **Step 3: flutter analyze 실행**

```bash
flutter analyze lib/data/
```

에러 없음 확인.

---

## Task 5: Member Store — UUID 영속성 + 등록 로직

**Files:**
- Create: `lib/presentation/providers/member_store.dart`

- [ ] **Step 1: MemberStore AsyncNotifier 구현**

```dart
// lib/presentation/providers/member_store.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/network/dio_client.dart';
import '../../data/sources/member_api.dart';

/// 회원 UUID를 SharedPreferences에 저장·관리하는 AsyncNotifier.
/// 
/// 앱 시작 시 저장된 UUID를 읽음.
/// UUID 없으면 /members/register 호출 후 저장.
class MemberStore extends AsyncNotifier<String?> {
  static const _kMemberUuid = 'member_uuid';
  static const _kNickname = 'member_nickname';

  @override
  Future<String?> build() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kMemberUuid);
  }

  /// UUID 반환. 없으면 서버 등록 후 반환.
  Future<String> getOrRegister() async {
    final existing = await future;
    if (existing != null) return existing;
    return _register();
  }

  Future<String> _register() async {
    final dio = ref.read(dioProvider);
    final client = MemberApiClient(dio);
    final response = await client.register();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kMemberUuid, response.memberUuid);
    await prefs.setString(_kNickname, response.nickname);

    state = AsyncData(response.memberUuid);
    return response.memberUuid;
  }

  /// 캐시된 닉네임 조회 (로컬 저장값).
  Future<String?> getCachedNickname() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kNickname);
  }
}

final memberStoreProvider = AsyncNotifierProvider<MemberStore, String?>(
  MemberStore.new,
);
```

---

## Task 6: main.dart 수정 — 앱 시작 시 UUID 등록

**Files:**
- Modify: `lib/main.dart`

- [ ] **Step 1: main.dart를 ConsumerStatefulWidget으로 변경**

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import 'core/app_theme.dart';
import 'presentation/providers/member_store.dart';
import 'router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');

  // 앱 시작 전 ProviderContainer로 UUID 등록 완료
  final container = ProviderContainer();
  await container.read(memberStoreProvider.notifier).getOrRegister();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const PassqlApp(),
    ),
  );
}

class PassqlApp extends StatelessWidget {
  const PassqlApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      // iPhone 15 기준 디자인 사이즈
      designSize: const Size(390, 844),
      minTextAdapt: true,
      builder: (_, _) => MaterialApp.router(
        title: 'passQL',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
```

---

## Task 7: Home Screen Providers

**Files:**
- Create: `lib/presentation/providers/home_providers.dart`

- [ ] **Step 1: HomeData 집계 모델 + FutureProvider 구현**

```dart
// lib/presentation/providers/home_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/home/greeting_response.dart';
import '../../data/models/home/recommendations_response.dart';
import '../../data/models/home/today_question_response.dart';
import '../../data/models/progress/heatmap_response.dart';
import '../../data/models/progress/progress_response.dart';
import '../../data/models/exam/exam_schedule_response.dart';
import '../../data/sources/exam_schedule_api.dart';
import '../../data/sources/home_api.dart';
import '../../data/sources/progress_api.dart';
import '../../data/sources/question_api.dart';
import 'member_store.dart';

/// 홈 화면에 필요한 모든 API 응답을 담는 집계 모델.
/// 각 필드는 nullable — API 실패 시 해당 섹션을 graceful하게 숨김 처리.
class HomeData {
  final GreetingResponse? greeting;
  final ProgressResponse? progress;
  final TodayQuestionResponse? todayQuestion;
  final RecommendationsResponse? recommendations;
  final ExamScheduleResponse? examSchedule;
  final HeatmapResponse? heatmap;

  const HomeData({
    this.greeting,
    this.progress,
    this.todayQuestion,
    this.recommendations,
    this.examSchedule,
    this.heatmap,
  });
}

/// API 호출 실패를 null로 처리하는 헬퍼.
Future<T?> _safe<T>(Future<T> call) async {
  try {
    return await call;
  } catch (_) {
    return null;
  }
}

/// 홈 화면 데이터 Provider.
/// 
/// memberStoreProvider에서 UUID를 읽어 6개 API를 병렬 호출.
/// 개별 API 실패는 null로 처리 — 전체 화면 에러 방지.
final homeDataProvider = FutureProvider<HomeData>((ref) async {
  final memberUuid = await ref.watch(memberStoreProvider.notifier).getOrRegister();

  final dio = ref.read(dioProvider);
  final homeClient = HomeApiClient(dio);
  final progressClient = ProgressApiClient(dio);
  final questionClient = QuestionApiClient(dio);
  final examClient = ExamScheduleApiClient(dio);

  // 6개 API 병렬 호출
  final results = await Future.wait([
    _safe(homeClient.getGreeting(memberUuid)),
    _safe(progressClient.getProgress(memberUuid)),
    _safe(questionClient.getTodayQuestion(memberUuid)),
    _safe(questionClient.getRecommendations(size: 3)),
    _safe(examClient.getSelectedSchedule()),
    _safe(progressClient.getHeatmap(memberUuid)),
  ]);

  return HomeData(
    greeting: results[0] as GreetingResponse?,
    progress: results[1] as ProgressResponse?,
    todayQuestion: results[2] as TodayQuestionResponse?,
    recommendations: results[3] as RecommendationsResponse?,
    examSchedule: results[4] as ExamScheduleResponse?,
    heatmap: results[5] as HeatmapResponse?,
  );
});
```

---

## Task 8: 인사 섹션 위젯 (GreetingSection)

**Files:**
- Create: `lib/presentation/widgets/home/greeting_section.dart`

- [ ] **Step 1: GreetingSection 구현**

```dart
// lib/presentation/widgets/home/greeting_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/greeting_response.dart';

/// 홈 화면 상단 인사 섹션.
/// 
/// greeting.message의 {nickname}을 실제 닉네임으로 치환.
/// messageType에 따라 서브 텍스트 배지 표시.
class GreetingSection extends StatelessWidget {
  final GreetingResponse greeting;

  const GreetingSection({super.key, required this.greeting});

  /// messageType별 서브 텍스트. null이면 배지 숨김.
  String? get _subText {
    switch (greeting.messageType) {
      case 'EXAM_DAY':
        return '오늘 시험이에요!';
      case 'URGENT':
        return '시험이 얼마 남지 않았어요';
      case 'COUNTDOWN':
        return '시험까지 카운트다운 중이에요';
      default:
        return null;
    }
  }

  /// {nickname} 플레이스홀더를 실제 닉네임으로 치환.
  String get _resolvedMessage =>
      greeting.message.replaceAll('{nickname}', greeting.nickname);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _resolvedMessage,
          style: AppTextStyles.heading_24.copyWith(
            color: AppColors.textPrimary,
            height: 1.4,
          ),
        ),
        if (_subText != null) ...[
          SizedBox(height: 8.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
            decoration: BoxDecoration(
              color: greeting.messageType == 'EXAM_DAY'
                  ? AppColors.errorLight
                  : AppColors.warningLight,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              _subText!,
              style: AppTextStyles.tag12Semibold.copyWith(
                color: greeting.messageType == 'EXAM_DAY'
                    ? AppColors.errorText
                    : AppColors.warningText,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
```

---

## Task 9: 2열 카드 그리드 (오늘의 문제 + 시험 일정)

**Files:**
- Create: `lib/presentation/widgets/home/today_question_card.dart`
- Create: `lib/presentation/widgets/home/exam_schedule_card.dart`

- [ ] **Step 1: TodayQuestionCard**

```dart
// lib/presentation/widgets/home/today_question_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/today_question_response.dart';

/// 홈 화면 오늘의 문제 카드.
/// 
/// question이 null이면 "문제 풀기" 링크 카드 표시.
/// alreadySolvedToday=true이면 "(완료)" 배지 표시.
class TodayQuestionCard extends StatelessWidget {
  final TodayQuestionResponse? todayQuestion;
  final VoidCallback? onTap;

  const TodayQuestionCard({
    super.key,
    this.todayQuestion,
    this.onTap,
  });

  /// difficulty 숫자 → 별 문자열.
  String _difficultyStars(int? difficulty) {
    switch (difficulty) {
      case 1:
        return '★☆☆';
      case 2:
        return '★★☆';
      case 3:
        return '★★★';
      default:
        return '★☆☆';
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = todayQuestion?.question;
    final isSolved = todayQuestion?.alreadySolvedToday ?? false;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.r),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 카드 헤더
            Row(
              children: [
                FaIcon(
                  FontAwesomeIcons.fire,
                  size: 14.sp,
                  color: AppColors.warning,
                ),
                SizedBox(width: 6.w),
                Text(
                  '오늘의 문제',
                  style: AppTextStyles.tag12Semibold.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (isSolved) ...[
                  const Spacer(),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: AppColors.successLight,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '완료',
                      style: AppTextStyles.tag10Bold.copyWith(
                        color: AppColors.successText,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            SizedBox(height: 12.h),

            if (question != null) ...[
              // 토픽 배지
              if (question.topicName != null)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                  decoration: BoxDecoration(
                    color: AppColors.accentLight,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    question.topicName!,
                    style: AppTextStyles.tag_10.copyWith(
                      color: AppColors.brandIndigo,
                    ),
                  ),
                ),
              SizedBox(height: 8.h),
              // 문제 미리보기
              Text(
                question.stemPreview ?? '',
                style: AppTextStyles.paragraph_14.copyWith(
                  color: AppColors.textPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: 8.h),
              // 난이도
              Text(
                _difficultyStars(question.difficulty),
                style: AppTextStyles.tag_12.copyWith(
                  color: AppColors.warning,
                  letterSpacing: 2,
                ),
              ),
            ] else ...[
              // 문제 없을 때
              Text(
                '오늘의 문제가 없어요.\n문제 목록에서 풀어보세요.',
                style: AppTextStyles.paragraph_14.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                '문제 풀기 →',
                style: AppTextStyles.tag12Semibold.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: ExamScheduleCard**

```dart
// lib/presentation/widgets/home/exam_schedule_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/exam/exam_schedule_response.dart';

/// 홈 화면 시험 일정 카드.
/// 
/// schedule이 null이면 "선택된 일정 없음" 표시.
class ExamScheduleCard extends StatelessWidget {
  final ExamScheduleResponse? schedule;
  final VoidCallback? onTap;

  const ExamScheduleCard({
    super.key,
    this.schedule,
    this.onTap,
  });

  /// examDate(YYYY-MM-DD) → D-day 계산.
  String _dday(String examDate) {
    try {
      final exam = DateTime.parse(examDate);
      final today = DateTime.now();
      final diff = exam.difference(DateTime(today.year, today.month, today.day)).inDays;
      if (diff == 0) return 'D-Day';
      if (diff > 0) return 'D-$diff';
      return 'D+${diff.abs()}';
    } catch (_) {
      return '';
    }
  }

  /// YYYY-MM-DD → 읽기 좋은 형식 (예: 2026년 6월 21일)
  String _formatDate(String examDate) {
    try {
      final parts = examDate.split('-');
      return '${parts[0]}년 ${parts[1]}월 ${parts[2]}일';
    } catch (_) {
      return examDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.r),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 카드 헤더
            Row(
              children: [
                FaIcon(
                  FontAwesomeIcons.calendarDays,
                  size: 14.sp,
                  color: AppColors.brandIndigo,
                ),
                SizedBox(width: 6.w),
                Text(
                  '시험 일정',
                  style: AppTextStyles.tag12Semibold.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            if (schedule != null) ...[
              // D-day 배지
              Text(
                _dday(schedule!.examDate),
                style: AppTextStyles.semibold_28.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                '${schedule!.certType} ${schedule!.round}회',
                style: AppTextStyles.paragraph14Semibold.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                _formatDate(schedule!.examDate),
                style: AppTextStyles.tag_12.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ] else ...[
              Text(
                '선택된 일정 없음',
                style: AppTextStyles.paragraph_14.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                '일정 선택하기 →',
                style: AppTextStyles.tag12Semibold.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## Task 10: 합격 준비도 카드 + Fallback 통계 카드

**Files:**
- Create: `lib/presentation/widgets/home/readiness_card.dart`
- Create: `lib/presentation/widgets/home/fallback_stats_section.dart`

- [ ] **Step 1: ReadinessCard**

```dart
// lib/presentation/widgets/home/readiness_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/readiness_response.dart';

/// toneKey → 한국어 코멘트 텍스트 매핑.
const Map<String, String> _toneMessages = {
  'NO_EXAM': '시험 일정을 선택하고\n맞춤 학습을 시작해보세요.',
  'ONBOARDING': '오늘부터 SQL 학습을 시작해볼까요?\n꾸준히 하면 합격할 수 있어요!',
  'POST_EXAM': '수고하셨어요!\n다음 시험 준비를 시작해볼까요?',
  'TODAY': '오늘이 시험 당일이에요!\n지금까지 공부한 것을 믿어요.',
  'SPRINT': '시험이 코앞이에요!\n마지막까지 집중해요.',
  'PUSH': '시험이 다가오고 있어요.\n조금씩 더 달려볼까요?',
  'STEADY': '꾸준한 학습이\n합격의 지름길이에요.',
  'EARLY': '충분한 시간이 있어요.\n기초부터 탄탄하게 쌓아요!',
};

/// 합격 준비도 카드.
/// 
/// score 게이지 바 + toneKey 코멘트 + 세부 지표(accuracy/coverage/recency).
class ReadinessCard extends StatelessWidget {
  final ReadinessResponse readiness;

  const ReadinessCard({super.key, required this.readiness});

  @override
  Widget build(BuildContext context) {
    final scorePercent = (readiness.score * 100).round();
    final message = _toneMessages[readiness.toneKey] ?? '';

    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border.all(color: AppColors.borderDefault),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더
          Text(
            '합격 준비도',
            style: AppTextStyles.tag12Semibold.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 12.h),

          // 점수 + 게이지
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$scorePercent',
                style: AppTextStyles.semibold_44.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
              Padding(
                padding: EdgeInsets.only(bottom: 8.h, left: 2.w),
                child: Text(
                  '%',
                  style: AppTextStyles.heading_20.copyWith(
                    color: AppColors.brandIndigo,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(4.r),
            child: LinearProgressIndicator(
              value: readiness.score.clamp(0.0, 1.0),
              backgroundColor: AppColors.accentLight,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brandIndigo),
              minHeight: 8.h,
            ),
          ),
          SizedBox(height: 12.h),

          // toneKey 코멘트
          if (message.isNotEmpty)
            Text(
              message,
              style: AppTextStyles.paragraph_14.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          SizedBox(height: 16.h),

          // 세부 지표 3개
          Row(
            children: [
              _MetricChip(
                label: '정확도',
                value: '${(readiness.accuracy * 100).round()}%',
              ),
              SizedBox(width: 8.w),
              _MetricChip(
                label: '범위',
                value: '${readiness.coveredTopicCount}/${readiness.activeTopicCount}',
              ),
              SizedBox(width: 8.w),
              _MetricChip(
                label: '최신성',
                value: '${(readiness.recency * 100).round()}%',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 세부 지표 칩 위젯.
class _MetricChip extends StatelessWidget {
  final String label;
  final String value;

  const _MetricChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 8.h),
        decoration: BoxDecoration(
          color: AppColors.pageBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: AppTextStyles.paragraph14Semibold.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            SizedBox(height: 2.h),
            Text(
              label,
              style: AppTextStyles.tag_10.copyWith(
                color: AppColors.textCaption,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: FallbackStatsSection (readiness 없을 때)**

```dart
// lib/presentation/widgets/home/fallback_stats_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// readiness 없을 때 표시하는 통계 2열 카드.
/// 
/// 왼쪽: 푼 문제 수 / 오른쪽: 정답률 게이지 바.
class FallbackStatsSection extends StatelessWidget {
  final int solvedCount;
  final double correctRate; // 0.0~1.0

  const FallbackStatsSection({
    super.key,
    required this.solvedCount,
    required this.correctRate,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // 푼 문제 수 카드
        Expanded(
          child: Container(
            padding: EdgeInsets.all(16.r),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              border: Border.all(color: AppColors.borderDefault),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '푼 문제',
                  style: AppTextStyles.tag12Semibold.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                SizedBox(height: 8.h),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: '$solvedCount',
                        style: AppTextStyles.semibold_28.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextSpan(
                        text: ' 개',
                        style: AppTextStyles.paragraph_14.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(width: 12.w),
        // 정답률 카드
        Expanded(
          child: Container(
            padding: EdgeInsets.all(16.r),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              border: Border.all(color: AppColors.borderDefault),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '정답률',
                  style: AppTextStyles.tag12Semibold.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                SizedBox(height: 8.h),
                RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: '${(correctRate * 100).round()}',
                        style: AppTextStyles.semibold_28.copyWith(
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextSpan(
                        text: ' %',
                        style: AppTextStyles.paragraph_14.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 6.h),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4.r),
                  child: LinearProgressIndicator(
                    value: correctRate.clamp(0.0, 1.0),
                    backgroundColor: AppColors.accentLight,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.brandIndigo,
                    ),
                    minHeight: 6.h,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
```

---

## Task 11: 히트맵 위젯

**Files:**
- Create: `lib/presentation/widgets/home/heatmap_widget.dart`

- [ ] **Step 1: HeatmapWidget — 5주 그리드 구현**

```dart
// lib/presentation/widgets/home/heatmap_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/heatmap_response.dart';

/// 최근 35일(5주) 학습 히트맵.
/// 
/// 7열(일~토) × 5행(주) 그리드.
/// solvedCount 기준으로 5단계 색상 적용.
class HeatmapWidget extends StatelessWidget {
  final HeatmapResponse? heatmap;
  final int streakDays;

  const HeatmapWidget({
    super.key,
    this.heatmap,
    this.streakDays = 0,
  });

  /// 날짜 문자열(YYYY-MM-DD) 키로 빠른 조회를 위한 Map 생성.
  Map<String, HeatmapEntry> _buildEntryMap() {
    final entries = heatmap?.entries ?? [];
    return {for (final e in entries) e.date: e};
  }

  /// solvedCount → 히트맵 색상 (5단계).
  Color _colorForCount(int count) {
    if (count == 0) return AppColors.heatmap0;
    if (count <= 1) return AppColors.heatmap1;
    if (count <= 3) return AppColors.heatmap2;
    if (count <= 6) return AppColors.heatmap3;
    return AppColors.heatmap4;
  }

  /// 오늘 기준 35일 전부터 날짜 리스트 생성.
  List<DateTime> _buildDays() {
    final today = DateTime.now();
    final start = today.subtract(const Duration(days: 34));
    return List.generate(35, (i) => start.add(Duration(days: i)));
  }

  String _toDateKey(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final entryMap = _buildEntryMap();
    final days = _buildDays();
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border.all(color: AppColors.borderDefault),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더: 학습 현황 + 스트릭 배지
          Row(
            children: [
              Text(
                '학습 현황',
                style: AppTextStyles.tag12Semibold.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              if (streakDays > 0) ...[
                const Spacer(),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        size: 12.sp,
                        color: AppColors.warningText,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        '$streakDays일 연속',
                        style: AppTextStyles.tag12Semibold.copyWith(
                          color: AppColors.warningText,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          SizedBox(height: 12.h),

          // 요일 레이블
          Row(
            children: weekLabels.map((label) {
              return Expanded(
                child: Center(
                  child: Text(
                    label,
                    style: AppTextStyles.tag_10.copyWith(
                      color: AppColors.textCaption,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          SizedBox(height: 4.h),

          // 5주 × 7일 그리드
          ...List.generate(5, (week) {
            return Padding(
              padding: EdgeInsets.only(bottom: 4.h),
              child: Row(
                children: List.generate(7, (dayOfWeek) {
                  final idx = week * 7 + dayOfWeek;
                  final date = days[idx];
                  final key = _toDateKey(date);
                  final entry = entryMap[key];
                  final count = entry?.solvedCount ?? 0;

                  return Expanded(
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: Container(
                        margin: EdgeInsets.all(2.r),
                        decoration: BoxDecoration(
                          color: _colorForCount(count),
                          borderRadius: BorderRadius.circular(3.r),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            );
          }),
        ],
      ),
    );
  }
}
```

---

## Task 12: 추천 문제 리스트

**Files:**
- Create: `lib/presentation/widgets/home/recommendations_section.dart`

- [ ] **Step 1: RecommendationsSection 구현**

```dart
// lib/presentation/widgets/home/recommendations_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/question_summary.dart';

/// 홈 화면 추천 문제 리스트.
/// 
/// 최대 3개 문제를 카드 형태로 표시.
/// 각 카드: topicName 배지 + stemPreview + difficulty 별.
class RecommendationsSection extends StatelessWidget {
  final List<QuestionSummary> questions;
  final void Function(String questionUuid)? onQuestionTap;

  const RecommendationsSection({
    super.key,
    required this.questions,
    this.onQuestionTap,
  });

  String _difficultyStars(int? difficulty) {
    switch (difficulty) {
      case 1:
        return '★☆☆';
      case 2:
        return '★★☆';
      case 3:
        return '★★★';
      default:
        return '★☆☆';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (questions.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 섹션 헤더
        Row(
          children: [
            FaIcon(
              FontAwesomeIcons.lightbulb,
              size: 14.sp,
              color: AppColors.brandIndigo,
            ),
            SizedBox(width: 8.w),
            Text(
              '추천 문제',
              style: AppTextStyles.subHeading_18.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        SizedBox(height: 12.h),

        // 문제 카드 리스트
        ...questions.map((q) => _QuestionCard(
              question: q,
              difficultyStars: _difficultyStars(q.difficulty),
              onTap: () => onQuestionTap?.call(q.questionUuid),
            )),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  final QuestionSummary question;
  final String difficultyStars;
  final VoidCallback? onTap;

  const _QuestionCard({
    required this.question,
    required this.difficultyStars,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(bottom: 8.h),
        padding: EdgeInsets.all(16.r),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 문제 내용
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (question.topicName != null)
                    Container(
                      margin: EdgeInsets.only(bottom: 6.h),
                      padding: EdgeInsets.symmetric(
                        horizontal: 8.w,
                        vertical: 2.h,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.accentLight,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        question.topicName!,
                        style: AppTextStyles.tag_10.copyWith(
                          color: AppColors.brandIndigo,
                        ),
                      ),
                    ),
                  Text(
                    question.stemPreview ?? '',
                    style: AppTextStyles.paragraph_14.copyWith(
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 6.h),
                  Text(
                    difficultyStars,
                    style: AppTextStyles.tag_10.copyWith(
                      color: AppColors.warning,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
            // 화살표
            Padding(
              padding: EdgeInsets.only(left: 8.w, top: 2.h),
              child: FaIcon(
                FontAwesomeIcons.chevronRight,
                size: 12.sp,
                color: AppColors.textCaption,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Task 13: HomePage 완성 조립

**Files:**
- Modify: `lib/presentation/pages/home/home_page.dart`

- [ ] **Step 1: HomePage 전체 구현**

```dart
// lib/presentation/pages/home/home_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../providers/home_providers.dart';
import '../../widgets/home/exam_schedule_card.dart';
import '../../widgets/home/fallback_stats_section.dart';
import '../../widgets/home/greeting_section.dart';
import '../../widgets/home/heatmap_widget.dart';
import '../../widgets/home/readiness_card.dart';
import '../../widgets/home/recommendations_section.dart';
import '../../widgets/home/today_question_card.dart';

/// 홈 화면.
/// 
/// homeDataProvider에서 6개 API 병렬 결과를 받아 렌더링.
/// 로딩 중: 스켈레톤 shimmer / 에러: 재시도 버튼.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: homeAsync.when(
          loading: () => _HomeSkeletonLoader(),
          error: (error, _) => _HomeErrorView(
            onRetry: () => ref.invalidate(homeDataProvider),
          ),
          data: (data) => _HomeContent(data: data),
        ),
      ),
    );
  }
}

/// 홈 화면 실제 콘텐츠.
class _HomeContent extends StatelessWidget {
  final HomeData data;

  const _HomeContent({required this.data});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.brandIndigo,
      onRefresh: () async {
        // Pull-to-refresh: 상위 ConsumerWidget에서 invalidate 처리
        // RefreshIndicator는 시각적 피드백용 — 데이터 갱신은 ref.invalidate로
      },
      child: ListView(
        padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
        children: [
          // 인사 섹션
          if (data.greeting != null)
            Padding(
              padding: EdgeInsets.only(bottom: 24.h),
              child: GreetingSection(greeting: data.greeting!),
            ),

          // 2열 카드 그리드: 오늘의 문제 + 시험 일정
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TodayQuestionCard(
                    todayQuestion: data.todayQuestion,
                    onTap: data.todayQuestion?.question != null
                        ? () => context.push(
                              '/questions/${data.todayQuestion!.question!.questionUuid}',
                            )
                        : () => context.go('/questions'),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: ExamScheduleCard(
                    schedule: data.examSchedule,
                  ),
                ),
              ],
            ),
          ),

          // 합격 준비도 카드 (readiness 있을 때)
          if (data.progress?.readiness != null)
            Padding(
              padding: EdgeInsets.only(bottom: 16.h),
              child: ReadinessCard(readiness: data.progress!.readiness!),
            ),

          // readiness 없을 때 Fallback 통계 카드
          if (data.progress != null && data.progress!.readiness == null)
            Padding(
              padding: EdgeInsets.only(bottom: 16.h),
              child: FallbackStatsSection(
                solvedCount: data.progress!.solvedCount,
                correctRate: data.progress!.correctRate,
              ),
            ),

          // 히트맵
          Padding(
            padding: EdgeInsets.only(bottom: 24.h),
            child: HeatmapWidget(
              heatmap: data.heatmap,
              streakDays: data.progress?.streakDays ?? 0,
            ),
          ),

          // 추천 문제 섹션
          if (data.recommendations != null &&
              data.recommendations!.questions.isNotEmpty)
            RecommendationsSection(
              questions: data.recommendations!.questions,
              onQuestionTap: (uuid) => context.push('/questions/$uuid'),
            ),
        ],
      ),
    );
  }
}

/// 로딩 중 스켈레톤 shimmer.
class _HomeSkeletonLoader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.borderDefault,
      highlightColor: AppColors.cardBg,
      child: ListView(
        padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
        children: [
          // 인사 섹션 스켈레톤
          Container(
            height: 60.h,
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          SizedBox(height: 24.h),
          // 2열 카드 스켈레톤
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 140.h,
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Container(
                  height: 140.h,
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          // 준비도 카드 스켈레톤
          Container(
            height: 180.h,
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        ],
      ),
    );
  }
}

/// API 에러 시 재시도 뷰.
class _HomeErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _HomeErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '데이터를 불러오지 못했어요.',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
              decoration: BoxDecoration(
                color: AppColors.brandIndigo,
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Text(
                '다시 시도',
                style: AppTextStyles.label_16.copyWith(
                  color: AppColors.cardBg,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: RefreshIndicator에 ref.invalidate 연결**

`_HomeContent`에서 RefreshIndicator의 `onRefresh`는 상위 ref에 접근할 수 없어 별도 처리 필요.
`HomePage`를 아래처럼 수정해 `onRefresh`에서 invalidate 처리:

```dart
// lib/presentation/pages/home/home_page.dart 내 HomePage 수정
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: homeAsync.when(
          loading: () => _HomeSkeletonLoader(),
          error: (error, _) => _HomeErrorView(
            onRetry: () => ref.invalidate(homeDataProvider),
          ),
          data: (data) => RefreshIndicator(
            color: AppColors.brandIndigo,
            onRefresh: () async {
              ref.invalidate(homeDataProvider);
              // 리프레시 완료까지 대기
              await ref.read(homeDataProvider.future);
            },
            child: _HomeContentScrollView(data: data),
          ),
        ),
      ),
    );
  }
}

/// 스크롤 가능한 홈 콘텐츠 (RefreshIndicator 내부에서 사용).
class _HomeContentScrollView extends StatelessWidget {
  final HomeData data;
  const _HomeContentScrollView({required this.data});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
      children: [
        if (data.greeting != null)
          Padding(
            padding: EdgeInsets.only(bottom: 24.h),
            child: GreetingSection(greeting: data.greeting!),
          ),
        Padding(
          padding: EdgeInsets.only(bottom: 16.h),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TodayQuestionCard(
                  todayQuestion: data.todayQuestion,
                  onTap: data.todayQuestion?.question != null
                      ? () => context.push(
                            '/questions/${data.todayQuestion!.question!.questionUuid}',
                          )
                      : () => context.go('/questions'),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: ExamScheduleCard(schedule: data.examSchedule),
              ),
            ],
          ),
        ),
        if (data.progress?.readiness != null)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: ReadinessCard(readiness: data.progress!.readiness!),
          ),
        if (data.progress != null && data.progress!.readiness == null)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: FallbackStatsSection(
              solvedCount: data.progress!.solvedCount,
              correctRate: data.progress!.correctRate,
            ),
          ),
        Padding(
          padding: EdgeInsets.only(bottom: 24.h),
          child: HeatmapWidget(
            heatmap: data.heatmap,
            streakDays: data.progress?.streakDays ?? 0,
          ),
        ),
        if (data.recommendations != null &&
            data.recommendations!.questions.isNotEmpty)
          RecommendationsSection(
            questions: data.recommendations!.questions,
            onQuestionTap: (uuid) => context.push('/questions/$uuid'),
          ),
      ],
    );
  }
}
```

---

## Task 14: 최종 빌드 확인

- [ ] **Step 1: flutter analyze**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter analyze
```

에러 0개 확인. 경고는 검토 후 수정.

- [ ] **Step 2: flutter run으로 시뮬레이터 확인**

```bash
flutter run
```

확인 사항:
- 앱 최초 실행 시 UUID 등록 완료 (콘솔 에러 없음)
- 홈 화면 shimmer 로딩 후 데이터 렌더링
- 인사 섹션, 2열 카드, 히트맵 정상 표시
- Pull-to-refresh 동작

- [ ] **Step 3: git commit**

```bash
git add lib/ docs/superpowers/plans/2026-04-11-home-screen.md
git commit -m "feat: 홈 화면 구현 — 디바이스 UUID 기반 회원 등록 + 6개 API 병렬 호출 + 홈 UI 컴포넌트 #1"
```

---

## 구현 완료 기준

- [ ] 앱 최초 실행 시 POST /members/register 호출 → memberUuid SharedPreferences 저장
- [ ] 이후 실행 시 저장된 UUID 재사용 (재등록 없음)
- [ ] 홈 화면 진입 시 6개 API 병렬 호출
- [ ] 인사 섹션: {nickname} 치환 + messageType 배지
- [ ] 오늘의 문제 카드: null 처리 + 완료 배지
- [ ] 시험 일정 카드: D-day 계산 + null 처리
- [ ] 합격 준비도 카드 또는 Fallback 통계 카드 (readiness 유무 기준)
- [ ] 히트맵: 5주 그리드 + 스트릭 배지
- [ ] 추천 문제 리스트: 탭 시 /questions/:uuid로 이동
- [ ] 로딩: shimmer 스켈레톤
- [ ] 에러: "다시 시도" 버튼 + ref.invalidate
- [ ] Pull-to-refresh 동작
