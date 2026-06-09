import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../presentation/providers/chapter_providers.dart';

/// 챕터 완료 결과 화면 — 3단계 (점수 → 분석 → 문제별 결과).
///
/// GoRouterState.extra로 [ChapterSummary]를 받아 렌더링.
class PracticeResultPage extends StatefulWidget {
  final Object? extra;

  const PracticeResultPage({super.key, this.extra});

  @override
  State<PracticeResultPage> createState() => _PracticeResultPageState();
}

class _PracticeResultPageState extends State<PracticeResultPage> {
  final PageController _pageController = PageController();
  int _currentStep = 0; // 0: 점수, 1: 분석, 2: 문제별 결과

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() => _currentStep++);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = widget.extra is ChapterSummary
        ? widget.extra as ChapterSummary
        : null;

    if (summary == null) {
      return Scaffold(
        backgroundColor: AppColors.pageBg,
        appBar: _buildAppBar(context),
        body: Center(
          child: Text(
            '결과를 불러올 수 없어요',
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    final correctCount =
        summary.results.where((r) => r.isCorrect).length;
    final total = summary.results.length;

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      appBar: _buildAppBar(context),
      body: Column(
        children: [
          // 단계 인디케이터
          _StepIndicator(currentStep: _currentStep),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _ScorePage(
                  correctCount: correctCount,
                  total: total,
                  topicName: summary.topicName,
                ),
                _AnalysisPage(
                  summary: summary,
                  correctCount: correctCount,
                  total: total,
                ),
                _PerQuestionPage(results: summary.results),
              ],
            ),
          ),
          // 하단 네비게이션 버튼
          _BottomNavBar(
            currentStep: _currentStep,
            onPrev: _currentStep > 0 ? _prevStep : null,
            onNext: _currentStep < 2 ? _nextStep : null,
            onFinish: _currentStep == 2
                ? () => context.go('/home')
                : null,
          ),
        ],
      ),
    );
  }

  AppBar _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.cardBg,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.close, color: AppColors.textPrimary),
        onPressed: () => context.go('/home'),
      ),
      title: Text(
        '챕터 결과',
        style: AppTextStyles.heading_20
            .copyWith(color: AppColors.textPrimary),
      ),
    );
  }
}

// ─── 단계 인디케이터 ────────────────────────────────────────────────

