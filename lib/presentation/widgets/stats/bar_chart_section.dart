import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/category_stats.dart';

/// 카테고리별 문제 수 가로 막대 차트 섹션.
/// totalQuestionCount 기준으로 막대 길이 비율 결정.
class BarChartSection extends StatelessWidget {
  final List<CategoryStats>? categoryStats;

  const BarChartSection({super.key, required this.categoryStats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '카테고리별 문제 수',
            style: AppTextStyles.subHeading_18.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 16.h),
          _buildBars(),
        ],
      ),
    );
  }

  Widget _buildBars() {
    final stats = categoryStats;

    if (stats == null || stats.isEmpty) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 24.h),
        child: Center(
          child: Text(
            '아직 학습 데이터가 없습니다',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textCaption,
            ),
          ),
        ),
      );
    }

    // 가장 큰 totalQuestionCount 기준으로 막대 비율 계산
    final maxCount = stats
        .map((s) => s.totalQuestionCount)
        .reduce((a, b) => a > b ? a : b);

    return Column(
      children: stats.map((stat) {
        final ratio =
            maxCount > 0 ? stat.totalQuestionCount / maxCount : 0.0;

        return Padding(
          padding: EdgeInsets.only(bottom: 12.h),
          child: Row(
            children: [
              // 토픽명 — 최대 100px 고정폭, 2줄까지 허용
              SizedBox(
                width: 100.w,
                child: Text(
                  stat.topicName,
                  style: AppTextStyles.tag_10.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8.w),
              // 진행 막대
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4.r),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 8.h,
                    backgroundColor: AppColors.borderDefault,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.brandIndigo,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8.w),
              // 문제 수 숫자
              SizedBox(
                width: 24.w,
                child: Text(
                  stat.totalQuestionCount.toString(),
                  style: AppTextStyles.tag_12.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
