import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/ai_comment_response.dart';

/// AI 영역 분석 카드.
/// /progress/ai-comment API 응답을 그대로 표시.
/// aiComment가 null이면 카드 숨김 처리.
class AiAnalysisCard extends StatelessWidget {
  final AiCommentResponse? aiComment;

  const AiAnalysisCard({super.key, required this.aiComment});

  @override
  Widget build(BuildContext context) {
    final comment = aiComment?.comment;

    // AI 코멘트 없으면 카드 숨김
    if (comment == null) return const SizedBox.shrink();

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
                  comment,
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
