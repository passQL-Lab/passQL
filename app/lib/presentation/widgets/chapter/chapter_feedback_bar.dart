import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/submit_result.dart';
import '../question/ai_explain_sheet.dart';

/// 제출 후 인라인 피드백 바.
///
/// 상단: 정답/오답 표시 + AI 해설 링크 (조건부)
/// 하단: 다음 문제 / 결과 보기 버튼
class ChapterFeedbackBar extends StatelessWidget {
  final SubmitResult result;
  final String questionUuid;

  /// 사용자가 선택한 선택지 키 (AI diff-explain 요청에 사용).
  final String selectedChoiceKey;

  final bool isLastQuestion;
  final VoidCallback onNext;

  const ChapterFeedbackBar({
    super.key,
    required this.result,
    required this.questionUuid,
    required this.selectedChoiceKey,
    required this.isLastQuestion,
    required this.onNext,
  });

  /// EXECUTABLE 모드 여부 — correctSql 또는 correctResult 존재 시 EXECUTABLE로 판단.
  bool get _isExecutable =>
      result.correctSql != null || result.correctResult != null;

  /// AI 해설 버튼 표시 조건:
  /// - 오답: 항상 표시
  /// - 정답 + CONCEPT_ONLY: 표시
  /// - 정답 + EXECUTABLE: 표시하지 않음
  bool get _showAiButton => !result.isCorrect || !_isExecutable;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        border: Border(top: BorderSide(color: AppColors.borderDefault)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // 정답/오답 피드백 영역
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(20.w, 14.h, 20.w, 14.h),
            color: result.isCorrect ? AppColors.successLight : AppColors.errorLight,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.isCorrect
                      ? '정답입니다!'
                      : '오답이에요. 정답: ${result.correctKey ?? '-'}',
                  style: AppTextStyles.label_16.copyWith(
                    color: result.isCorrect
                        ? AppColors.successText
                        : AppColors.errorText,
                  ),
                ),
                if (_showAiButton) ...[
                  SizedBox(height: 8.h),
                  GestureDetector(
                    onTap: () => AiExplainSheet.show(
                      context,
                      payload: {
                        'questionUuid': questionUuid,
                        'selectedChoiceKey': selectedChoiceKey,
                      },
                      isErrorExplain: false,
                    ),
                    child: Text(
                      'AI에게 자세히 물어보기',
                      style: AppTextStyles.paragraph_14.copyWith(
                        color: AppColors.brandIndigo,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.brandIndigo,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          // 다음 문제 / 결과 보기 버튼
          Padding(
            padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
            child: SizedBox(
              width: double.infinity,
              height: 44.h,
              child: ElevatedButton(
                onPressed: onNext,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandIndigo,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                ),
                child: Text(
                  isLastQuestion ? '결과 보기' : '다음 문제',
                  style: AppTextStyles.label_16
                      .copyWith(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
