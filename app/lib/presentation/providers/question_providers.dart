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
    extends StateNotifier<QuestionInteractionState> {
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
      case final SseErrorEvent err:
        state = state.copyWith(
          isGeneratingChoices: false,
          sseError: err,
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
