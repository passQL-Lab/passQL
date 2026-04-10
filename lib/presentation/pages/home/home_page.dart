import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../providers/home_providers.dart';
import '../../widgets/home/exam_schedule_card.dart';
import '../../widgets/home/fallback_stats_section.dart';
import '../../widgets/home/greeting_section.dart';
import '../../widgets/home/heatmap_widget.dart';
import '../../widgets/home/readiness_card.dart';
import '../../widgets/home/recommendations_section.dart';
import '../../widgets/home/today_question_card.dart';

/// 홈 화면.
/// homeDataProvider에서 6개 API 병렬 결과를 받아 렌더링.
/// 로딩 중: shimmer 스켈레톤 / 에러: 재시도 버튼.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: homeAsync.when(
          loading: () => const _HomeSkeletonLoader(),
          error: (error, _) => _HomeErrorView(
            onRetry: () => ref.invalidate(homeDataProvider),
          ),
          data: (data) => RefreshIndicator(
            color: AppColors.brandIndigo,
            onRefresh: () async {
              ref.invalidate(homeDataProvider);
              await ref.read(homeDataProvider.future);
            },
            child: _HomeScrollView(data: data),
          ),
        ),
      ),
    );
  }
}

/// 스크롤 가능한 홈 콘텐츠.
class _HomeScrollView extends StatelessWidget {
  final HomeData data;

  const _HomeScrollView({required this.data});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
      children: [
        // 인사 섹션
        if (data.greeting != null)
          Padding(
            padding: EdgeInsets.only(bottom: 24.h),
            child: GreetingSection(greeting: data.greeting!),
          ),

        // 2열 카드 그리드: 오늘의 문제 + 시험 일정
        Padding(
          padding: EdgeInsets.only(bottom: 16.h),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TodayQuestionCard(
                  todayQuestion: data.todayQuestion,
                  onTap: data.todayQuestion?.question != null
                      ? () => context.push(
                            '/questions/${data.todayQuestion!.question!.questionUuid}',
                          )
                      : () => context.go('/questions'),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: ExamScheduleCard(schedule: data.examSchedule),
              ),
            ],
          ),
        ),

        // 합격 준비도 카드 (readiness 있을 때)
        if (data.progress?.readiness != null)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: ReadinessCard(readiness: data.progress!.readiness!),
          ),

        // readiness 없을 때 Fallback 통계 카드
        if (data.progress != null && data.progress!.readiness == null)
          Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: FallbackStatsSection(
              solvedCount: data.progress!.solvedCount,
              correctRate: data.progress!.correctRate,
            ),
          ),

        // 히트맵
        Padding(
          padding: EdgeInsets.only(bottom: 24.h),
          child: HeatmapWidget(
            heatmap: data.heatmap,
            streakDays: data.progress?.streakDays ?? 0,
          ),
        ),

        // 추천 문제 섹션
        if (data.recommendations != null &&
            data.recommendations!.questions.isNotEmpty)
          RecommendationsSection(
            questions: data.recommendations!.questions,
            onQuestionTap: (uuid) => context.push('/questions/$uuid'),
          ),
      ],
    );
  }
}

/// 로딩 중 shimmer 스켈레톤.
class _HomeSkeletonLoader extends StatelessWidget {
  const _HomeSkeletonLoader();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.borderDefault,
      highlightColor: AppColors.cardBg,
      child: ListView(
        padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
        children: [
          // 인사 섹션
          Container(
            height: 60.h,
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(8.r),
            ),
          ),
          SizedBox(height: 24.h),
          // 2열 카드
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 140.h,
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Container(
                  height: 140.h,
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          // 준비도 카드
          Container(
            height: 180.h,
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
          SizedBox(height: 16.h),
          // 히트맵
          Container(
            height: 160.h,
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(12.r),
            ),
          ),
        ],
      ),
    );
  }
}

/// API 에러 시 재시도 뷰.
class _HomeErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _HomeErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '데이터를 불러오지 못했어요.',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 16.h),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
              decoration: BoxDecoration(
                color: AppColors.brandIndigo,
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Text(
                '다시 시도',
                style: AppTextStyles.label_16.copyWith(
                  color: AppColors.cardBg,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
