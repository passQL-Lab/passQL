import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/home/greeting_response.dart';

/// 홈 화면 상단 인사 섹션.
/// greeting.message의 {nickname}을 실제 닉네임으로 치환.
/// messageType에 따라 서브 텍스트 배지 표시.
class GreetingSection extends StatelessWidget {
  final GreetingResponse greeting;

  const GreetingSection({super.key, required this.greeting});

  /// messageType별 서브 텍스트. null이면 배지 숨김.
  String? get _subText {
    switch (greeting.messageType) {
      case 'EXAM_DAY':
        return '오늘 시험이에요!';
      case 'URGENT':
        return '시험이 얼마 남지 않았어요';
      case 'COUNTDOWN':
        return '시험까지 카운트다운 중이에요';
      default:
        return null;
    }
  }

  /// {nickname} 플레이스홀더를 실제 닉네임으로 치환.
  String get _resolvedMessage =>
      greeting.message.replaceAll('{nickname}', greeting.nickname);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _resolvedMessage,
          style: AppTextStyles.heading_24.copyWith(
            color: AppColors.textPrimary,
            height: 1.4,
          ),
        ),
        if (_subText != null) ...[
          SizedBox(height: 8.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
            decoration: BoxDecoration(
              color: greeting.messageType == 'EXAM_DAY'
                  ? AppColors.errorLight
                  : AppColors.warningLight,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              _subText!,
              style: AppTextStyles.tag12Semibold.copyWith(
                color: greeting.messageType == 'EXAM_DAY'
                    ? AppColors.errorText
                    : AppColors.warningText,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
