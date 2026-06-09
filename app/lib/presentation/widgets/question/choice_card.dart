import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/choice_item.dart';

/// 개별 선택지 카드. kind="SQL"이면 코드 블록, kind="TEXT"이면 텍스트.
/// isSelected=true이면 인디고 테두리 강조.
class ChoiceCard extends StatelessWidget {
  final ChoiceItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const ChoiceCard({
    super.key,
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentLight : AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected ? AppColors.brandIndigo : AppColors.borderDefault,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 선택지 키 (A/B/C/D) - 라디오 스타일
            Container(
              width: 22.w,
              height: 22.w,
              margin: EdgeInsets.only(right: 10.w, top: 1.h),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.brandIndigo : AppColors.cardBg,
                border: Border.all(
                  color: isSelected
                      ? AppColors.brandIndigo
                      : AppColors.borderMuted,
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  item.key,
                  style: AppTextStyles.tag10Bold.copyWith(
                    color:
                        isSelected ? AppColors.cardBg : AppColors.textSecondary,
                  ),
                ),
              ),
            ),

            // 선택지 내용
            Expanded(
              child: item.kind == 'SQL'
                  ? _SqlBody(sql: item.body, isSelected: isSelected)
                  : Text(
                      item.body,
                      style: AppTextStyles.paragraph_14
                          .copyWith(color: AppColors.textPrimary),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SqlBody extends StatelessWidget {
  final String sql;
  final bool isSelected;

  const _SqlBody({required this.sql, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: AppColors.codeBg,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Text(
        sql,
        style: TextStyle(
          fontFamily: 'JetBrainsMono',
          fontSize: 13.sp,
          color: AppColors.textPrimary,
          height: 1.5,
        ),
      ),
    );
  }
}
