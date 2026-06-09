import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';

/// 챕터 플로우 AppBar.
///
/// [홈 아이콘] | N / total | [topicName 뱃지]
/// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LinearProgressIndicator
class ChapterAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String topicName;
  final int currentIndex;
  final int total;

  /// 제출 완료 여부 — true이면 프로그레스 바를 (currentIndex + 1) / total로 계산.
  final bool isAnswered;

  const ChapterAppBar({
    super.key,
    required this.topicName,
    required this.currentIndex,
    required this.total,
    required this.isAnswered,
  });

  double get _progress {
    if (total == 0) return 0;
    return isAnswered ? (currentIndex + 1) / total : currentIndex / total;
  }

  // 툴바 + 프로그레스 바(4px) 높이
  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + 4.h);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AppBar(
          backgroundColor: AppColors.cardBg,
          elevation: 0,
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.home_outlined, color: AppColors.textPrimary),
            onPressed: () => context.go('/home'),
          ),
          title: Text(
            '${currentIndex + 1} / $total',
            style: AppTextStyles.label_16
                .copyWith(color: AppColors.textPrimary),
          ),
          centerTitle: true,
          actions: [
            // 토픽 뱃지 — SELECT 기본
            Container(
              margin: EdgeInsets.only(right: 16.w),
              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: AppColors.accentLight,
                borderRadius: BorderRadius.circular(999.r),
              ),
              child: Text(
                topicName,
                style: AppTextStyles.tag_12.copyWith(
                  color: AppColors.brandIndigo,
                ),
              ),
            ),
          ],
        ),
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          child: LinearProgressIndicator(
            value: _progress,
            backgroundColor: AppColors.borderDefault,
            color: AppColors.brandIndigo,
            minHeight: 4.h,
          ),
        ),
      ],
    );
  }
}
