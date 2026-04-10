import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// readiness 없을 때 표시하는 통계 2열 카드.
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
                    minHeight: 6,
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
