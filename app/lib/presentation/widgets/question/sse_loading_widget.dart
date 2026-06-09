import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// SSE 선택지 생성 중 로딩 상태. 스피너 + 상태 메시지.
class SseLoadingWidget extends StatelessWidget {
  final String statusMessage;

  const SseLoadingWidget({
    super.key,
    this.statusMessage = '선택지 생성 중...',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
      padding: EdgeInsets.all(20.w),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 20.w,
            height: 20.w,
            child: const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.brandIndigo,
            ),
          ),
          SizedBox(width: 12.w),
          Text(
            statusMessage,
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
