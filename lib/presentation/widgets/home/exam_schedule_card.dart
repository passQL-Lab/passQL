import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/exam/exam_schedule_response.dart';

/// 홈 화면 시험 일정 카드.
/// schedule이 null이면 "선택된 일정 없음" 표시.
class ExamScheduleCard extends StatelessWidget {
  final ExamScheduleResponse? schedule;
  final VoidCallback? onTap;

  const ExamScheduleCard({
    super.key,
    this.schedule,
    this.onTap,
  });

  /// examDate(YYYY-MM-DD) → D-day 문자열.
  String _dday(String examDate) {
    try {
      final exam = DateTime.parse(examDate);
      final today = DateTime.now();
      final diff =
          exam.difference(DateTime(today.year, today.month, today.day)).inDays;
      if (diff == 0) return 'D-Day';
      if (diff > 0) return 'D-$diff';
      return 'D+${diff.abs()}';
    } catch (_) {
      return '';
    }
  }

  /// YYYY-MM-DD → 한국어 날짜 (예: 2026년 6월 21일)
  String _formatDate(String examDate) {
    try {
      final parts = examDate.split('-');
      return '${parts[0]}년 ${parts[1]}월 ${parts[2]}일';
    } catch (_) {
      return examDate;
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  FontAwesomeIcons.calendarDays,
                  size: 14.sp,
                  color: AppColors.brandIndigo,
                ),
                SizedBox(width: 6.w),
                Text(
                  '시험 일정',
                  style: AppTextStyles.tag12Semibold.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),
            if (schedule != null) ...[
              Text(
                _dday(schedule!.examDate),
                style: AppTextStyles.semibold_28.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                '${schedule!.certType} ${schedule!.round}회',
                style: AppTextStyles.paragraph14Semibold.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                _formatDate(schedule!.examDate),
                style: AppTextStyles.tag_12.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ] else ...[
              Text(
                '선택된 일정 없음',
                style: AppTextStyles.paragraph_14.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                '일정 선택하기 →',
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
