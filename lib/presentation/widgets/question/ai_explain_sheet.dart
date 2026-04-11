import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/sources/ai_api.dart';
import '../../../presentation/providers/member_store.dart';

/// AI 해설 바텀시트. questionUuid와 요청 payload를 받아 AI 해설을 표시.
/// isErrorExplain=true: explain-error 엔드포인트
/// isErrorExplain=false: diff-explain 엔드포인트
class AiExplainSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> payload;
  final bool isErrorExplain;

  const AiExplainSheet({
    super.key,
    required this.payload,
    required this.isErrorExplain,
  });

  static Future<void> show(
    BuildContext context, {
    required Map<String, dynamic> payload,
    required bool isErrorExplain,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AiExplainSheet(
        payload: payload,
        isErrorExplain: isErrorExplain,
      ),
    );
  }

  @override
  ConsumerState<AiExplainSheet> createState() => _AiExplainSheetState();
}

class _AiExplainSheetState extends ConsumerState<AiExplainSheet> {
  String? _text;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchExplain();
  }

  Future<void> _fetchExplain() async {
    try {
      final dio = ref.read(dioProvider);
      final memberUuid = ref.read(memberStoreProvider).valueOrNull ?? '';
      final client = AiApiClient(dio);
      final result = widget.isErrorExplain
          ? await client.explainError(memberUuid, widget.payload)
          : await client.diffExplain(memberUuid, widget.payload);
      if (mounted) setState(() { _text = result.text; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'AI 해설을 불러올 수 없어요'; _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      builder: (_, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16.r)),
          ),
          child: Column(
            children: [
              // 드래그 핸들
              Container(
                margin: EdgeInsets.symmetric(vertical: 12.h),
                width: 40.w,
                height: 4.h,
                decoration: BoxDecoration(
                  color: AppColors.borderMuted,
                  borderRadius: BorderRadius.circular(999.r),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20.w),
                child: Text(
                  'AI 해설',
                  style: AppTextStyles.heading_20
                      .copyWith(color: AppColors.textPrimary),
                ),
              ),
              SizedBox(height: 12.h),
              const Divider(color: AppColors.borderDefault, height: 1),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? Center(
                            child: Text(
                              _error!,
                              style: AppTextStyles.paragraph_14
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          )
                        : SingleChildScrollView(
                            controller: scrollController,
                            padding: EdgeInsets.all(20.w),
                            child: Text(
                              _text ?? '',
                              style: AppTextStyles.paragraph_14
                                  .copyWith(color: AppColors.textPrimary),
                            ),
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}
