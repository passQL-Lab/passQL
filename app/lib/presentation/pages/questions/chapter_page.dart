import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/question_detail.dart';
import '../../../data/models/question/sse_event.dart';
import '../../../presentation/providers/chapter_providers.dart';
import '../../../presentation/providers/question_providers.dart';
import '../../widgets/chapter/chapter_app_bar.dart';
import '../../widgets/chapter/chapter_feedback_bar.dart';
import '../../widgets/question/ai_explain_sheet.dart';
import '../../widgets/question/choice_card.dart';
import '../../widgets/question/execute_result_card.dart';
import '../../widgets/question/schema_section.dart';
import '../../widgets/question/sse_loading_widget.dart';

/// 챕터 플로우 메인 페이지 (풀스크린).
///
/// 토픽에서 size=10 문제를 순서대로 풀고, 마지막 제출 후 PracticeResultPage로 이동.
class ChapterPage extends ConsumerStatefulWidget {
  final String topicCode;
  final String topicName;

  const ChapterPage({
    super.key,
    required this.topicCode,
    required this.topicName,
  });

  @override
  ConsumerState<ChapterPage> createState() => _ChapterPageState();
}

class _ChapterPageState extends ConsumerState<ChapterPage> {
  /// SSE를 이미 초기화한 questionUuid Set — 중복 초기화 방지.
  final Set<String> _initializedUuids = {};

  /// 현재 문제 진입 시각 — 제출 소요시간 계산에 사용.
  DateTime _questionStartTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    // 첫 프레임 이후 문제 목록 로드
    Future.microtask(() {
      if (!mounted) return;
      ref
          .read(chapterProvider(widget.topicCode).notifier)
          .loadQuestions(widget.topicCode);
    });
  }

  /// 현재 문제의 선택지를 초기화 — OK 세트 있으면 재사용, 없으면 SSE 시작.
  void _initChoicesIfNeeded(String uuid, QuestionDetail question) {
    if (_initializedUuids.contains(uuid)) return;
    _initializedUuids.add(uuid);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final notifier = ref.read(questionInteractionProvider(uuid).notifier);
      final okSet = question.choiceSets
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
    });
  }

  /// 제출 처리 — 결과 받으면 ChapterNotifier에 전달, 실패 시 스낵바.
  Future<void> _handleSubmit(
    String currentUuid,
    QuestionInteractionNotifier interactionNotifier,
    ChapterNotifier chapterNotifier,
  ) async {
    // 선택 키 미리 저장 (제출 후 interaction state가 바뀔 수 있으므로)
    final selectedKey =
        ref.read(questionInteractionProvider(currentUuid)).selectedChoiceKey ??
            '';
    final startTime = _questionStartTime;

    final result = await interactionNotifier.submit();
    if (!mounted) return;

    if (result != null) {
      final durationMs =
          DateTime.now().difference(startTime).inMilliseconds;
      chapterNotifier.onSubmitted(result, durationMs, selectedKey);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.toastBg,
          content: Text(
            '제출에 실패했어요. 다시 시도해 주세요.',
            style: AppTextStyles.paragraph_14
                .copyWith(color: Colors.white),
          ),
        ),
      );
    }
  }

  /// 챕터 완료 — PracticeResultPage로 이동.
  void _navigateToResult(List<ChapterResult> results) {
    final totalDurationMs = results.fold(0, (sum, r) => sum + r.durationMs);
    final summary = ChapterSummary(
      topicName: widget.topicName,
      results: results,
      totalDurationMs: totalDurationMs,
    );
    // sessionId는 라우트 파라미터 충족용으로만 사용 (내부에서 참조 안 함)
    final sessionId = 'chapter-${const Uuid().v4()}';
    context.go('/practice/$sessionId/result', extra: summary);
  }

  @override
  Widget build(BuildContext context) {
    final chapter = ref.watch(chapterProvider(widget.topicCode));
    final chapterNotifier =
        ref.read(chapterProvider(widget.topicCode).notifier);

    // 인덱스 변경 시 타이머 리셋
    ref.listen<ChapterState>(chapterProvider(widget.topicCode), (prev, next) {
      if ((prev?.currentIndex ?? -1) != next.currentIndex) {
        _questionStartTime = DateTime.now();
      }
    });

    // 로딩 중
    if (chapter.isLoadingList) {
      return _LoadingScaffold(topicName: widget.topicName);
    }

    // 에러 또는 빈 목록
    if (chapter.listError != null || chapter.questionUuids.isEmpty) {
      return _ErrorScaffold(
        topicName: widget.topicName,
        message: chapter.listError ?? '문제가 없어요',
      );
    }

    final currentUuid = chapter.questionUuids[chapter.currentIndex];
    final detailAsync = ref.watch(questionDetailProvider(currentUuid));
    final interaction = ref.watch(questionInteractionProvider(currentUuid));
    final interactionNotifier =
        ref.read(questionInteractionProvider(currentUuid).notifier);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: ChapterAppBar(
        topicName: widget.topicName,
        currentIndex: chapter.currentIndex,
        total: chapter.questionUuids.length,
        isAnswered: chapter.isAnswered,
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
          // 최초 1회 선택지 초기화
          _initChoicesIfNeeded(currentUuid, question);

          return Column(
            children: [
              // 스크롤 가능한 문제 본문
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HeaderSection(question: question),
                      if (question.executionMode == 'EXECUTABLE')
                        SchemaSection(
                          schemaDdl: question.schemaDdl,
                          schemaSampleData: question.schemaSampleData,
                        ),
                      _StemSection(stem: question.stem),
                      _ChoicesSection(
                        interaction: interaction,
                        notifier: interactionNotifier,
                        question: question,
                        questionUuid: currentUuid,
                        isExecutable: question.executionMode == 'EXECUTABLE',
                        buildContext: context,
                      ),
                      // SQL 실행 중 로딩
                      if (interaction.isExecuting)
                        Padding(
                          padding: EdgeInsets.symmetric(
                              horizontal: 20.w, vertical: 8.h),
                          child: const LinearProgressIndicator(
                            color: AppColors.brandIndigo,
                          ),
                        ),
                      // SQL 실행 결과
                      if (interaction.currentExecuteResult != null)
                        ExecuteResultCard(
                          result: interaction.currentExecuteResult!,
                          onAiExplainTap: interaction
                                      .currentExecuteResult!.errorCode
                                      ?.isNotEmpty ==
                                  true
                              ? () {
                                  final selectedChoice = interaction
                                      .activeChoices
                                      .where((c) =>
                                          c.key ==
                                          interaction.selectedChoiceKey)
                                      .firstOrNull;
                                  AiExplainSheet.show(
                                    context,
                                    payload: {
                                      'questionUuid': currentUuid,
                                      'sql': selectedChoice?.body ?? '',
                                      'errorMessage': interaction
                                              .currentExecuteResult!
                                              .errorMessage ??
                                          '',
                                    },
                                    isErrorExplain: true,
                                  );
                                }
                              : null,
                        ),
                      SizedBox(height: 80.h),
                    ],
                  ),
                ),
              ),

              // 하단 바 — 미제출: 제출 버튼 / 제출 완료: 피드백 바
              if (!chapter.isAnswered)
                _ChapterSubmitBar(
                  interaction: interaction,
                  onSubmit: () => _handleSubmit(
                    currentUuid,
                    interactionNotifier,
                    chapterNotifier,
                  ),
                )
              else
                ChapterFeedbackBar(
                  result: chapter.lastSubmitResult!,
                  questionUuid: currentUuid,
                  selectedChoiceKey: chapter.lastSelectedKey ?? '',
                  isLastQuestion: chapter.isLastQuestion,
                  onNext: () {
                    if (chapter.isLastQuestion) {
                      _navigateToResult(chapter.results);
                    } else {
                      chapterNotifier.nextQuestion();
                    }
                  },
                ),
            ],
          );
        },
      ),
    );
  }
}

