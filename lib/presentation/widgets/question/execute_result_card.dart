import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/question/execute_result.dart';

/// SQL 실행 결과 카드. 성공이면 결과 테이블, 실패이면 에러 카드.
class ExecuteResultCard extends StatelessWidget {
  final ExecuteResult result;
  final VoidCallback? onAiExplainTap;

  const ExecuteResultCard({
    super.key,
    required this.result,
    this.onAiExplainTap,
  });

  bool get _isError => result.errorCode != null && result.errorCode!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: _isError ? AppColors.errorLight : AppColors.successLight,
        borderRadius: BorderRadius.circular(8.r),
        border: Border(
          left: BorderSide(
            color: _isError ? AppColors.error : AppColors.success,
            width: 4.w,
          ),
        ),
      ),
      child: _isError ? _ErrorContent(result: result, onAiTap: onAiExplainTap)
                      : _SuccessContent(result: result),
    );
  }
}

/// 에러 결과: 에러 코드 + 메시지 + AI 해설 버튼.
class _ErrorContent extends StatelessWidget {
  final ExecuteResult result;
  final VoidCallback? onAiTap;

  const _ErrorContent({required this.result, this.onAiTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(12.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            result.errorCode ?? 'ERROR',
            style: TextStyle(
              fontFamily: 'JetBrainsMono',
              fontSize: 13.sp,
              fontWeight: FontWeight.bold,
              color: AppColors.errorText,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            result.errorMessage ?? '알 수 없는 오류',
            style: AppTextStyles.paragraph_14
                .copyWith(color: AppColors.textPrimary),
          ),
          if (onAiTap != null) ...[
            SizedBox(height: 8.h),
            GestureDetector(
              onTap: onAiTap,
              child: Text(
                'AI에게 물어보기',
                style: AppTextStyles.paragraph_14
                    .copyWith(color: AppColors.brandIndigo),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// 성공 결과: 컬럼 헤더 + 데이터 행 테이블.
class _SuccessContent extends StatelessWidget {
  final ExecuteResult result;
  const _SuccessContent({required this.result});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(12.w),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${result.rowCount ?? result.rows.length}행 반환'
            '${result.elapsedMs != null ? ' · ${result.elapsedMs}ms' : ''}',
            style: AppTextStyles.tag_12
                .copyWith(color: AppColors.successText),
          ),
          SizedBox(height: 8.h),
          if (result.columns.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingRowHeight: 32.h,
                dataRowMinHeight: 32.h,
                dataRowMaxHeight: 36.h,
                columnSpacing: 16.w,
                headingTextStyle: TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13.sp,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
                dataTextStyle: TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13.sp,
                  color: AppColors.textPrimary,
                ),
                columns: result.columns
                    .map((col) => DataColumn(label: Text(col)))
                    .toList(),
                rows: result.rows.asMap().entries.map((entry) {
                  final isEven = entry.key % 2 == 0;
                  return DataRow(
                    color: WidgetStateProperty.all(
                      isEven ? AppColors.zebraRow : AppColors.cardBg,
                    ),
                    cells: entry.value
                        .map((cell) => DataCell(Text(cell?.toString() ?? 'NULL')))
                        .toList(),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}
