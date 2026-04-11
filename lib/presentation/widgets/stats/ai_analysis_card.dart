import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/category_stats.dart';
import '../../../data/models/progress/progress_response.dart';

/// 로컬 분석 텍스트 기반 AI 영역 분석 카드.
/// correctRate와 categoryStats에서 가장 취약한 영역을 추출해 메시지 생성.
class AiAnalysisCard extends StatelessWidget {
  final ProgressResponse? progress;
  final List<CategoryStats>? categoryStats;

  const AiAnalysisCard({
    super.key,
    required this.progress,
    required this.categoryStats,
  });

  /// 취약 영역 기반 분석 메시지 생성.
  String _buildAnalysisMessage() {
    final rate = progress?.correctRate ?? 0.0;
    final solved = progress?.solvedCount ?? 0;

    if (solved == 0) {
      return '아직 학습을 시작하지 않으셨네요. 오늘의 문제부터 풀어보세요!';
    }

    // correctRate 낮은 순으로 정렬해 취약 영역 추출
    final sorted = List<CategoryStats>.from(categoryStats ?? [])
      ..sort((a, b) => a.correctRate.compareTo(b.correctRate));
    final weakName = sorted.isNotEmpty ? sorted.first.topicName : null;

    if (rate == 0.0) {
      return '모든 토픽에서 정답률이 0%로 나타나 SQL 학습에 전반적인 어려움을 겪고 계신 것으로 보입니다.'
          '${weakName != null ? " 특히 \'$weakName\'부터 차근차근 복습해보세요." : ""}';
    } else if (rate < 0.4) {
      return weakName != null
          ? '\'$weakName\' 영역이 가장 취약합니다. 해당 영역 문제를 집중적으로 풀어보세요.'
          : '정답률이 낮습니다. 기초부터 차근차근 복습해보세요.';
    } else if (rate < 0.7) {
      return weakName != null
          ? '전반적으로 중간 수준입니다. \'$weakName\' 영역에 집중하면 합격에 한 걸음 더 가까워질 수 있습니다.'
          : '전반적으로 중간 수준입니다. 취약 영역을 더 집중적으로 학습해보세요.';
    } else {
      return weakName != null
          ? '전반적으로 좋은 성과를 보이고 계십니다! \'$weakName\' 영역을 조금 더 다듬으면 완벽해질 것 같습니다.'
          : '전반적으로 좋은 성과를 보이고 계십니다! 꾸준히 유지해나가세요.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 로봇 아이콘 뱃지
          Container(
            width: 36.r,
            height: 36.r,
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Center(
              child: FaIcon(
                FontAwesomeIcons.robot,
                size: 16.r,
                color: AppColors.brandIndigo,
              ),
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI 영역 분석',
                  style: AppTextStyles.paragraph14Semibold.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 6.h),
                Text(
                  _buildAnalysisMessage(),
                  style: AppTextStyles.paragraph_14.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
