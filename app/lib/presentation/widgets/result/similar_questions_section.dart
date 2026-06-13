import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/models/ai/similar_question.dart';
import '../../../data/sources/ai_api.dart';
import '../../../router/app_routes.dart';

/// 유사 문제 리스트 섹션. 화면 진입 후 비동기 로드.
class SimilarQuestionsSection extends ConsumerStatefulWidget {
  final String questionUuid;

  const SimilarQuestionsSection({super.key, required this.questionUuid});

  @override
  ConsumerState<SimilarQuestionsSection> createState() =>
      _SimilarQuestionsSectionState();
}

class _SimilarQuestionsSectionState
    extends ConsumerState<SimilarQuestionsSection> {
  List<SimilarQuestion>? _questions;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final dio = ref.read(dioProvider);
      final result =
          await AiApiClient(dio).getSimilar(widget.questionUuid, 3);
      if (mounted) setState(() => _questions = result);
    } catch (_) {
      // 유사 문제는 옵션 — 실패 시 섹션 미표시
      if (mounted) setState(() => _questions = []);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_questions == null) {
      // 로딩 중
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 16.h),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    if (_questions!.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 8.h),
          child: Text(
            '유사 문제',
            style: AppTextStyles.subHeading_18
                .copyWith(color: AppColors.textPrimary),
          ),
        ),
        ..._questions!.map((q) => _SimilarCard(question: q)),
      ],
    );
  }
}

class _SimilarCard extends StatelessWidget {
  final SimilarQuestion question;
  const _SimilarCard({required this.question});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () =>
          context.push(AppRoutes.questionDetail(question.questionUuid)),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 20.w, vertical: 4.h),
        padding: EdgeInsets.all(14.w),
        decoration: BoxDecoration(
          color: AppColors.cardBg,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: AppColors.borderDefault),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (question.topicName != null)
                    Text(
                      question.topicName!,
                      style: AppTextStyles.tag_12
                          .copyWith(color: AppColors.brandIndigo),
                    ),
                  SizedBox(height: 4.h),
                  Text(
                    question.stem ?? '문제 보기',
                    style: AppTextStyles.paragraph_14
                        .copyWith(color: AppColors.textPrimary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AppColors.textCaption, size: 20.sp),
          ],
        ),
      ),
    );
  }
}
