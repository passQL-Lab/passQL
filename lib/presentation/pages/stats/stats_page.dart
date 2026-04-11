import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../providers/stats_providers.dart';
import '../../widgets/stats/ai_analysis_card.dart';
import '../../widgets/stats/bar_chart_section.dart';
import '../../widgets/stats/radar_chart_section.dart';
import '../../widgets/stats/summary_stats_section.dart';

/// 통계 화면 — "내 실력, 한눈에"
/// statsDataProvider에서 progress + categoryStats를 받아 렌더링.
/// 로딩: shimmer 스켈레톤 / 에러: 재시도 버튼 / 성공: pull-to-refresh 지원.
class StatsPage extends ConsumerWidget {
  const StatsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(statsDataProvider);

    return Scaffold(
      backgroundColor: AppColors.pageBg,
      body: SafeArea(
        child: statsAsync.when(
          loading: () => const _StatsSkeletonLoader(),
          error: (error, _) => _StatsErrorView(
            onRetry: () => ref.invalidate(statsDataProvider),
          ),
          data: (data) => RefreshIndicator(
            color: AppColors.brandIndigo,
            onRefresh: () async {
              ref.invalidate(statsDataProvider);
              await ref.read(statsDataProvider.future);
            },
            child: _StatsScrollView(data: data),
          ),
        ),
      ),
    );
  }
}

/// 스크롤 가능한 통계 콘텐츠.
class _StatsScrollView extends StatelessWidget {
  final StatsData data;

  const _StatsScrollView({required this.data});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
      children: [
        // 화면 제목
        Text(
          '내 실력, 한눈에',
          style: AppTextStyles.heading_24.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        SizedBox(height: 6.h),
        Text(
          '약한 영역을 눌러 바로 연습해보세요',
          style: AppTextStyles.paragraph_14.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        SizedBox(height: 24.h),

        // 요약 통계 3개 카드
        SummaryStatsSection(progress: data.progress),
        SizedBox(height: 16.h),

        // AI 영역 분석 카드 (로컬 로직)
        AiAnalysisCard(
          progress: data.progress,
          categoryStats: data.categoryStats,
        ),
        SizedBox(height: 16.h),

        // 레이더 차트
        RadarChartSection(categoryStats: data.categoryStats),
        SizedBox(height: 16.h),

        // 카테고리별 가로 막대
        BarChartSection(categoryStats: data.categoryStats),
      ],
    );
  }
}

/// 로딩 shimmer 스켈레톤.
class _StatsSkeletonLoader extends StatelessWidget {
  const _StatsSkeletonLoader();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.borderDefault,
      highlightColor: AppColors.pageBg,
      child: ListView(
        padding: EdgeInsets.fromLTRB(16.w, 24.h, 16.w, 32.h),
        children: [
          // 제목 스켈레톤
          Container(
            width: 160.w,
            height: 28.h,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6.r),
            ),
          ),
          SizedBox(height: 8.h),
          Container(
            width: 220.w,
            height: 16.h,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6.r),
            ),
          ),
          SizedBox(height: 24.h),

          // 요약 통계 3개 카드 스켈레톤
          Row(
            children: List.generate(
              3,
              (i) => [
                Expanded(
                  child: Container(
                    height: 80.h,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                  ),
                ),
                if (i < 2) SizedBox(width: 12.w),
              ],
            ).expand((e) => e).toList(),
          ),
          SizedBox(height: 16.h),

          // AI 카드, 레이더, 막대 스켈레톤
          ...List.generate(
            3,
            (i) => Padding(
              padding: EdgeInsets.only(bottom: 16.h),
              child: Container(
                height: i == 0 ? 80.h : 280.h,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// API 에러 시 재시도 뷰.
class _StatsErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _StatsErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '통계를 불러오지 못했습니다',
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
