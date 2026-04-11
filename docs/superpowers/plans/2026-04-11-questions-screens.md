# Questions Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문제 목록 화면(토픽 선택 → 문제 리스트), 문제 상세 풀기 화면(SSE 선택지 생성 + SQL 실행 + 제출), 정답/오답 피드백 화면(AI 해설 + 유사 문제) 구현

**Architecture:**
- data layer: Freezed 모델 → Retrofit API 클라이언트 / 수동 Dio SSE 클라이언트
- state layer: Riverpod FutureProvider(문제 상세 로딩) + StateNotifier(선택지 선택·실행·SSE 상태)
- UI: ShellRoute 내 토픽/문제 목록, 풀스크린 문제 상세·결과 화면

**Tech Stack:** Flutter 3.x, Riverpod 2.x, Dio 5.x, Retrofit 4.x, Freezed 2.x, go_router 17.x

---

## File Map

**New Files:**
- `lib/data/models/question/choice_item.dart` — ChoiceItem (freezed)
- `lib/data/models/question/choice_set_summary.dart` — ChoiceSetSummary (freezed)
- `lib/data/models/question/question_detail.dart` — QuestionDetail (freezed)
- `lib/data/models/question/execute_result.dart` — ExecuteResult (freezed)
- `lib/data/models/question/submit_result.dart` — SubmitResult (freezed)
- `lib/data/models/question/execute_request.dart` — POST body (freezed)
- `lib/data/models/question/submit_request.dart` — POST body (freezed)
- `lib/data/models/question/sse_event.dart` — sealed SseEvent (plain Dart)
- `lib/data/models/question/question_list_response.dart` — Page wrapper (freezed)
- `lib/data/models/meta/topic_tree.dart` — TopicTree + SubtopicItem (freezed)
- `lib/data/models/ai/similar_question.dart` — SimilarQuestion (freezed)
- `lib/data/models/ai/ai_result.dart` — AiResult (freezed)
- `lib/data/sources/meta_api.dart` — Retrofit MetaApiClient
- `lib/data/sources/ai_api.dart` — Retrofit AiApiClient
- `lib/data/sources/sse_question_client.dart` — Dio streaming SSE 클라이언트
- `lib/presentation/providers/question_providers.dart` — 문제 상세·인터랙션 Provider
- `lib/presentation/providers/topic_providers.dart` — 토픽 목록 Provider
- `lib/presentation/widgets/question/topic_card.dart` — 토픽 선택 카드
- `lib/presentation/widgets/question/question_list_card.dart` — 문제 목록 아이템 카드
- `lib/presentation/widgets/question/choice_card.dart` — 선택지 카드
- `lib/presentation/widgets/question/execute_result_card.dart` — SQL 실행 결과 카드
- `lib/presentation/widgets/question/schema_section.dart` — 스키마 DDL 섹션
- `lib/presentation/widgets/question/sse_loading_widget.dart` — SSE 로딩 상태 위젯
- `lib/presentation/widgets/question/ai_explain_sheet.dart` — AI 해설 바텀시트
- `lib/presentation/widgets/result/similar_questions_section.dart` — 유사 문제 리스트
- `lib/presentation/pages/questions/question_list_page.dart` — 문제 목록 화면

**Modified Files:**
- `lib/data/models/home/question_summary.dart` — topicCode, createdAt 필드 추가
- `lib/data/sources/question_api.dart` — getQuestions, getQuestion, executeChoice, submitAnswer 추가
- `lib/router/app_routes.dart` — questionList 상수 추가
- `lib/router/app_router.dart` — /questions/list 서브 라우트 추가
- `lib/presentation/pages/questions/topic_list_page.dart` — 실제 구현
- `lib/presentation/pages/questions/question_detail_page.dart` — 실제 구현
- `lib/presentation/pages/result/result_page.dart` — 실제 구현

---

### Task 1: Question 도메인 데이터 모델

**Files:**
- Create: `lib/data/models/question/choice_item.dart`
- Create: `lib/data/models/question/choice_set_summary.dart`
- Create: `lib/data/models/question/question_detail.dart`
- Create: `lib/data/models/question/execute_result.dart`
- Create: `lib/data/models/question/submit_result.dart`
- Create: `lib/data/models/question/execute_request.dart`
- Create: `lib/data/models/question/submit_request.dart`
- Create: `lib/data/models/question/sse_event.dart`
- Create: `lib/data/models/question/question_list_response.dart`
- Modify: `lib/data/models/home/question_summary.dart`

- [ ] **Step 1: choice_item.dart 생성**

```dart
// lib/data/models/question/choice_item.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'choice_item.freezed.dart';
part 'choice_item.g.dart';

/// 개별 선택지. kind="SQL"이면 body가 SQL 코드, kind="TEXT"면 일반 텍스트.
@freezed
class ChoiceItem with _$ChoiceItem {
  const factory ChoiceItem({
    required String key,
    required String kind,
    required String body,
    bool? isCorrect,
    String? rationale,
    int? sortOrder,
  }) = _ChoiceItem;

  factory ChoiceItem.fromJson(Map<String, dynamic> json) =>
      _$ChoiceItemFromJson(json);
}
```

- [ ] **Step 2: choice_set_summary.dart 생성**

```dart
// lib/data/models/question/choice_set_summary.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'choice_item.dart';

part 'choice_set_summary.freezed.dart';
part 'choice_set_summary.g.dart';

/// 선택지 세트. status="OK"인 세트만 화면에 표시한다.
@freezed
class ChoiceSetSummary with _$ChoiceSetSummary {
  const factory ChoiceSetSummary({
    required String choiceSetUuid,
    required String source,
    required String status,
    bool? sandboxValidationPassed,
    String? createdAt,
    @Default([]) List<ChoiceItem> items,
  }) = _ChoiceSetSummary;

  factory ChoiceSetSummary.fromJson(Map<String, dynamic> json) =>
      _$ChoiceSetSummaryFromJson(json);
}
```

- [ ] **Step 3: question_detail.dart 생성**

```dart
// lib/data/models/question/question_detail.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'choice_set_summary.dart';

part 'question_detail.freezed.dart';
part 'question_detail.g.dart';

/// 문제 상세 응답. executionMode에 따라 UI 분기.
/// EXECUTABLE: SQL 실행 + 스키마 표시
/// CONCEPT_ONLY: 텍스트 선택지만 표시
@freezed
class QuestionDetail with _$QuestionDetail {
  const factory QuestionDetail({
    required String questionUuid,
    String? topicName,
    String? subtopicName,
    int? difficulty,
    String? executionMode,
    required String stem,
    String? schemaDisplay,
    String? schemaDdl,
    String? schemaSampleData,
    String? schemaIntent,
    String? answerSql,
    String? hint,
    @Default([]) List<ChoiceSetSummary> choiceSets,
  }) = _QuestionDetail;

  factory QuestionDetail.fromJson(Map<String, dynamic> json) =>
      _$QuestionDetailFromJson(json);
}
```

- [ ] **Step 4: execute_result.dart 생성**

```dart
// lib/data/models/question/execute_result.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'execute_result.freezed.dart';
part 'execute_result.g.dart';

/// SQL 실행 결과. errorCode가 있으면 실행 실패.
@freezed
class ExecuteResult with _$ExecuteResult {
  const factory ExecuteResult({
    String? status,
    @Default([]) List<String> columns,
    @Default([]) List<List<dynamic>> rows,
    int? rowCount,
    int? elapsedMs,
    String? errorCode,
    String? errorMessage,
  }) = _ExecuteResult;

  factory ExecuteResult.fromJson(Map<String, dynamic> json) =>
      _$ExecuteResultFromJson(json);
}
```

- [ ] **Step 5: submit_result.dart 생성**

```dart
// lib/data/models/question/submit_result.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import 'execute_result.dart';

part 'submit_result.freezed.dart';
part 'submit_result.g.dart';

/// 제출 결과. ResultPage로 navigate state에 담아 전달.
@freezed
class SubmitResult with _$SubmitResult {
  const factory SubmitResult({
    required bool isCorrect,
    String? correctKey,
    String? rationale,
    ExecuteResult? selectedResult,
    ExecuteResult? correctResult,
    String? correctSql,
    String? selectedSql,
  }) = _SubmitResult;

  factory SubmitResult.fromJson(Map<String, dynamic> json) =>
      _$SubmitResultFromJson(json);
}
```

- [ ] **Step 6: execute_request.dart & submit_request.dart 생성**

```dart
// lib/data/models/question/execute_request.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'execute_request.freezed.dart';
part 'execute_request.g.dart';

@freezed
class ExecuteRequest with _$ExecuteRequest {
  const factory ExecuteRequest({required String sql}) = _ExecuteRequest;
  factory ExecuteRequest.fromJson(Map<String, dynamic> json) =>
      _$ExecuteRequestFromJson(json);
}
```

```dart
// lib/data/models/question/submit_request.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'submit_request.freezed.dart';
part 'submit_request.g.dart';

@freezed
class SubmitRequest with _$SubmitRequest {
  const factory SubmitRequest({
    required String choiceSetId,
    required String selectedChoiceKey,
  }) = _SubmitRequest;
  factory SubmitRequest.fromJson(Map<String, dynamic> json) =>
      _$SubmitRequestFromJson(json);
}
```

