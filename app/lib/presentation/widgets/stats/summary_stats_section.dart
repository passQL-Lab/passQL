import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/progress_response.dart';

/// 상단 3개 요약 통계 카드 Row.
/// solvedCount / correctRate(%) / streakDays
class SummaryStatsSection extends StatelessWidget {
  final ProgressResponse? progress;

  const SummaryStatsSection({super.key, required this.progress});

  @override
  Widget build(BuildContext context) {
    final solved = progress?.solvedCount ?? 0;
    final rate =
        progress != null ? (progress!.correctRate * 100).round() : 0;
    final streak = progress?.streakDays ?? 0;

    return Row(
      children: [
        Expanded(child: _StatCard(value: '$solved문제', label: '푼 문제')),
        SizedBox(width: 12.w),
        Expanded(child: _StatCard(value: '$rate%', label: '합격 준비도')),
        SizedBox(width: 12.w),
        Expanded(child: _StatCard(value: '$streak일', label: '연속 학습')),
      ],
    );
  }
}

/// 개별 통계 카드.
class _StatCard extends StatelessWidget {
  final String value;
  final String label;

  const _StatCard({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 20.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTextStyles.heading_24.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            label,
            style: AppTextStyles.tag_12.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
