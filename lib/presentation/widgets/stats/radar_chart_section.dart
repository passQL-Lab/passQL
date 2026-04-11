import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/category_stats.dart';

/// 영역별 분석 레이더(스파이더) 차트 섹션.
/// categoryStats가 없으면 빈 상태 메시지 표시.
class RadarChartSection extends StatelessWidget {
  final List<CategoryStats>? categoryStats;

  const RadarChartSection({super.key, required this.categoryStats});

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
            '영역별 분석',
            style: AppTextStyles.subHeading_18.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 20.h),
          _buildChart(),
        ],
      ),
    );
  }

  Widget _buildChart() {
    final stats = categoryStats;

    if (stats == null || stats.isEmpty) {
      return SizedBox(
        height: 220.h,
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

    // correctRate 0.0~1.0 → 0~5 스케일 변환 (RadarChart 최대값 기준)
    final values = stats.map((s) => s.correctRate * 5).toList();
    final labels = stats.map((s) => s.topicName).toList();

    return SizedBox(
      height: 260.h,
      child: RadarChart(
        RadarChartData(
          radarShape: RadarShape.polygon,
          tickCount: 4,
          // tick 숫자 레이블 숨김 — 수치보다 형태로 파악
          ticksTextStyle: const TextStyle(
            fontSize: 0,
            color: Colors.transparent,
          ),
          gridBorderData: BorderSide(
            color: AppColors.borderDefault,
            width: 1,
          ),
          radarBorderData: BorderSide(
            color: AppColors.borderMuted,
            width: 1,
          ),
          titlePositionPercentageOffset: 0.25,
          titleTextStyle: AppTextStyles.tag_10.copyWith(
            color: AppColors.textSecondary,
          ),
          getTitle: (index, angle) {
            final label = labels[index];
            // '/' 기준으로 줄바꿈 처리 (긴 토픽명 대응)
            final parts = label.split(' / ');
            return RadarChartTitle(
              text: parts.join('\n'),
              angle: 0,
            );
          },
          dataSets: [
            RadarDataSet(
              // 인디고 15% 불투명도로 채움
              fillColor: AppColors.brandIndigo.withValues(alpha: 0.15),
              borderColor: AppColors.brandIndigo,
              borderWidth: 2,
              entryRadius: 3,
              dataEntries:
                  values.map((v) => RadarEntry(value: v)).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