- [ ] **Step 7: sse_event.dart 생성 (코드 생성 불필요)**

```dart
// lib/data/models/question/sse_event.dart

import 'choice_item.dart';

/// SSE 이벤트 계층. 코드 생성 없이 수동 파싱 사용.
sealed class SseEvent {}

/// 선택지 생성 진행 중 상태 메시지.
class SseStatusEvent extends SseEvent {
  final String message;
  SseStatusEvent(this.message);
}

/// 선택지 생성 완료. choices와 choiceSetId를 포함.
class SseCompleteEvent extends SseEvent {
  final List<ChoiceItem> choices;
  final String choiceSetId;
  SseCompleteEvent(this.choices, this.choiceSetId);
}

/// 선택지 생성 실패. retryable=true면 재시도 버튼 표시.
class SseErrorEvent extends SseEvent {
  final String code;
  final bool retryable;
  SseErrorEvent(this.code, this.retryable);
}
```

- [ ] **Step 8: question_list_response.dart 생성**

```dart
// lib/data/models/question/question_list_response.dart
import 'package:freezed_annotation/freezed_annotation.dart';
import '../home/question_summary.dart';

part 'question_list_response.freezed.dart';
part 'question_list_response.g.dart';

/// Spring Page<QuestionSummary> 응답 래퍼.
@freezed
class QuestionListResponse with _$QuestionListResponse {
  const factory QuestionListResponse({
    required List<QuestionSummary> content,
    required int totalElements,
    required int totalPages,
    required int number,
    required bool last,
  }) = _QuestionListResponse;

  factory QuestionListResponse.fromJson(Map<String, dynamic> json) =>
      _$QuestionListResponseFromJson(json);
}
```

- [ ] **Step 9: question_summary.dart에 topicCode, createdAt 필드 추가**

`lib/data/models/home/question_summary.dart`를 다음으로 교체:

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'question_summary.freezed.dart';
part 'question_summary.g.dart';

/// 오늘의 문제 / 추천 문제 / 문제 목록 리스트에서 사용하는 축약 문제 모델.
/// difficulty: 1(쉬움), 2(보통), 3(어려움)
@freezed
class QuestionSummary with _$QuestionSummary {
  const factory QuestionSummary({
    required String questionUuid,
    String? topicCode,
    String? topicName,
    String? stemPreview,
    int? difficulty,
    String? executionMode,
    String? createdAt,
  }) = _QuestionSummary;

  factory QuestionSummary.fromJson(Map<String, dynamic> json) =>
      _$QuestionSummaryFromJson(json);
}
```

- [ ] **Step 10: 코드 생성 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

기대 출력: `[INFO] Succeeded after ...s with X outputs`

- [ ] **Step 11: 커밋**

```bash
git add lib/data/models/question/ lib/data/models/home/question_summary.dart lib/data/models/home/question_summary.freezed.dart lib/data/models/home/question_summary.g.dart
git commit -m "feat: Question 도메인 데이터 모델 추가 (ChoiceItem, QuestionDetail, ExecuteResult, SubmitResult, SSE 이벤트) #xx"
```

---

### Task 2: Meta & AI 도메인 데이터 모델

**Files:**
- Create: `lib/data/models/meta/topic_tree.dart`
- Create: `lib/data/models/ai/similar_question.dart`
- Create: `lib/data/models/ai/ai_result.dart`

- [ ] **Step 1: topic_tree.dart 생성**

```dart
// lib/data/models/meta/topic_tree.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'topic_tree.freezed.dart';
part 'topic_tree.g.dart';

/// 서브토픽 항목.
@freezed
class SubtopicItem with _$SubtopicItem {
  const factory SubtopicItem({
    required String code,
    required String displayName,
    int? sortOrder,
    bool? isActive,
  }) = _SubtopicItem;

  factory SubtopicItem.fromJson(Map<String, dynamic> json) =>
      _$SubtopicItemFromJson(json);
}

/// 토픽 트리. isActive=true인 항목만 화면에 표시.
@freezed
class TopicTree with _$TopicTree {
  const factory TopicTree({
    required String topicUuid,
    required String code,
    required String displayName,
    int? sortOrder,
    bool? isActive,
    @Default([]) List<SubtopicItem> subtopics,
  }) = _TopicTree;

  factory TopicTree.fromJson(Map<String, dynamic> json) =>
      _$TopicTreeFromJson(json);
}
```

- [ ] **Step 2: similar_question.dart 생성**

```dart
// lib/data/models/ai/similar_question.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'similar_question.freezed.dart';
part 'similar_question.g.dart';

/// AI 유사 문제. score: 유사도 점수(0~1).
@freezed
class SimilarQuestion with _$SimilarQuestion {
  const factory SimilarQuestion({
    required String questionUuid,
    String? stem,
    String? topicName,
    double? score,
  }) = _SimilarQuestion;

  factory SimilarQuestion.fromJson(Map<String, dynamic> json) =>
      _$SimilarQuestionFromJson(json);
}
```

- [ ] **Step 3: ai_result.dart 생성**

```dart
// lib/data/models/ai/ai_result.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_result.freezed.dart';
part 'ai_result.g.dart';

/// AI 해설 텍스트 응답.
@freezed
class AiResult with _$AiResult {
  const factory AiResult({
    required String text,
    int? promptVersion,
  }) = _AiResult;

  factory AiResult.fromJson(Map<String, dynamic> json) =>
      _$AiResultFromJson(json);
}
```

- [ ] **Step 4: 코드 생성 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 5: 커밋**

```bash
git add lib/data/models/meta/ lib/data/models/ai/
git commit -m "feat: Meta(TopicTree) 및 AI(SimilarQuestion, AiResult) 데이터 모델 추가 #xx"
```

---

### Task 3: API 클라이언트 업데이트

**Files:**
- Modify: `lib/data/sources/question_api.dart`
- Create: `lib/data/sources/meta_api.dart`
- Create: `lib/data/sources/ai_api.dart`

- [ ] **Step 1: question_api.dart 전체 교체**

```dart
// lib/data/sources/question_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/home/today_question_response.dart';
import '../models/home/recommendations_response.dart';
import '../models/question/question_detail.dart';
import '../models/question/question_list_response.dart';
import '../models/question/execute_request.dart';
import '../models/question/execute_result.dart';
import '../models/question/submit_request.dart';
import '../models/question/submit_result.dart';

part 'question_api.g.dart';

@RestApi()
abstract class QuestionApiClient {
  factory QuestionApiClient(Dio dio, {String baseUrl}) = _QuestionApiClient;

  /// 오늘의 데일리 챌린지 문제.
  @GET('/questions/today')
  Future<TodayQuestionResponse> getTodayQuestion(
    @Query('memberUuid') String? memberUuid,
  );

  /// 랜덤 추천 문제 N개.
  @GET('/questions/recommendations')
  Future<RecommendationsResponse> getRecommendations(
    @Query('size') int? size,
    @Query('excludeQuestionUuid') String? excludeQuestionUuid,
  );

  /// 문제 목록 조회 (페이지네이션). topic, difficulty는 선택 필터.
  @GET('/questions')
  Future<QuestionListResponse> getQuestions(
    @Query('page') int page,
    @Query('size') int size, {
    @Query('topic') String? topic,
    @Query('difficulty') int? difficulty,
  });

  /// 문제 상세 조회.
  @GET('/questions/{questionUuid}')
  Future<QuestionDetail> getQuestion(
    @Path('questionUuid') String questionUuid,
  );

  /// SQL 실행 (EXECUTABLE 모드 전용). body: { sql: "..." }
  @POST('/questions/{questionUuid}/execute')
  Future<ExecuteResult> executeChoice(
    @Path('questionUuid') String questionUuid,
    @Body() ExecuteRequest body,
  );

  /// 답안 제출. 헤더 X-Member-UUID 필수.
  @POST('/questions/{questionUuid}/submit')
  Future<SubmitResult> submitAnswer(
    @Path('questionUuid') String questionUuid,
    @Body() SubmitRequest body,
    @Header('X-Member-UUID') String memberUuid,
  );
}
```

- [ ] **Step 2: meta_api.dart 생성**

```dart
// lib/data/sources/meta_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/meta/topic_tree.dart';

part 'meta_api.g.dart';

@RestApi()
abstract class MetaApiClient {
  factory MetaApiClient(Dio dio, {String baseUrl}) = _MetaApiClient;

  /// 토픽 트리 전체 조회. isActive=true인 항목만 화면에 표시.
  @GET('/meta/topics')
  Future<List<TopicTree>> getTopics();
}
```

- [ ] **Step 3: ai_api.dart 생성**

```dart
// lib/data/sources/ai_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/ai/ai_result.dart';
import '../models/ai/similar_question.dart';

part 'ai_api.g.dart';

@RestApi()
abstract class AiApiClient {
  factory AiApiClient(Dio dio, {String baseUrl}) = _AiApiClient;

  /// SQL 에러 AI 해설. body: { questionUuid, sql, errorMessage }
  @POST('/ai/explain-error')
  Future<AiResult> explainError(
    @Header('X-Member-UUID') String memberUuid,
    @Body() Map<String, dynamic> body,
  );

  /// 오답 AI 해설. body: { questionUuid, selectedChoiceKey }
  @POST('/ai/diff-explain')
  Future<AiResult> diffExplain(
    @Header('X-Member-UUID') String memberUuid,
    @Body() Map<String, dynamic> body,
  );

