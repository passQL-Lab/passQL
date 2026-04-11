import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// 스키마 DDL 섹션. 접을 수 있는 ExpansionTile.
/// schemaDdl이 있을 때만 표시.
class SchemaSection extends StatelessWidget {
  final String? schemaDdl;
  final String? schemaSampleData;

  const SchemaSection({super.key, this.schemaDdl, this.schemaSampleData});

  @override
  Widget build(BuildContext context) {
    if (schemaDdl == null || schemaDdl!.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: EdgeInsets.symmetric(horizontal: 16.w),
          title: Text(
            '스키마 보기',
            style: AppTextStyles.paragraph14Semibold
                .copyWith(color: AppColors.textPrimary),
          ),
          children: [
            Container(
              width: double.infinity,
              margin: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
              padding: EdgeInsets.all(12.w),
              decoration: BoxDecoration(
                color: AppColors.codeBg,
                borderRadius: BorderRadius.circular(8.r),
                border: Border(
                  left: BorderSide(
                    color: AppColors.brandIndigo,
                    width: 4.w,
                  ),
                ),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Text(
                  schemaDdl!,
                  style: TextStyle(
                    fontFamily: 'JetBrainsMono',
                    fontSize: 13.sp,
                    color: AppColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            if (schemaSampleData != null && schemaSampleData!.isNotEmpty)
              Padding(
                padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 12.h),
                child: Text(
                  '샘플 데이터',
                  style: AppTextStyles.tag_12
                      .copyWith(color: AppColors.textSecondary),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
