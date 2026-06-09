import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../presentation/providers/topic_providers.dart';
import '../../../router/app_routes.dart';
import '../../widgets/question/topic_card.dart';

/// 문제 탭 1단계 — 토픽 선택 화면.
/// 토픽 카드 탭 시 /questions/list?topic=CODE&topicName=NAME으로 이동.
class TopicListPage extends ConsumerWidget {
  const TopicListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topicsAsync = ref.watch(topicsProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 헤더
            Padding(
              padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 8.h),
              child: Text(
                '문제',
                style: AppTextStyles.heading_24
                    .copyWith(color: AppColors.textPrimary),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 16.h),
              child: Text(
                '학습할 토픽을 선택하세요',
                style: AppTextStyles.paragraph_14
                    .copyWith(color: AppColors.textSecondary),
              ),
            ),

            // 토픽 그리드
            Expanded(
              child: topicsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(
                  child: Text(
                    '토픽을 불러올 수 없어요',
                    style: AppTextStyles.paragraph_14
                        .copyWith(color: AppColors.textSecondary),
                  ),
                ),
                data: (topics) => GridView.builder(
                  padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12.w,
                    mainAxisSpacing: 12.h,
                    childAspectRatio: 1.4,
                  ),
                  itemCount: topics.length,
                  itemBuilder: (_, i) {
                    final topic = topics[i];
                    return TopicCard(
                      topic: topic,
                      onTap: () => context.push(
                        '${AppRoutes.questionChapter}'
                        '?topic=${topic.code}'
                        '&topicName=${Uri.encodeComponent(topic.displayName)}',
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