  /// 유사 문제 k개 조회.
  @GET('/ai/similar/{questionUuid}')
  Future<List<SimilarQuestion>> getSimilar(
    @Path('questionUuid') String questionUuid,
    @Query('k') int k,
  );
}
```

- [ ] **Step 4: 코드 생성 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 5: 커밋**

```bash
git add lib/data/sources/
git commit -m "feat: QuestionApiClient 확장 및 MetaApiClient, AiApiClient 추가 #xx"
```

---

### Task 4: SSE 선택지 생성 클라이언트

**Files:**
- Create: `lib/data/sources/sse_question_client.dart`

- [ ] **Step 1: sse_question_client.dart 생성**

Dio `ResponseType.stream`으로 SSE 이벤트를 스트리밍 파싱. 코드 생성 불필요.

```dart
// lib/data/sources/sse_question_client.dart
import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../models/question/choice_item.dart';
import '../models/question/sse_event.dart';

/// POST /questions/{questionUuid}/generate-choices SSE 스트리밍 클라이언트.
///
/// Retrofit은 SSE를 지원하지 않으므로 Dio ResponseType.stream으로 직접 처리.
class SseQuestionClient {
  final Dio _dio;

  SseQuestionClient(this._dio);

  /// SSE 스트림 반환. 이벤트: SseStatusEvent, SseCompleteEvent, SseErrorEvent.
  /// 에러 발생 시 스트림에 에러 추가 후 종료.
  Stream<SseEvent> generateChoices({
    required String questionUuid,
    required String memberUuid,
  }) async* {
    Response<ResponseBody> response;
    try {
      response = await _dio.post<ResponseBody>(
        '/questions/$questionUuid/generate-choices',
        options: Options(
          responseType: ResponseType.stream,
          headers: {
            'X-Member-UUID': memberUuid,
            'Accept': 'text/event-stream',
          },
        ),
      );
    } catch (e) {
      yield SseErrorEvent('CONNECT_FAILED', true);
      return;
    }

    // SSE는 빈 줄로 이벤트를 구분하고, 각 줄이 "data: {...}" 형식.
    final lineStream = response.data!.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter());

    var dataLine = '';
    await for (final line in lineStream) {
      if (line.startsWith('data: ')) {
        dataLine = line.substring(6).trim();
      } else if (line.isEmpty && dataLine.isNotEmpty) {
        final event = _parse(dataLine);
        if (event != null) yield event;
        dataLine = '';
      }
    }
  }

  SseEvent? _parse(String raw) {
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      final type = json['type'] as String?;
      switch (type) {
        case 'status':
          return SseStatusEvent(json['message'] as String? ?? '처리 중...');
        case 'complete':
          final rawChoices = json['choices'] as List<dynamic>? ?? [];
          final choices = rawChoices
              .map((e) => ChoiceItem.fromJson(e as Map<String, dynamic>))
              .toList();
          return SseCompleteEvent(choices, json['choiceSetId'] as String? ?? '');
        case 'error':
          return SseErrorEvent(
            json['code'] as String? ?? 'UNKNOWN',
            json['retryable'] as bool? ?? false,
          );
        default:
          return null;
      }
    } catch (_) {
      return null;
    }
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/data/sources/sse_question_client.dart
git commit -m "feat: SSE 선택지 생성 클라이언트 추가 (Dio stream 파싱) #xx"
```

---

### Task 5: Riverpod Providers

**Files:**
- Create: `lib/presentation/providers/topic_providers.dart`
- Create: `lib/presentation/providers/question_providers.dart`

- [ ] **Step 1: topic_providers.dart 생성**

```dart
// lib/presentation/providers/topic_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/meta/topic_tree.dart';
import '../../data/sources/meta_api.dart';

/// 토픽 목록 Provider. staleTime 없음 — 탭 진입 시 1회 로드.
/// isActive=true인 항목만 sortOrder 기준 정렬하여 반환.
final topicsProvider = FutureProvider<List<TopicTree>>((ref) async {
  final dio = ref.read(dioProvider);
  final client = MetaApiClient(dio);
  final topics = await client.getTopics();
  return topics
      .where((t) => t.isActive == true)
      .toList()
    ..sort((a, b) => (a.sortOrder ?? 0).compareTo(b.sortOrder ?? 0));
});
```

- [ ] **Step 2: question_providers.dart 생성**

문제 상세 로딩 + 인터랙션 상태(선택·SSE·실행 캐시·제출) 관리.

```dart
// lib/presentation/providers/question_providers.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/question/choice_item.dart';
import '../../data/models/question/execute_request.dart';
import '../../data/models/question/execute_result.dart';
import '../../data/models/question/question_detail.dart';
import '../../data/models/question/sse_event.dart';
import '../../data/models/question/submit_request.dart';
import '../../data/models/question/submit_result.dart';
import '../../data/sources/question_api.dart';
import '../../data/sources/sse_question_client.dart';
import 'member_store.dart';

/// 문제 상세 로딩 Provider. autoDispose로 화면 이탈 시 캐시 해제.
final questionDetailProvider =
    FutureProvider.autoDispose.family<QuestionDetail, String>(
  (ref, questionUuid) async {
    final dio = ref.read(dioProvider);
    return QuestionApiClient(dio).getQuestion(questionUuid);
  },
);

// ─── 인터랙션 상태 ───────────────────────────────────────────────────

/// 선택지 선택·SSE·실행 캐시·제출 상태.
class QuestionInteractionState {
  /// 현재 활성 선택지 세트 UUID (SSE 완료 후 또는 기존 OK 세트).
  final String? activeChoiceSetId;

  /// 현재 표시 중인 선택지 목록.
  final List<ChoiceItem> activeChoices;

  /// 사용자가 선택한 선택지 키 (A/B/C/D).
  final String? selectedChoiceKey;

  /// SQL → ExecuteResult 캐시. 같은 SQL 재실행 방지.
  final Map<String, ExecuteResult> executeCache;

  /// 현재 선택 키에 해당하는 실행 결과 (null이면 미실행).
  final ExecuteResult? currentExecuteResult;

  /// SQL 실행 중 여부.
  final bool isExecuting;

  /// SSE 선택지 생성 중 여부.
  final bool isGeneratingChoices;

  /// SSE 상태 메시지 ("선택지 생성 중..." 등).
  final String? sseStatusMessage;

  /// SSE 에러 (null이면 정상).
  final SseErrorEvent? sseError;

  /// 제출 중 여부.
  final bool isSubmitting;

  const QuestionInteractionState({
    this.activeChoiceSetId,
    this.activeChoices = const [],
    this.selectedChoiceKey,
    this.executeCache = const {},
    this.currentExecuteResult,
    this.isExecuting = false,
    this.isGeneratingChoices = false,
    this.sseStatusMessage,
    this.sseError,
    this.isSubmitting = false,
  });

