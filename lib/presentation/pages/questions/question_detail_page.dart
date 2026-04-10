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
  void _initChoices(QuestionDetail q, QuestionInteractionNotifier notifier) {
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
                    onAiExplainTap: (interaction.currentExecuteResult!.errorCode?.isNotEmpty == true)
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
