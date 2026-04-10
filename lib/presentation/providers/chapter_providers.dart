import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/question/submit_result.dart';
import '../../data/sources/question_api.dart';

// ─── 데이터 모델 ────────────────────────────────────────────────

/// 챕터 내 문제 하나의 제출 결과.
class ChapterResult {
  final String questionUuid;
  final bool isCorrect;
  final int durationMs;

  const ChapterResult({
    required this.questionUuid,
    required this.isCorrect,
    required this.durationMs,
  });
}

/// 챕터 완료 후 PracticeResultPage에 넘기는 요약.
class ChapterSummary {
  final String topicName;
  final List<ChapterResult> results;
  final int totalDurationMs;

  const ChapterSummary({
    required this.topicName,
    required this.results,
    required this.totalDurationMs,
  });
}

// ─── 상태 ────────────────────────────────────────────────────────

class ChapterState {
  /// API에서 로드된 UUID 목록.
  final List<String> questionUuids;

  /// 현재 문제 인덱스 (0-based).
  final int currentIndex;

  /// 제출 완료된 결과 누적 목록.
  final List<ChapterResult> results;

  /// 초기 목록 로드 중 여부.
  final bool isLoadingList;

  /// 목록 로드 에러 메시지 (null = 정상).
  final String? listError;

  /// 현재 문제 제출 결과 (피드백 표시용, 제출 전 null).
  final SubmitResult? lastSubmitResult;

  /// 현재 문제 제출 완료 여부.
  final bool isAnswered;

  /// AI 해설 버튼에 사용할 선택 키 (제출 시 저장).
  final String? lastSelectedKey;

  const ChapterState({
    this.questionUuids = const [],
    this.currentIndex = 0,
    this.results = const [],
    this.isLoadingList = true,
    this.listError,
    this.lastSubmitResult,
    this.isAnswered = false,
    this.lastSelectedKey,
  });

  /// 마지막 문제 여부.
  bool get isLastQuestion =>
      questionUuids.isNotEmpty && currentIndex == questionUuids.length - 1;

  ChapterState copyWith({
    List<String>? questionUuids,
    int? currentIndex,
    List<ChapterResult>? results,
    bool? isLoadingList,
    String? listError,
    bool clearError = false,
    SubmitResult? lastSubmitResult,
    bool clearSubmitResult = false,
    bool? isAnswered,
    String? lastSelectedKey,
    bool clearSelectedKey = false,
  }) {
    return ChapterState(
      questionUuids: questionUuids ?? this.questionUuids,
      currentIndex: currentIndex ?? this.currentIndex,
      results: results ?? this.results,
      isLoadingList: isLoadingList ?? this.isLoadingList,
      listError: clearError ? null : (listError ?? this.listError),
      lastSubmitResult: clearSubmitResult
          ? null
          : (lastSubmitResult ?? this.lastSubmitResult),
      isAnswered: isAnswered ?? this.isAnswered,
      lastSelectedKey:
          clearSelectedKey ? null : (lastSelectedKey ?? this.lastSelectedKey),
    );
  }
}

// ─── Notifier ────────────────────────────────────────────────────

class ChapterNotifier extends StateNotifier<ChapterState> {
  final QuestionApiClient _questionApi;

  ChapterNotifier(this._questionApi) : super(const ChapterState());

  /// 토픽 코드로 문제 UUID 목록 로드 (page=0, size=10).
  Future<void> loadQuestions(String topicCode) async {
    state = state.copyWith(isLoadingList: true, clearError: true);
    try {
      final response = await _questionApi.getQuestions(
        0,
        10,
        topic: topicCode,
      );
      final uuids = response.content.map((q) => q.questionUuid).toList();
      state = state.copyWith(
        questionUuids: uuids,
        isLoadingList: false,
      );
    } catch (_) {
      state = state.copyWith(
        isLoadingList: false,
        listError: '문제를 불러올 수 없어요',
      );
    }
  }

  /// 현재 문제 제출 완료 처리 — results에 추가, 피드백 상태 설정.
  void onSubmitted(
    SubmitResult result,
    int durationMs,
    String selectedKey,
  ) {
    final uuid = state.questionUuids[state.currentIndex];
    final newResults = [
      ...state.results,
      ChapterResult(
        questionUuid: uuid,
        isCorrect: result.isCorrect,
        durationMs: durationMs,
      ),
    ];
    state = state.copyWith(
      results: newResults,
      lastSubmitResult: result,
      isAnswered: true,
      lastSelectedKey: selectedKey,
    );
  }

  /// 다음 문제로 이동 — currentIndex 증가, 피드백 초기화.
  void nextQuestion() {
    state = state.copyWith(
      currentIndex: state.currentIndex + 1,
      clearSubmitResult: true,
      isAnswered: false,
      clearSelectedKey: true,
    );
  }
}

/// topicCode별 ChapterNotifier provider. autoDispose로 이탈 시 해제.
final chapterProvider = StateNotifierProvider.autoDispose
    .family<ChapterNotifier, ChapterState, String>(
  (ref, topicCode) {
    final dio = ref.read(dioProvider);
    return ChapterNotifier(QuestionApiClient(dio));
  },
);