  QuestionInteractionState copyWith({
    String? activeChoiceSetId,
    List<ChoiceItem>? activeChoices,
    String? selectedChoiceKey,
    Map<String, ExecuteResult>? executeCache,
    ExecuteResult? currentExecuteResult,
    bool clearExecuteResult = false,
    bool? isExecuting,
    bool? isGeneratingChoices,
    String? sseStatusMessage,
    SseErrorEvent? sseError,
    bool clearSseError = false,
    bool? isSubmitting,
  }) {
    return QuestionInteractionState(
      activeChoiceSetId: activeChoiceSetId ?? this.activeChoiceSetId,
      activeChoices: activeChoices ?? this.activeChoices,
      selectedChoiceKey: selectedChoiceKey ?? this.selectedChoiceKey,
      executeCache: executeCache ?? this.executeCache,
      currentExecuteResult: clearExecuteResult
          ? null
          : (currentExecuteResult ?? this.currentExecuteResult),
      isExecuting: isExecuting ?? this.isExecuting,
      isGeneratingChoices: isGeneratingChoices ?? this.isGeneratingChoices,
      sseStatusMessage: sseStatusMessage ?? this.sseStatusMessage,
      sseError: clearSseError ? null : (sseError ?? this.sseError),
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

/// 문제 인터랙션 Notifier. questionUuid별로 autoDispose family 생성.
class QuestionInteractionNotifier
    extends AutoDisposeStateNotifier<QuestionInteractionState> {
  final String _questionUuid;
  final QuestionApiClient _questionApi;
  final SseQuestionClient _sseClient;
  final String _memberUuid;

  StreamSubscription<SseEvent>? _sseSub;

  QuestionInteractionNotifier({
    required String questionUuid,
    required QuestionApiClient questionApi,
    required SseQuestionClient sseClient,
    required String memberUuid,
  })  : _questionUuid = questionUuid,
        _questionApi = questionApi,
        _sseClient = sseClient,
        _memberUuid = memberUuid,
        super(const QuestionInteractionState());

  /// 기존 OK 선택지 세트를 바로 사용 (SSE 불필요).
  void useExistingChoiceSet(String choiceSetId, List<ChoiceItem> items) {
    state = state.copyWith(
      activeChoiceSetId: choiceSetId,
      activeChoices: items,
    );
  }

  /// SSE로 선택지 생성 시작.
  Future<void> startSseGeneration() async {
    state = state.copyWith(
      isGeneratingChoices: true,
      clearSseError: true,
      sseStatusMessage: '선택지 생성 중...',
    );

    await _sseSub?.cancel();
    _sseSub = _sseClient
        .generateChoices(
          questionUuid: _questionUuid,
          memberUuid: _memberUuid,
        )
        .listen(
          _onSseEvent,
          onError: (_) {
            state = state.copyWith(
              isGeneratingChoices: false,
              sseError: SseErrorEvent('STREAM_ERROR', true),
            );
          },
        );
  }

  void _onSseEvent(SseEvent event) {
    switch (event) {
      case SseStatusEvent(:final message):
        state = state.copyWith(sseStatusMessage: message);
      case SseCompleteEvent(:final choices, :final choiceSetId):
        state = state.copyWith(
          isGeneratingChoices: false,
          activeChoiceSetId: choiceSetId,
          activeChoices: choices,
          clearSseError: true,
        );
      case SseErrorEvent():
        state = state.copyWith(
          isGeneratingChoices: false,
          sseError: event as SseErrorEvent,
        );
    }
  }

  /// 선택지 클릭. EXECUTABLE이면 SQL 실행 (캐시 우선).
  Future<void> selectChoice({
    required String choiceKey,
    required String? sql,
    required bool isExecutable,
  }) async {
    state = state.copyWith(
      selectedChoiceKey: choiceKey,
      clearExecuteResult: true,
    );

    if (!isExecutable || sql == null || sql.isEmpty) return;

    // 캐시 HIT: API 호출 없이 결과 재사용.
    final cached = state.executeCache[sql];
    if (cached != null) {
      state = state.copyWith(currentExecuteResult: cached);
      return;
    }

    // 캐시 MISS: POST /execute 호출.
    state = state.copyWith(isExecuting: true);
    try {
      final result = await _questionApi.executeChoice(
        _questionUuid,
        ExecuteRequest(sql: sql),
      );
      final newCache = Map<String, ExecuteResult>.from(state.executeCache)
        ..[sql] = result;
      state = state.copyWith(
        executeCache: newCache,
        currentExecuteResult: result,
        isExecuting: false,
      );
    } catch (_) {
      state = state.copyWith(isExecuting: false);
    }
  }

  /// 답안 제출. 성공 시 SubmitResult 반환, 실패 시 null 반환.
  Future<SubmitResult?> submit() async {
    final choiceSetId = state.activeChoiceSetId;
    final selectedKey = state.selectedChoiceKey;
    if (choiceSetId == null || selectedKey == null) return null;

    state = state.copyWith(isSubmitting: true);
    try {
      final result = await _questionApi.submitAnswer(
        _questionUuid,
        SubmitRequest(
          choiceSetId: choiceSetId,
          selectedChoiceKey: selectedKey,
        ),
        _memberUuid,
      );
      return result;
    } catch (_) {
      state = state.copyWith(isSubmitting: false);
      return null;
    }
  }

  @override
  void dispose() {
    _sseSub?.cancel();
    super.dispose();
  }
}

/// questionUuid별 인터랙션 Provider.
final questionInteractionProvider = StateNotifierProvider.autoDispose
    .family<QuestionInteractionNotifier, QuestionInteractionState, String>(
  (ref, questionUuid) {
    final dio = ref.read(dioProvider);
    final memberUuid =
        ref.read(memberStoreProvider).valueOrNull ?? '';
    return QuestionInteractionNotifier(
      questionUuid: questionUuid,
      questionApi: QuestionApiClient(dio),
      sseClient: SseQuestionClient(dio),
      memberUuid: memberUuid,
    );
  },
);
```

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/providers/topic_providers.dart lib/presentation/providers/question_providers.dart
git commit -m "feat: 토픽 목록 및 문제 인터랙션 Riverpod Provider 추가 #xx"
```

---

### Task 6: 라우터 업데이트

**Files:**
- Modify: `lib/router/app_routes.dart`
- Modify: `lib/router/app_router.dart`

- [ ] **Step 1: app_routes.dart에 questionList 상수 추가**

`static const String settings = '/settings';` 아래에 추가:

```dart
  // 문제 탭 서브 라우트
  /// 토픽 선택 후 문제 목록. topic(topicCode), topicName, difficulty(선택) 쿼리 파라미터.
  static const String questionList = '/questions/list';
```

- [ ] **Step 2: app_router.dart — question list 서브 라우트 추가**

`topic_list_page.dart` GoRoute를 다음으로 교체:

```dart
import '../presentation/pages/questions/question_list_page.dart';
```
(import 추가)

그리고 ShellRoute 내 `/questions` GoRoute를 다음으로 교체:

```dart
GoRoute(
  path: AppRoutes.questions,
  pageBuilder: (_, _) =>
      const NoTransitionPage(child: TopicListPage()),
  routes: [
    // 토픽 선택 후 문제 목록 (탭 바 유지)
    GoRoute(
      path: 'list',
      builder: (_, state) {
        final params = state.uri.queryParameters;
        return QuestionListPage(
          topicCode: params['topic'],
          topicName: params['topicName'] ?? '문제 목록',
          initialDifficulty:
              int.tryParse(params['difficulty'] ?? ''),
        );
      },
    ),
  ],
),
```

- [ ] **Step 3: 커밋**

```bash
git add lib/router/app_routes.dart lib/router/app_router.dart
git commit -m "feat: 문제 목록 서브 라우트(/questions/list) 추가 #xx"
```

---

### Task 7: 토픽 목록 화면

**Files:**
- Create: `lib/presentation/widgets/question/topic_card.dart`
- Modify: `lib/presentation/pages/questions/topic_list_page.dart`

- [ ] **Step 1: topic_card.dart 생성**

```dart
// lib/presentation/widgets/question/topic_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/meta/topic_tree.dart';

/// 토픽 선택 카드. displayName + 서브토픽 개수 표시.
class TopicCard extends StatelessWidget {
  final TopicTree topic;
  final VoidCallback onTap;

  const TopicCard({super.key, required this.topic, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final activeSubtopicCount =
        topic.subtopics.where((s) => s.isActive == true).length;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // 토픽 이름
            Text(
              topic.displayName,
              style: AppTextStyles.label_16
                  .copyWith(color: AppColors.textPrimary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: 8.h),
            // 서브토픽 개수
            Text(
              '$activeSubtopicCount개 서브토픽',
              style: AppTextStyles.tag_12
                  .copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: topic_list_page.dart 구현**

```dart
// lib/presentation/pages/questions/topic_list_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../presentation/providers/topic_providers.dart';
import '../../../router/app_routes.dart';
import '../../widgets/question/topic_card.dart';

/// 문제 탭 1단계 — 토픽 선택 화면.
/// 토픽 카드 탭 시 /questions/list?topic=CODE&topicName=NAME으로 이동.
class TopicListPage extends ConsumerWidget {
  const TopicListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topicsAsync = ref.watch(topicsProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 헤더
            Padding(
              padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 8.h),
              child: Text(
                '문제',
                style: AppTextStyles.heading_24
                    .copyWith(color: AppColors.textPrimary),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 16.h),
              child: Text(
                '학습할 토픽을 선택하세요',
                style: AppTextStyles.paragraph_14
                    .copyWith(color: AppColors.textSecondary),
              ),
            ),

            // 토픽 그리드
            Expanded(
              child: topicsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Text(
                    '토픽을 불러올 수 없어요',
                    style: AppTextStyles.paragraph_14
                        .copyWith(color: AppColors.textSecondary),
                  ),
                ),
                data: (topics) => GridView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12.w,
                    mainAxisSpacing: 12.h,
                    childAspectRatio: 1.4,
                  ),
                  itemCount: topics.length,
                  itemBuilder: (_, i) {
                    final topic = topics[i];
                    return TopicCard(
                      topic: topic,
                      onTap: () => context.go(
                        '${AppRoutes.questionList}'
                        '?topic=${topic.code}'
                        '&topicName=${Uri.encodeComponent(topic.displayName)}',
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/widgets/question/topic_card.dart lib/presentation/pages/questions/topic_list_page.dart
git commit -m "feat: 토픽 목록 화면 구현 (2열 그리드, TopicCard) #xx"
```

---

### Task 8: 문제 목록 화면

**Files:**
- Create: `lib/presentation/widgets/question/question_list_card.dart`
- Create: `lib/presentation/pages/questions/question_list_page.dart`

- [ ] **Step 1: question_list_card.dart 생성**

```dart
// lib/presentation/widgets/question/question_list_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/question_summary.dart';

/// 문제 목록 아이템 카드.
/// UUID 앞 8자리 + stemPreview + topicName + 난이도 별 표시.
class QuestionListCard extends StatelessWidget {
  final QuestionSummary question;
  final VoidCallback onTap;

  const QuestionListCard({
    super.key,
    required this.question,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // UUID 앞 8자리 + topicName
            Row(
              children: [
                Text(
                  question.questionUuid.substring(0, 8).toUpperCase(),
                  style: AppTextStyles.tag_12
                      .copyWith(color: AppColors.textCaption),
                ),
                const Spacer(),
                if (question.topicName != null)
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                    decoration: BoxDecoration(
                      color: AppColors.accentLight,
                      borderRadius: BorderRadius.circular(999.r),
                    ),
                    child: Text(
                      question.topicName!,
                      style: AppTextStyles.tag_12
                          .copyWith(color: AppColors.brandIndigo),
                    ),
                  ),
              ],
            ),
            SizedBox(height: 8.h),
            // 문제 미리보기
            Text(
              question.stemPreview ?? '문제 내용을 불러오는 중...',
              style: AppTextStyles.paragraph_14
                  .copyWith(color: AppColors.textPrimary),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: 8.h),
            // 난이도 별
            _DifficultyStars(difficulty: question.difficulty ?? 1),
          ],
        ),
      ),
    );
  }
}

class _DifficultyStars extends StatelessWidget {
  final int difficulty;
  const _DifficultyStars({required this.difficulty});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(3, (i) {
        final filled = i < difficulty;
        return Padding(
          padding: EdgeInsets.only(right: 2.w),
          child: FaIcon(
            FontAwesomeIcons.solidStar,
            size: 12.sp,
            color: filled ? AppColors.warning : AppColors.borderDefault,
          ),
        );
      }),
    );
  }
}
```

- [ ] **Step 2: question_list_page.dart 생성**

```dart
// lib/presentation/pages/questions/question_list_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/models/home/question_summary.dart';
import '../../../data/models/question/question_list_response.dart';
import '../../../data/sources/question_api.dart';
import '../../../router/app_routes.dart';
import '../../widgets/question/question_list_card.dart';

