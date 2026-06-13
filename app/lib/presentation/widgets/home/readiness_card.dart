import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/readiness_response.dart';

/// toneKey → 한국어 코멘트 텍스트.
const Map<String, String> _toneMessages = {
  'NO_EXAM': '시험 일정을 선택하고\n맞춤 학습을 시작해보세요.',
  'ONBOARDING': '오늘부터 SQL 학습을 시작해볼까요?\n꾸준히 하면 합격할 수 있어요!',
  'POST_EXAM': '수고하셨어요!\n다음 시험 준비를 시작해볼까요?',
  'TODAY': '오늘이 시험 당일이에요!\n지금까지 공부한 것을 믿어요.',
  'SPRINT': '시험이 코앞이에요!\n마지막까지 집중해요.',
  'PUSH': '시험이 다가오고 있어요.\n조금씩 더 달려볼까요?',
  'STEADY': '꾸준한 학습이\n합격의 지름길이에요.',
  'EARLY': '충분한 시간이 있어요.\n기초부터 탄탄하게 쌓아요!',
};

/// 합격 준비도 카드.
/// score 게이지 바 + toneKey 코멘트 + accuracy/coverage/recency 세부 지표.
class ReadinessCard extends StatelessWidget {
  final ReadinessResponse readiness;

  const ReadinessCard({super.key, required this.readiness});

  @override
  Widget build(BuildContext context) {
    final scorePercent = (readiness.score * 100).round();
    final message = _toneMessages[readiness.toneKey] ?? '';

    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border.all(color: AppColors.borderDefault),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '합격 준비도',
            style: AppTextStyles.tag12Semibold.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 12.h),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$scorePercent',
                style: AppTextStyles.semibold_44.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
              Padding(
                padding: EdgeInsets.only(bottom: 8.h, left: 2.w),
                child: Text(
                  '%',
                  style: AppTextStyles.heading_20.copyWith(
                    color: AppColors.brandIndigo,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(4.r),
            child: LinearProgressIndicator(
              value: readiness.score.clamp(0.0, 1.0),
              backgroundColor: AppColors.accentLight,
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.brandIndigo,
              ),
              minHeight: 8,
            ),
          ),
          SizedBox(height: 12.h),
          if (message.isNotEmpty)
            Text(
              message,
              style: AppTextStyles.paragraph_14.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          SizedBox(height: 16.h),
          Row(
            children: [
              _MetricChip(
                label: '정확도',
                value: '${(readiness.accuracy * 100).round()}%',
              ),
              SizedBox(width: 8.w),
              _MetricChip(
                label: '범위',
                value:
                    '${readiness.coveredTopicCount}/${readiness.activeTopicCount}',
              ),
              SizedBox(width: 8.w),
              _MetricChip(
                label: '최신성',
                value: '${(readiness.recency * 100).round()}%',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  final String label;
  final String value;

  const _MetricChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 8.h),
        decoration: BoxDecoration(
          color: AppColors.pageBg,
          border: Border.all(color: AppColors.borderDefault),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: AppTextStyles.paragraph14Semibold.copyWith(
                color: AppColors.textPrimary,
              ),
            ),
            SizedBox(height: 2.h),
            Text(
              label,
              style: AppTextStyles.tag_10.copyWith(
                color: AppColors.textCaption,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
