import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/question_summary.dart';

/// 홈 화면 추천 문제 리스트.
/// 최대 3개 문제를 카드 형태로 표시.
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
        ...questions.map(
          (q) => _QuestionCard(
            question: q,
            difficultyStars: _difficultyStars(q.difficulty),
            onTap: () => onQuestionTap?.call(q.questionUuid),
          ),
        ),
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