/// 문제 탭 2단계 — 토픽별 문제 목록.
/// "더 보기" 버튼으로 페이지 증가, 난이도 필터 지원.
class QuestionListPage extends ConsumerStatefulWidget {
  final String? topicCode;
  final String topicName;
  final int? initialDifficulty;

  const QuestionListPage({
    super.key,
    this.topicCode,
    required this.topicName,
    this.initialDifficulty,
  });

  @override
  ConsumerState<QuestionListPage> createState() => _QuestionListPageState();
}

class _QuestionListPageState extends ConsumerState<QuestionListPage> {
  final List<QuestionSummary> _questions = [];
  int _page = 0;
  bool _isLast = false;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  int? _selectedDifficulty;

  @override
  void initState() {
    super.initState();
    _selectedDifficulty = widget.initialDifficulty;
    _loadPage();
  }

  Future<void> _loadPage({bool reset = false}) async {
    if (reset) {
      setState(() {
        _questions.clear();
        _page = 0;
        _isLast = false;
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final dio = ref.read(dioProvider);
      final response = await QuestionApiClient(dio).getQuestions(
        _page,
        10,
        topic: widget.topicCode,
        difficulty: _selectedDifficulty,
      );
      if (mounted) {
        setState(() {
          _questions.addAll(response.content);
          _isLast = response.last;
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = '문제 목록을 불러올 수 없어요';
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_isLast || _isLoadingMore) return;
    setState(() {
      _page++;
      _isLoadingMore = true;
    });
    await _loadPage();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        backgroundColor: AppColors.cardBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          widget.topicName,
          style: AppTextStyles.heading_20
              .copyWith(color: AppColors.textPrimary),
        ),
      ),
      body: Column(
        children: [
          // 난이도 필터 바
          _DifficultyFilterBar(
            selected: _selectedDifficulty,
            onChanged: (d) {
              _selectedDifficulty = d;
              _loadPage(reset: true);
            },
          ),

          // 문제 목록
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Text(
                          _error!,
                          style: AppTextStyles.paragraph_14
                              .copyWith(color: AppColors.textSecondary),
                        ),
                      )
                    : _questions.isEmpty
                        ? Center(
                            child: Text(
                              '해당 조건의 문제가 없어요',
                              style: AppTextStyles.paragraph_14
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          )
                        : ListView.separated(
                            padding: EdgeInsets.all(20.w),
                            itemCount:
                                _questions.length + (_isLast ? 0 : 1),
                            separatorBuilder: (_, __) => SizedBox(height: 12.h),
                            itemBuilder: (_, i) {
                              if (i == _questions.length) {
                                // "더 보기" 버튼
                                return Center(
                                  child: _isLoadingMore
                                      ? const CircularProgressIndicator()
                                      : TextButton(
                                          onPressed: _loadMore,
                                          child: Text(
                                            '더 보기',
                                            style: AppTextStyles.label_16
                                                .copyWith(
                                                    color: AppColors.brandIndigo),
                                          ),
                                        ),
                                );
                              }
                              final q = _questions[i];
                              return QuestionListCard(
                                question: q,
                                onTap: () => context.push(
                                  AppRoutes.questionDetail(q.questionUuid),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

/// 난이도 필터 바 (전체/1/2/3).
class _DifficultyFilterBar extends StatelessWidget {
  final int? selected;
  final ValueChanged<int?> onChanged;

  const _DifficultyFilterBar({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final options = <int?, String>{null: '전체', 1: '쉬움', 2: '보통', 3: '어려움'};

    return Container(
      color: AppColors.cardBg,
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
      child: Row(
        children: options.entries.map((entry) {
          final isSelected = entry.key == selected;
          return Padding(
            padding: EdgeInsets.only(right: 8.w),
            child: GestureDetector(
              onTap: () => onChanged(entry.key),
              child: Container(
                padding:
                    EdgeInsets.symmetric(horizontal: 14.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.accentLight : AppColors.cardBg,
                  borderRadius: BorderRadius.circular(999.r),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.brandIndigo
                        : AppColors.borderDefault,
                  ),
                ),
                child: Text(
                  entry.value,
                  style: AppTextStyles.tag_12.copyWith(
                    color: isSelected
                        ? AppColors.brandIndigo
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/widgets/question/question_list_card.dart lib/presentation/pages/questions/question_list_page.dart
git commit -m "feat: 문제 목록 화면 구현 (난이도 필터, 페이지네이션) #xx"
```

---

### Task 9: 문제 상세 화면 - 공용 위젯

**Files:**
- Create: `lib/presentation/widgets/question/schema_section.dart`
- Create: `lib/presentation/widgets/question/sse_loading_widget.dart`
- Create: `lib/presentation/widgets/question/execute_result_card.dart`
- Create: `lib/presentation/widgets/question/choice_card.dart`

- [ ] **Step 1: schema_section.dart 생성**

```dart
// lib/presentation/widgets/question/schema_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// 스키마 DDL 섹션. 접을 수 있는 ExpansionTile.
/// schemaDdl이 있을 때만 표시.
class SchemaSection extends StatelessWidget {
  final String? schemaDdl;
  final String? schemaSampleData;

  const SchemaSection({super.key, this.schemaDdl, this.schemaSampleData});

  @override
  Widget build(BuildContext context) {
    if (schemaDdl == null || schemaDdl!.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: EdgeInsets.symmetric(horizontal: 16.w),
          title: Text(
            '스키마 보기',
            style: AppTextStyles.paragraph_14Semibold
                .copyWith(color: AppColors.textPrimary),
          ),
          children: [
            Container(
              width: double.infinity,
              margin: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
              padding: EdgeInsets.all(12.w),
              decoration: BoxDecoration(
                color: AppColors.codeBg,
                borderRadius: BorderRadius.circular(8.r),
                border: Border(
                  left: BorderSide(
                    color: AppColors.brandIndigo,
                    width: 4.w,
                  ),
                ),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Text(
                  schemaDdl!,
                  style: TextStyle(
                    fontFamily: 'JetBrainsMono',
                    fontSize: 13.sp,
                    color: AppColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            if (schemaSampleData != null && schemaSampleData!.isNotEmpty)
              Padding(
                padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
                child: Text(
                  '샘플 데이터',
                  style: AppTextStyles.tag_12
                      .copyWith(color: AppColors.textSecondary),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: sse_loading_widget.dart 생성**

```dart
// lib/presentation/widgets/question/sse_loading_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// SSE 선택지 생성 중 로딩 상태. 스피너 + 상태 메시지.
class SseLoadingWidget extends StatelessWidget {
  final String statusMessage;

  const SseLoadingWidget({
    super.key,
    this.statusMessage = '선택지 생성 중...',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      padding: EdgeInsets.all(20.w),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 20.w,
            height: 20.w,
            child: const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.brandIndigo,
            ),
          ),
          SizedBox(width: 12.w),
          Text(
            statusMessage,
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 3: execute_result_card.dart 생성**

```dart
// lib/presentation/widgets/question/execute_result_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/execute_result.dart';

/// SQL 실행 결과 카드. 성공이면 결과 테이블, 실패이면 에러 카드.
class ExecuteResultCard extends StatelessWidget {
  final ExecuteResult result;
  final VoidCallback? onAiExplainTap;

  const ExecuteResultCard({
    super.key,
    required this.result,
    this.onAiExplainTap,
  });

  bool get _isError => result.errorCode != null && result.errorCode!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: _isError ? AppColors.errorLight : AppColors.successLight,
        borderRadius: BorderRadius.circular(8.r),
        border: Border(
          left: BorderSide(
            color: _isError ? AppColors.error : AppColors.success,
            width: 4.w,
          ),
        ),
      ),
      child: _isError ? _ErrorContent(result: result, onAiTap: onAiExplainTap)
                      : _SuccessContent(result: result),
    );
  }
}

/// 에러 결과: 에러 코드 + 메시지 + AI 해설 버튼.
class _ErrorContent extends StatelessWidget {
  final ExecuteResult result;
  final VoidCallback? onAiTap;

  const _ErrorContent({required this.result, this.onAiTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(12.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            result.errorCode ?? 'ERROR',
            style: TextStyle(
              fontFamily: 'JetBrainsMono',
              fontSize: 13.sp,
              fontWeight: FontWeight.bold,
              color: AppColors.errorText,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            result.errorMessage ?? '알 수 없는 오류',
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textPrimary),
          ),
          if (onAiTap != null) ...[
            SizedBox(height: 8.h),
            GestureDetector(
              onTap: onAiTap,
              child: Text(
                'AI에게 물어보기',
                style: AppTextStyles.paragraph_14
                    .copyWith(color: AppColors.brandIndigo),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// 성공 결과: 컬럼 헤더 + 데이터 행 테이블.
class _SuccessContent extends StatelessWidget {
  final ExecuteResult result;
  const _SuccessContent({required this.result});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(12.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${result.rowCount ?? result.rows.length}행 반환'
            '${result.elapsedMs != null ? ' · ${result.elapsedMs}ms' : ''}',
            style: AppTextStyles.tag_12
                .copyWith(color: AppColors.successText),
          ),
          SizedBox(height: 8.h),
          if (result.columns.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowHeight: 32.h,
                dataRowMinHeight: 32.h,
                dataRowMaxHeight: 36.h,
                columnSpacing: 16.w,
                headingTextStyle: TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
                dataTextStyle: TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13.sp,
                  color: AppColors.textPrimary,
                ),
                columns: result.columns
                    .map((col) => DataColumn(label: Text(col)))
                    .toList(),
                rows: result.rows.asMap().entries.map((entry) {
                  final isEven = entry.key % 2 == 0;
                  return DataRow(
                    color: WidgetStateProperty.all(
                      isEven ? AppColors.zebraRow : AppColors.cardBg,
                    ),
                    cells: entry.value
                        .map((cell) => DataCell(Text(cell?.toString() ?? 'NULL')))
                        .toList(),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: choice_card.dart 생성**

```dart
// lib/presentation/widgets/question/choice_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/choice_item.dart';

/// 개별 선택지 카드. kind="SQL"이면 코드 블록, kind="TEXT"이면 텍스트.
/// isSelected=true이면 인디고 테두리 강조.
class ChoiceCard extends StatelessWidget {
  final ChoiceItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const ChoiceCard({
    super.key,
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentLight : AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected ? AppColors.brandIndigo : AppColors.borderDefault,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 선택지 키 (A/B/C/D) - 라디오 스타일
            Container(
              width: 22.w,
              height: 22.w,
              margin: EdgeInsets.only(right: 10.w, top: 1.h),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.brandIndigo : AppColors.cardBg,
                border: Border.all(
                  color: isSelected
                      ? AppColors.brandIndigo
                      : AppColors.borderMuted,
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  item.key,
                  style: AppTextStyles.tag_10Bold.copyWith(
                    color:
                        isSelected ? AppColors.cardBg : AppColors.textSecondary,
                  ),
                ),
              ),
            ),

            // 선택지 내용
            Expanded(
              child: item.kind == 'SQL'
                  ? _SqlBody(sql: item.body, isSelected: isSelected)
                  : Text(
                      item.body,
                      style: AppTextStyles.paragraph_14
                          .copyWith(color: AppColors.textPrimary),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SqlBody extends StatelessWidget {
  final String sql;
  final bool isSelected;

  const _SqlBody({required this.sql, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: AppColors.codeBg,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        sql,
        style: TextStyle(
          fontFamily: 'JetBrainsMono',
          fontSize: 13.sp,
          color: AppColors.textPrimary,
          height: 1.5,
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: 커밋**

```bash
git add lib/presentation/widgets/question/
git commit -m "feat: 문제 상세 공용 위젯 추가 (SchemaSection, SseLoading, ExecuteResultCard, ChoiceCard) #xx"
```

---

### Task 10: 문제 상세 화면 구현

**Files:**
- Modify: `lib/presentation/pages/questions/question_detail_page.dart`
- Create: `lib/presentation/widgets/question/ai_explain_sheet.dart`

- [ ] **Step 1: ai_explain_sheet.dart 생성**

```dart
// lib/presentation/widgets/question/ai_explain_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/sources/ai_api.dart';
import '../../../presentation/providers/member_store.dart';

/// AI 해설 바텀시트. questionUuid와 요청 payload를 받아 AI 해설을 표시.
/// isErrorExplain=true: explain-error 엔드포인트
/// isErrorExplain=false: diff-explain 엔드포인트
class AiExplainSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> payload;
  final bool isErrorExplain;

  const AiExplainSheet({
    super.key,
    required this.payload,
    required this.isErrorExplain,
  });

  static Future<void> show(
    BuildContext context, {
    required Map<String, dynamic> payload,
    required bool isErrorExplain,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AiExplainSheet(
        payload: payload,
        isErrorExplain: isErrorExplain,
      ),
    );
  }

  @override
  ConsumerState<AiExplainSheet> createState() => _AiExplainSheetState();
}

class _AiExplainSheetState extends ConsumerState<AiExplainSheet> {
  String? _text;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchExplain();
  }

  Future<void> _fetchExplain() async {
    try {
      final dio = ref.read(dioProvider);
      final memberUuid = ref.read(memberStoreProvider).valueOrNull ?? '';
      final client = AiApiClient(dio);
      final result = widget.isErrorExplain
          ? await client.explainError(memberUuid, widget.payload)
          : await client.diffExplain(memberUuid, widget.payload);
      if (mounted) setState(() { _text = result.text; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'AI 해설을 불러올 수 없어요'; _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16.r)),
          ),
          child: Column(
            children: [
              // 드래그 핸들
              Container(
                margin: EdgeInsets.symmetric(vertical: 12.h),
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: AppColors.borderMuted,
                  borderRadius: BorderRadius.circular(999.r),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: Text(
                  'AI 해설',
                  style: AppTextStyles.heading_20
                      .copyWith(color: AppColors.textPrimary),
                ),
              ),
              SizedBox(height: 12.h),
              const Divider(color: AppColors.borderDefault, height: 1),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? Center(
                            child: Text(
                              _error!,
                              style: AppTextStyles.paragraph_14
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          )
                        : SingleChildScrollView(
                            controller: scrollController,
                            padding: EdgeInsets.all(20.w),
                            child: Text(
                              _text ?? '',
                              style: AppTextStyles.paragraph_14
                                  .copyWith(color: AppColors.textPrimary),
                            ),
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}
```

- [ ] **Step 2: question_detail_page.dart 전체 구현**

```dart
// lib/presentation/pages/questions/question_detail_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/question_detail.dart';
import '../../../data/models/question/sse_event.dart';
import '../../../presentation/providers/question_providers.dart';
import '../../../router/app_routes.dart';
import '../../widgets/question/ai_explain_sheet.dart';
import '../../widgets/question/choice_card.dart';
import '../../widgets/question/execute_result_card.dart';
import '../../widgets/question/schema_section.dart';
import '../../widgets/question/sse_loading_widget.dart';

/// 문제 상세 + 풀기 화면 (풀스크린).
/// 진입 시 GET /questions/{uuid}, 선택지 없으면 SSE 자동 시작.
class QuestionDetailPage extends ConsumerStatefulWidget {
  final String questionUuid;

  const QuestionDetailPage({super.key, required this.questionUuid});

  @override
  ConsumerState<QuestionDetailPage> createState() => _QuestionDetailPageState();
}

class _QuestionDetailPageState extends ConsumerState<QuestionDetailPage> {
  bool _sseInitialized = false;

  @override
  Widget build(BuildContext context) {
    final detailAsync =
        ref.watch(questionDetailProvider(widget.questionUuid));
    final interaction =
        ref.watch(questionInteractionProvider(widget.questionUuid));
    final notifier =
        ref.read(questionInteractionProvider(widget.questionUuid).notifier);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        backgroundColor: AppColors.cardBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: detailAsync.whenOrNull(
          data: (q) => Text(
            q.topicName ?? '문제 풀기',
            style: AppTextStyles.heading_20
                .copyWith(color: AppColors.textPrimary),
          ),
        ) ?? const SizedBox.shrink(),
      ),
      body: detailAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(
            '문제를 불러올 수 없어요',
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textSecondary),
          ),
        ),
        data: (question) {
          // 최초 1회: 선택지 초기화 또는 SSE 시작
          if (!_sseInitialized) {
            _sseInitialized = true;
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _initChoices(question, notifier);
            });
          }

          return _QuestionDetailBody(
            question: question,
            interaction: interaction,
            notifier: notifier,
            questionUuid: widget.questionUuid,
          );
        },
      ),
    );
  }

  /// 선택지 세트 초기화. OK 세트가 있으면 바로 사용, 없으면 SSE 생성.
  void _initChoices(QuestionDetail q, dynamic notifier) {
    final okSet = q.choiceSets
        .where((cs) => cs.status == 'OK')
        .toList();
    if (okSet.isNotEmpty) {
      notifier.useExistingChoiceSet(
        okSet.first.choiceSetUuid,
        okSet.first.items,
      );
    } else {
      notifier.startSseGeneration();
    }
  }
}

/// 문제 본문 스크롤 영역 + 하단 제출 버튼.
class _QuestionDetailBody extends ConsumerWidget {
  final QuestionDetail question;
  final QuestionInteractionState interaction;
  final QuestionInteractionNotifier notifier;
  final String questionUuid;

  const _QuestionDetailBody({
    required this.question,
    required this.interaction,
    required this.notifier,
    required this.questionUuid,
  });

  bool get _isExecutable => question.executionMode == 'EXECUTABLE';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 난이도 + 실행 모드 뱃지
                _HeaderSection(question: question),

                // 스키마 DDL (EXECUTABLE 모드에서만 표시)
                if (_isExecutable)
                  SchemaSection(
                    schemaDdl: question.schemaDdl,
                    schemaSampleData: question.schemaSampleData,
                  ),

                // 문제 지문
                _StemSection(stem: question.stem),

                // 선택지 영역
                _ChoicesSection(
                  interaction: interaction,
                  notifier: notifier,
                  question: question,
                  questionUuid: questionUuid,
                  isExecutable: _isExecutable,
                  onBuildContext: context,
                ),

                // 실행 결과 (선택지 클릭 후 EXECUTABLE 모드)
                if (interaction.isExecuting)
                  Padding(
                    padding: EdgeInsets.symmetric(
                        horizontal: 20.w, vertical: 8.h),
                    child: const LinearProgressIndicator(
                      color: AppColors.brandIndigo,
                    ),
                  ),
                if (interaction.currentExecuteResult != null)
                  ExecuteResultCard(
                    result: interaction.currentExecuteResult!,
                    onAiExplainTap: interaction.currentExecuteResult!.errorCode != null
                        ? () {
                            final selectedKey = interaction.selectedChoiceKey;
                            final selectedChoice = interaction.activeChoices
                                .where((c) => c.key == selectedKey)
                                .firstOrNull;
                            AiExplainSheet.show(
                              context,
                              payload: {
                                'questionUuid': questionUuid,
                                'sql': selectedChoice?.body ?? '',
                                'errorMessage': interaction.currentExecuteResult!.errorMessage ?? '',
                              },
                              isErrorExplain: true,
                            );
                          }
                        : null,
                  ),

                SizedBox(height: 80.h), // 하단 버튼 여백
              ],
            ),
          ),
        ),

        // 제출 버튼
        _SubmitBar(
          interaction: interaction,
          onSubmit: () => _handleSubmit(context, ref, notifier),
        ),
      ],
    );
  }

  Future<void> _handleSubmit(
    BuildContext context,
    WidgetRef ref,
    QuestionInteractionNotifier notifier,
  ) async {
    final result = await notifier.submit();
    if (!context.mounted) return;
    if (result != null) {
      context.push(
        AppRoutes.questionResult(questionUuid),
        extra: result,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.toastBg,
          content: Text(
            '제출에 실패했어요. 다시 시도해 주세요.',
            style: AppTextStyles.paragraph_14.copyWith(color: Colors.white),
          ),
        ),
      );
    }
  }
}

class _HeaderSection extends StatelessWidget {
  final QuestionDetail question;
  const _HeaderSection({required this.question});

  @override
  Widget build(BuildContext context) {
    final difficulty = question.difficulty ?? 1;
    final isExecutable = question.executionMode == 'EXECUTABLE';

    return Padding(
      padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 8.h),
      child: Row(
        children: [
          // 난이도 별
          Row(
            children: List.generate(3, (i) {
              return Icon(
                Icons.star,
                size: 16.sp,
                color: i < difficulty ? AppColors.warning : AppColors.borderDefault,
              );
            }),
          ),
          SizedBox(width: 8.w),
          // 실행 모드 뱃지
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
            decoration: BoxDecoration(
              color: isExecutable ? AppColors.accentLight : AppColors.borderDefault,
              borderRadius: BorderRadius.circular(999.r),
            ),
            child: Text(
              isExecutable ? 'SQL 실행' : '개념 문제',
              style: AppTextStyles.tag_12.copyWith(
                color: isExecutable ? AppColors.brandIndigo : AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StemSection extends StatelessWidget {
  final String stem;
  const _StemSection({required this.stem});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Text(
        stem,
        style: AppTextStyles.paragraph_14
            .copyWith(color: AppColors.textPrimary),
      ),
    );
  }
}

class _ChoicesSection extends StatelessWidget {
  final QuestionInteractionState interaction;
  final QuestionInteractionNotifier notifier;
  final QuestionDetail question;
  final String questionUuid;
  final bool isExecutable;
  final BuildContext onBuildContext;

  const _ChoicesSection({
    required this.interaction,
    required this.notifier,
    required this.question,
    required this.questionUuid,
    required this.isExecutable,
    required this.onBuildContext,
  });

  @override
  Widget build(BuildContext context) {
    // SSE 로딩 중
    if (interaction.isGeneratingChoices) {
      return SseLoadingWidget(
        statusMessage: interaction.sseStatusMessage ?? '선택지 생성 중...',
      );
    }

    // SSE 에러
    if (interaction.sseError != null) {
      return _SseErrorSection(
        error: interaction.sseError!,
        onRetry: interaction.sseError!.retryable
            ? () => notifier.startSseGeneration()
            : null,
      );
    }

    // 선택지 목록
    if (interaction.activeChoices.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: interaction.activeChoices.map((item) {
        return ChoiceCard(
          item: item,
          isSelected: interaction.selectedChoiceKey == item.key,
          onTap: () => notifier.selectChoice(
            choiceKey: item.key,
            sql: item.kind == 'SQL' ? item.body : null,
            isExecutable: isExecutable,
          ),
        );
      }).toList(),
    );
  }
}

class _SseErrorSection extends StatelessWidget {
  final SseErrorEvent error;
  final VoidCallback? onRetry;

  const _SseErrorSection({required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColors.errorLight,
        borderRadius: BorderRadius.circular(8.r),
        border: Border(left: BorderSide(color: AppColors.error, width: 4.w)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '선택지 생성에 실패했어요',
            style: AppTextStyles.paragraph_14Semibold
                .copyWith(color: AppColors.errorText),
          ),
          if (onRetry != null) ...[
            SizedBox(height: 8.h),
            GestureDetector(
              onTap: onRetry,
              child: Text(
                '다시 시도',
                style: AppTextStyles.paragraph_14
                    .copyWith(color: AppColors.brandIndigo),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _SubmitBar extends StatelessWidget {
  final QuestionInteractionState interaction;
  final VoidCallback onSubmit;

  const _SubmitBar({required this.interaction, required this.onSubmit});

  bool get _canSubmit =>
      interaction.selectedChoiceKey != null &&
      interaction.activeChoiceSetId != null &&
      !interaction.isSubmitting;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border(top: BorderSide(color: AppColors.borderDefault)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 44.h,
        child: ElevatedButton(
          onPressed: _canSubmit ? onSubmit : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brandIndigo,
            disabledBackgroundColor: AppColors.borderDefault,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          child: interaction.isSubmitting
              ? const CircularProgressIndicator(color: Colors.white)
              : Text(
                  '답안 제출하기',
                  style: AppTextStyles.label_16.copyWith(color: Colors.white),
                ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/widgets/question/ai_explain_sheet.dart lib/presentation/pages/questions/question_detail_page.dart
git commit -m "feat: 문제 상세 풀기 화면 구현 (SSE 선택지 생성, SQL 실행, 제출) #xx"
```

---

### Task 11: 결과 피드백 화면 구현

**Files:**
- Modify: `lib/presentation/pages/result/result_page.dart`
- Create: `lib/presentation/widgets/result/similar_questions_section.dart`

- [ ] **Step 1: similar_questions_section.dart 생성**

```dart
// lib/presentation/widgets/result/similar_questions_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/models/ai/similar_question.dart';
import '../../../data/sources/ai_api.dart';
import '../../../router/app_routes.dart';

/// 유사 문제 리스트 섹션. 화면 진입 후 비동기 로드.
class SimilarQuestionsSection extends ConsumerStatefulWidget {
  final String questionUuid;

  const SimilarQuestionsSection({super.key, required this.questionUuid});

  @override
  ConsumerState<SimilarQuestionsSection> createState() =>
      _SimilarQuestionsSectionState();
}

class _SimilarQuestionsSectionState
    extends ConsumerState<SimilarQuestionsSection> {
  List<SimilarQuestion>? _questions;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dio = ref.read(dioProvider);
      final result =
          await AiApiClient(dio).getSimilar(widget.questionUuid, 3);
      if (mounted) setState(() => _questions = result);
    } catch (_) {
      // 유사 문제는 옵션 — 실패 시 섹션 미표시
      if (mounted) setState(() => _questions = []);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_questions == null) {
      // 로딩 중
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 16.h),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    if (_questions!.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 8.h),
          child: Text(
            '유사 문제',
            style: AppTextStyles.subHeading_18
                .copyWith(color: AppColors.textPrimary),
          ),
        ),
        ..._questions!.map((q) => _SimilarCard(question: q)),
      ],
    );
  }
}

class _SimilarCard extends StatelessWidget {
  final SimilarQuestion question;
  const _SimilarCard({required this.question});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () =>
          context.push(AppRoutes.questionDetail(question.questionUuid)),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (question.topicName != null)
                    Text(
                      question.topicName!,
                      style: AppTextStyles.tag_12
                          .copyWith(color: AppColors.brandIndigo),
                    ),
                  SizedBox(height: 4.h),
                  Text(
                    question.stem ?? '문제 보기',
                    style: AppTextStyles.paragraph_14
                        .copyWith(color: AppColors.textPrimary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.textCaption, size: 20.sp),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: result_page.dart 전체 구현**

```dart
// lib/presentation/pages/result/result_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/submit_result.dart';
import '../../widgets/question/ai_explain_sheet.dart';
import '../../widgets/question/execute_result_card.dart';
import '../../widgets/result/similar_questions_section.dart';

/// 정답/오답 피드백 화면.
/// GoRouterState.extra로 SubmitResult를 받아 렌더링. API 재호출 없음.
class ResultPage extends ConsumerWidget {
  final Object? extra;

  const ResultPage({super.key, this.extra});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = extra is SubmitResult ? extra as SubmitResult : null;

    if (result == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.close, color: AppColors.textPrimary),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text(
            '결과를 불러올 수 없어요',
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    // questionUuid는 GoRouterState pathParameters에서 꺼낸다.
    // extra가 아닌 route param에서 가져오기 위해 GoRouter.of로 접근.
    final goRouterState = GoRouterState.of(context);
    final questionUuid = goRouterState.pathParameters['questionUuid'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: AppBar(
        backgroundColor: AppColors.cardBg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textPrimary),
          onPressed: () => context.go('/home'),
        ),
        title: Text(
          result.isCorrect ? '정답' : '오답',
          style: AppTextStyles.heading_20.copyWith(
            color: result.isCorrect ? AppColors.success : AppColors.error,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 정답/오답 헤더
            _ResultHeader(result: result),

            // 비교 섹션 (EXECUTABLE: SQL + 실행 결과, CONCEPT_ONLY: 텍스트)
            _ComparisonSection(result: result),

            // 해설 (rationale)
            if (result.rationale != null && result.rationale!.isNotEmpty)
              _RationaleSection(rationale: result.rationale!),

            // 오답일 때만 AI 해설 버튼
            if (!result.isCorrect && questionUuid.isNotEmpty)
              _AiDiffExplainButton(
                questionUuid: questionUuid,
                selectedKey: result.correctKey ?? '',
              ),

            // 유사 문제 (비동기 로드)
            if (questionUuid.isNotEmpty)
              SimilarQuestionsSection(questionUuid: questionUuid),

            SizedBox(height: 32.h),
          ],
        ),
      ),
    );
  }
}

class _ResultHeader extends StatelessWidget {
  final SubmitResult result;
  const _ResultHeader({required this.result});

  @override
  Widget build(BuildContext context) {
    final isCorrect = result.isCorrect;
    return Container(
      margin: EdgeInsets.all(20.w),
      padding: EdgeInsets.all(20.w),
      decoration: BoxDecoration(
        color: isCorrect ? AppColors.successLight : AppColors.errorLight,
        borderRadius: BorderRadius.circular(12.r),
        border: Border(
          left: BorderSide(
            color: isCorrect ? AppColors.success : AppColors.error,
            width: 4.w,
          ),
        ),
      ),
      child: Text(
        isCorrect
            ? '정답입니다! 잘 하셨어요.'
            : '아쉽지만 틀렸어요. 정답은 ${result.correctKey}입니다.',
        style: AppTextStyles.label_16.copyWith(
          color: isCorrect ? AppColors.successText : AppColors.errorText,
        ),
      ),
    );
  }
}

class _ComparisonSection extends StatelessWidget {
  final SubmitResult result;
  const _ComparisonSection({required this.result});

  @override
  Widget build(BuildContext context) {
    // EXECUTABLE 모드: SQL + 실행 결과 비교
    if (result.correctResult != null || result.correctSql != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20.w, 4.h, 20.w, 8.h),
            child: Text(
              '비교',
              style: AppTextStyles.subHeading_18
                  .copyWith(color: AppColors.textPrimary),
            ),
          ),
          // 내가 선택한 SQL (오답일 때만)
          if (!result.isCorrect && result.selectedSql != null)
            _SqlBlock(
              label: '내가 선택한 SQL',
              sql: result.selectedSql!,
              labelColor: AppColors.errorText,
            ),
          // 정답 SQL
          if (result.correctSql != null)
            _SqlBlock(
              label: '정답 SQL',
              sql: result.correctSql!,
              labelColor: AppColors.successText,
            ),
          // 정답 실행 결과
          if (result.correctResult != null)
            ExecuteResultCard(result: result.correctResult!),
        ],
      );
    }

    // CONCEPT_ONLY 모드: 텍스트 비교 (correctKey만 표시)
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      child: Text(
        '정답: ${result.correctKey ?? '-'}',
        style: AppTextStyles.label_16.copyWith(color: AppColors.textPrimary),
      ),
    );
  }
}

class _SqlBlock extends StatelessWidget {
  final String label;
  final String sql;
  final Color labelColor;

  const _SqlBlock({
    required this.label,
    required this.sql,
    required this.labelColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTextStyles.tag_12.copyWith(color: labelColor),
          ),
          SizedBox(height: 4.h),
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(12.w),
            decoration: BoxDecoration(
              color: AppColors.codeBg,
              borderRadius: BorderRadius.circular(8.r),
              border: Border(
                left: BorderSide(color: labelColor, width: 4.w),
              ),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Text(
                sql,
                style: TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13.sp,
                  color: AppColors.textPrimary,
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RationaleSection extends StatelessWidget {
  final String rationale;
  const _RationaleSection({required this.rationale});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 0),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '해설',
            style: AppTextStyles.subHeading_18
                .copyWith(color: AppColors.textPrimary),
          ),
          SizedBox(height: 8.h),
          Text(
            rationale,
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}

class _AiDiffExplainButton extends StatelessWidget {
  final String questionUuid;
  final String selectedKey;

  const _AiDiffExplainButton({
    required this.questionUuid,
    required this.selectedKey,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 0),
      child: SizedBox(
        width: double.infinity,
        height: 44.h,
        child: OutlinedButton(
          onPressed: () {
            AiExplainSheet.show(
              context,
              payload: {
                'questionUuid': questionUuid,
                'selectedChoiceKey': selectedKey,
              },
              isErrorExplain: false,
            );
          },
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.brandIndigo),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          child: Text(
            'AI에게 자세히 물어보기',
            style: AppTextStyles.label_16
                .copyWith(color: AppColors.brandIndigo),
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/widgets/result/ lib/presentation/pages/result/result_page.dart
git commit -m "feat: 정답/오답 피드백 화면 구현 (SQL 비교, AI 해설, 유사 문제) #xx"
```

---

## Self-Review

### 1. Spec Coverage

| PRD 요구사항 | 대응 Task |
|---|---|
| GET /meta/topics → 토픽 그리드 | Task 2, 7 |
| GET /questions?page&topic&difficulty | Task 1, 3, 8 |
| GET /questions/{uuid} → QuestionDetail | Task 1, 3, 10 |
| choiceSets OK → 바로 표시 | Task 5 (useExistingChoiceSet) |
| choiceSets 없음 → SSE 생성 | Task 4, 5 (startSseGeneration) |
| SSE status/complete/error 이벤트 | Task 4 |
| EXECUTABLE: 선택지 클릭 → POST /execute | Task 5 (selectChoice) |
| 실행 캐시 (같은 SQL 재클릭) | Task 5 (executeCache) |
| 실행 에러 → AI에게 물어보기 | Task 9, 10 |
| POST /submit → ResultPage navigate | Task 5, 10 |
| ResultPage: isCorrect 헤더 | Task 11 |
| EXECUTABLE: SQL 비교 + 실행 결과 | Task 11 |
| CONCEPT_ONLY: 텍스트 선택지 비교 | Task 11 |
| rationale 해설 | Task 11 |
| 오답 → AI diff-explain | Task 10 (AiExplainSheet), 11 |
| GET /ai/similar (비동기 로드) | Task 11 (SimilarQuestionsSection) |

### 2. Type Consistency Check

- `ChoiceItem.key` — Task 1 정의, Task 10 `item.key` 참조 ✓
- `ChoiceItem.kind` — Task 1 정의, Task 9 `item.kind == 'SQL'` 참조 ✓
- `ChoiceSetSummary.choiceSetUuid` — Task 1 정의, Task 5 `okSet.first.choiceSetUuid` 참조 ✓
- `QuestionInteractionState.activeChoiceSetId` — Task 5 정의, Task 10 `_canSubmit` 참조 ✓
- `SubmitResult` — Task 1 정의, Task 11 `extra as SubmitResult` 참조 ✓
- `AiExplainSheet.isErrorExplain` — Task 10 정의, Task 10·11 호출 ✓
- `SseErrorEvent` — Task 1 정의, Task 5 `sseError` 타입, Task 10 `interaction.sseError!.retryable` ✓

### 3. 누락 없음 확인

- SSE `retryable=false`인 경우 재시도 버튼 없음 → `_SseErrorSection.onRetry = null` ✓
- 제출 버튼 비활성화 조건: selectedChoiceKey=null OR activeChoiceSetId=null → `_canSubmit` ✓
- 문제 목록 "더 보기" 버튼: `_isLast=true`이면 미표시 ✓
- 유사 문제 실패 시 graceful 숨김 → `_questions = []` ✓