class _StepIndicator extends StatelessWidget {
  final int currentStep;
  const _StepIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    const labels = ['점수', '분석', '문제별'];
    return Container(
      color: AppColors.cardBg,
      padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 20.w),
      child: Row(
        children: List.generate(labels.length, (i) {
          final isActive = i == currentStep;
          final isDone = i < currentStep;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 24.w,
                            height: 24.w,
                            decoration: BoxDecoration(
                              color: isActive || isDone
                                  ? AppColors.brandIndigo
                                  : AppColors.borderDefault,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: isDone
                                  ? Icon(
                                      Icons.check,
                                      size: 14.sp,
                                      color: Colors.white,
                                    )
                                  : Text(
                                      '${i + 1}',
                                      style: AppTextStyles.tag_12.copyWith(
                                        color: isActive
                                            ? Colors.white
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                            ),
                          ),
                          SizedBox(width: 4.w),
                          Text(
                            labels[i],
                            style: AppTextStyles.tag_12.copyWith(
                              color: isActive || isDone
                                  ? AppColors.brandIndigo
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // 단계 사이 구분선
                if (i < labels.length - 1)
                  Expanded(
                    child: Container(
                      height: 1.h,
                      color: i < currentStep
                          ? AppColors.brandIndigo
                          : AppColors.borderDefault,
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ─── Step 1: 점수 ────────────────────────────────────────────────

class _ScorePage extends StatefulWidget {
  final int correctCount;
  final int total;
  final String topicName;

  const _ScorePage({
    required this.correctCount,
    required this.total,
    required this.topicName,
  });

  @override
  State<_ScorePage> createState() => _ScorePageState();
}

class _ScorePageState extends State<_ScorePage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<int> _countAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _countAnimation = IntTween(begin: 0, end: widget.correctCount)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    // 짧은 딜레이 후 카운트업 시작
    Timer(const Duration(milliseconds: 300), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accuracy = widget.total > 0
        ? (widget.correctCount / widget.total * 100).round()
        : 0;

    return SingleChildScrollView(
      padding: EdgeInsets.all(24.w),
      child: Column(
        children: [
          SizedBox(height: 32.h),
          Text(
            widget.topicName,
            style: AppTextStyles.tag_12.copyWith(
              color: AppColors.brandIndigo,
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            '챕터 완료!',
            style: AppTextStyles.heading_20
                .copyWith(color: AppColors.textPrimary),
          ),
          SizedBox(height: 40.h),
          // 점수 카운트업
          AnimatedBuilder(
            animation: _countAnimation,
            builder: (context, child) {
              return Column(
                children: [
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: '${_countAnimation.value}',
                          style: AppTextStyles.semibold_44.copyWith(
                            color: AppColors.brandIndigo,
                          ),
                        ),
                        TextSpan(
                          text: ' / ${widget.total}',
                          style: AppTextStyles.heading_20.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    '정답',
                    style: AppTextStyles.paragraph_14.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              );
            },
          ),
          SizedBox(height: 32.h),
          // 정확도 카드
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(12.r),
              border: Border.all(color: AppColors.borderDefault),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  label: '정확도',
                  value: '$accuracy%',
                  valueColor: accuracy >= 70
                      ? AppColors.successText
                      : AppColors.errorText,
                ),
                Container(
                  width: 1.w,
                  height: 40.h,
                  color: AppColors.borderDefault,
                ),
                _StatItem(
                  label: '정답',
                  value: '${widget.correctCount}문제',
                  valueColor: AppColors.successText,
                ),
                Container(
                  width: 1.w,
                  height: 40.h,
                  color: AppColors.borderDefault,
                ),
                _StatItem(
                  label: '오답',
                  value: '${widget.total - widget.correctCount}문제',
                  valueColor: AppColors.errorText,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;

  const _StatItem({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.subHeading_18.copyWith(color: valueColor),
        ),
        SizedBox(height: 4.h),
        Text(
          label,
          style: AppTextStyles.tag_12.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

// ─── Step 2: 분석 ────────────────────────────────────────────────

class _AnalysisPage extends StatelessWidget {
  final ChapterSummary summary;
  final int correctCount;
  final int total;

  const _AnalysisPage({
    required this.summary,
    required this.correctCount,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    final wrongCount = total - correctCount;
    final avgDurationSec = total > 0
        ? (summary.totalDurationMs / total / 1000).toStringAsFixed(1)
        : '0';
    final accuracy =
        total > 0 ? (correctCount / total * 100).round() : 0;

    String feedbackMessage;
    if (accuracy >= 90) {
      feedbackMessage = '훌륭해요! 이 토픽을 완벽히 이해하고 있어요.';
    } else if (accuracy >= 70) {
      feedbackMessage = '잘 하고 있어요! 틀린 문제를 다시 복습해보세요.';
    } else if (accuracy >= 50) {
      feedbackMessage = '조금 더 연습이 필요해요. 오답 문제를 꼭 확인하세요.';
    } else {
      feedbackMessage = '다시 한 번 도전해보세요. 꾸준히 풀다 보면 실력이 쌓여요!';
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(24.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: 16.h),
          Text(
            '학습 분석',
            style: AppTextStyles.heading_20
                .copyWith(color: AppColors.textPrimary),
          ),
          SizedBox(height: 8.h),
          // 피드백 메시지
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              color: accuracy >= 70
                  ? AppColors.successLight
                  : AppColors.accentLight,
              borderRadius: BorderRadius.circular(12.r),
              border: Border(
                left: BorderSide(
                  color: accuracy >= 70
                      ? AppColors.success
                      : AppColors.brandIndigo,
                  width: 4.w,
                ),
              ),
            ),
            child: Text(
              feedbackMessage,
              style: AppTextStyles.paragraph_14.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
          ),
          SizedBox(height: 20.h),
          // 통계 카드들
          _AnalysisCard(
            title: '정확도',
            value: '$accuracy%',
            subtitle: '전체 $total문제 중 $correctCount문제 정답',
            valueColor: accuracy >= 70
                ? AppColors.successText
                : AppColors.errorText,
          ),
          SizedBox(height: 12.h),
          _AnalysisCard(
            title: '평균 풀이 시간',
            value: '$avgDurationSec초',
            subtitle: '문제당 평균 소요시간',
            valueColor: AppColors.textPrimary,
          ),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: _AnalysisCard(
                  title: '정답',
                  value: '$correctCount',
                  subtitle: '문제',
                  valueColor: AppColors.successText,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _AnalysisCard(
                  title: '오답',
                  value: '$wrongCount',
                  subtitle: '문제',
                  valueColor: wrongCount > 0
                      ? AppColors.errorText
                      : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AnalysisCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color valueColor;

  const _AnalysisCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
            title,
            style: AppTextStyles.tag_12.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            value,
            style: AppTextStyles.heading_20.copyWith(color: valueColor),
          ),
          Text(
            subtitle,
            style: AppTextStyles.tag_12.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step 3: 문제별 결과 ─────────────────────────────────────────

class _PerQuestionPage extends StatelessWidget {
  final List<ChapterResult> results;
  const _PerQuestionPage({required this.results});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(24.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(height: 16.h),
          Text(
            '문제별 결과',
            style: AppTextStyles.heading_20
                .copyWith(color: AppColors.textPrimary),
          ),
          SizedBox(height: 16.h),
          ...results.asMap().entries.map((entry) {
            final index = entry.key;
            final result = entry.value;
            return _QuestionResultItem(
              index: index,
              result: result,
            );
          }),
        ],
      ),
    );
  }
}

class _QuestionResultItem extends StatelessWidget {
  final int index;
  final ChapterResult result;

  const _QuestionResultItem({
    required this.index,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    final durationSec = (result.durationMs / 1000).toStringAsFixed(1);
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        children: [
          // 문제 번호
          Container(
            width: 28.w,
            height: 28.w,
            decoration: BoxDecoration(
              color: result.isCorrect
                  ? AppColors.successLight
                  : AppColors.errorLight,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '${index + 1}',
                style: AppTextStyles.tag_12.copyWith(
                  color: result.isCorrect
                      ? AppColors.successText
                      : AppColors.errorText,
                ),
              ),
            ),
          ),
          SizedBox(width: 12.w),
          // 결과 텍스트
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.isCorrect ? '정답' : '오답',
                  style: AppTextStyles.paragraph14Semibold.copyWith(
                    color: result.isCorrect
                        ? AppColors.successText
                        : AppColors.errorText,
                  ),
                ),
                Text(
                  '풀이 시간: $durationSec초',
                  style: AppTextStyles.tag_12.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          // 결과 아이콘
          Icon(
            result.isCorrect ? Icons.check_circle : Icons.cancel,
            color: result.isCorrect ? AppColors.success : AppColors.error,
            size: 20.sp,
          ),
        ],
      ),
    );
  }
}

// ─── 하단 네비게이션 버튼 ─────────────────────────────────────────

class _BottomNavBar extends StatelessWidget {
  final int currentStep;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final VoidCallback? onFinish;

  const _BottomNavBar({
    required this.currentStep,
    this.onPrev,
    this.onNext,
    this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border(top: BorderSide(color: AppColors.borderDefault)),
      ),
      child: Row(
        children: [
          // 이전 버튼 (Step 0에서는 숨김)
          if (onPrev != null) ...[
            Expanded(
              child: SizedBox(
                height: 44.h,
                child: OutlinedButton(
                  onPressed: onPrev,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.borderDefault),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                  ),
                  child: Text(
                    '이전',
                    style: AppTextStyles.label_16
                        .copyWith(color: AppColors.textSecondary),
                  ),
                ),
              ),
            ),
            SizedBox(width: 12.w),
          ],
          // 다음 / 완료 버튼
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 44.h,
              child: ElevatedButton(
                onPressed: onNext ?? onFinish,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandIndigo,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                ),
                child: Text(
                  onNext != null ? '다음' : '홈으로',
                  style: AppTextStyles.label_16
                      .copyWith(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
