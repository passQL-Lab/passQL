import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/today_question_response.dart';

/// 홈 화면 오늘의 문제 카드.
/// question이 null이면 "문제 풀기" 링크 카드 표시.
/// alreadySolvedToday=true이면 "완료" 배지 표시.
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
        width: double.infinity,
        height: double.infinity,
        padding: EdgeInsets.all(16.r),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
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
              if (question.topicName != null)
                Container(
                  margin: EdgeInsets.only(bottom: 6.h),
                  padding:
                      EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
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
              SizedBox(height: 8.h),
              Text(
                _difficultyStars(question.difficulty),
                style: AppTextStyles.tag_12.copyWith(
                  color: AppColors.warning,
                  letterSpacing: 2,
                ),
              ),
            ] else ...[
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