// ─── 로딩 / 에러 스캐폴드 ─────────────────────────────────────────

class _LoadingScaffold extends StatelessWidget {
  final String topicName;
  const _LoadingScaffold({required this.topicName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: ChapterAppBar(
        topicName: topicName,
        currentIndex: 0,
        total: 10,
        isAnswered: false,
      ),
      body: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _ErrorScaffold extends StatelessWidget {
  final String topicName;
  final String message;
  const _ErrorScaffold({required this.topicName, required this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: ChapterAppBar(
        topicName: topicName,
        currentIndex: 0,
        total: 10,
        isAnswered: false,
      ),
      body: Center(
        child: Text(
          message,
          style: AppTextStyles.paragraph_14
              .copyWith(color: AppColors.textSecondary),
        ),
      ),
    );
  }
}

// ─── 문제 본문 위젯 (QuestionDetailPage의 private 위젯 재현) ─────────

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
          Row(
            children: List.generate(3, (i) {
              return Icon(
                Icons.star,
                size: 16.sp,
                color: i < difficulty
                    ? AppColors.warning
                    : AppColors.borderDefault,
              );
            }),
          ),
          SizedBox(width: 8.w),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
            decoration: BoxDecoration(
              color: isExecutable
                  ? AppColors.accentLight
                  : AppColors.borderDefault,
              borderRadius: BorderRadius.circular(999.r),
            ),
            child: Text(
              isExecutable ? 'SQL 실행' : '개념 문제',
              style: AppTextStyles.tag_12.copyWith(
                color: isExecutable
                    ? AppColors.brandIndigo
                    : AppColors.textSecondary,
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
  final BuildContext buildContext;

  const _ChoicesSection({
    required this.interaction,
    required this.notifier,
    required this.question,
    required this.questionUuid,
    required this.isExecutable,
    required this.buildContext,
  });

  @override
  Widget build(BuildContext context) {
    if (interaction.isGeneratingChoices) {
      return SseLoadingWidget(
        statusMessage: interaction.sseStatusMessage ?? '선택지 생성 중...',
      );
    }

    if (interaction.sseError != null) {
      return _SseErrorSection(
        error: interaction.sseError!,
        onRetry: interaction.sseError!.retryable
            ? () => notifier.startSseGeneration()
            : null,
      );
    }

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
            style: AppTextStyles.paragraph14Semibold
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

// ─── 제출 버튼 ────────────────────────────────────────────────────

class _ChapterSubmitBar extends StatelessWidget {
  final QuestionInteractionState interaction;
  final VoidCallback onSubmit;

  const _ChapterSubmitBar({
    required this.interaction,
    required this.onSubmit,
  });

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
                  style: AppTextStyles.label_16
                      .copyWith(color: Colors.white),
                ),
        ),
      ),
    );
  }
}
