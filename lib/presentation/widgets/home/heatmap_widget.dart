import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/heatmap_response.dart';

/// 최근 35일(5주) 학습 히트맵.
/// 7열(일~토) × 5행(주) 그리드.
/// solvedCount 기준으로 5단계 색상 적용.
class HeatmapWidget extends StatelessWidget {
  final HeatmapResponse? heatmap;
  final int streakDays;

  const HeatmapWidget({
    super.key,
    this.heatmap,
    this.streakDays = 0,
  });

  /// 날짜 문자열 키로 빠른 조회를 위한 Map 생성.
  Map<String, HeatmapEntry> _buildEntryMap() {
    final entries = heatmap?.entries ?? [];
    return {for (final e in entries) e.date: e};
  }

  /// solvedCount → 히트맵 색상 (5단계).
  Color _colorForCount(int count) {
    if (count == 0) return AppColors.heatmap0;
    if (count <= 1) return AppColors.heatmap1;
    if (count <= 3) return AppColors.heatmap2;
    if (count <= 6) return AppColors.heatmap3;
    return AppColors.heatmap4;
  }

  /// 오늘 기준 35일 전부터 날짜 리스트 생성.
  List<DateTime> _buildDays() {
    final today = DateTime.now();
    final start = today.subtract(const Duration(days: 34));
    return List.generate(35, (i) => start.add(Duration(days: i)));
  }

  String _toDateKey(DateTime date) =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final entryMap = _buildEntryMap();
    final days = _buildDays();
    const weekLabels = ['일', '월', '화', '수', '목', '금', '토'];

    // 월 레이블 열 너비
    const double monthLabelWidth = 28;

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
          Row(
            children: [
              Text(
                '학습 현황',
                style: AppTextStyles.tag12Semibold.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              if (streakDays > 0) ...[
                const Spacer(),
                Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        size: 12.sp,
                        color: AppColors.warningText,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        '$streakDays일 연속',
                        style: AppTextStyles.tag12Semibold.copyWith(
                          color: AppColors.warningText,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          SizedBox(height: 12.h),

          // 요일 헤더 — 월 레이블 너비만큼 왼쪽 여백
          Row(
            children: [
              SizedBox(width: monthLabelWidth.w),
              ...weekLabels.map((label) {
                return Expanded(
                  child: Center(
                    child: Text(
                      label,
                      style: AppTextStyles.tag_10.copyWith(
                        color: AppColors.textCaption,
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
          SizedBox(height: 4.h),

          // 5주 그리드 — 각 행 왼쪽에 월 레이블
          ...List.generate(5, (week) {
            final firstDay = days[week * 7];
            final prevFirstDay = week > 0 ? days[(week - 1) * 7] : null;

            // 첫 주이거나 월이 바뀌는 주에 월 레이블 표시
            final showMonth =
                week == 0 || prevFirstDay?.month != firstDay.month;
            final monthLabel = showMonth ? '${firstDay.month}월' : '';

            return Padding(
              padding: EdgeInsets.only(bottom: 4.h),
              child: Row(
                children: [
                  // 월 레이블
                  SizedBox(
                    width: monthLabelWidth.w,
                    child: Text(
                      monthLabel,
                      style: AppTextStyles.tag_10.copyWith(
                        color: AppColors.textCaption,
                      ),
                    ),
                  ),

                  // 7개 날짜 셀
                  ...List.generate(7, (dayOfWeek) {
                    final idx = week * 7 + dayOfWeek;
                    final date = days[idx];
                    final key = _toDateKey(date);
                    final entry = entryMap[key];
                    final count = entry?.solvedCount ?? 0;

                    // 진한 배경(heatmap3/4)일 때 흰 글씨, 나머지는 caption 색
                    final isDeep = count > 3;

                    return Expanded(
                      child: AspectRatio(
                        aspectRatio: 1,
                        child: Container(
                          margin: EdgeInsets.all(2.r),
                          decoration: BoxDecoration(
                            color: _colorForCount(count),
                            borderRadius: BorderRadius.circular(3.r),
                          ),
                          child: Center(
                            child: Text(
                              '${date.day}',
                              style: AppTextStyles.tag_10.copyWith(
                                fontSize: 8.sp,
                                color: isDeep
                                    ? Colors.white
                                    : AppColors.textCaption,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
