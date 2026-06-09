# Stats Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "내 실력, 한눈에" 통계 화면 구현 — 요약 통계 3개, AI 영역 분석 카드, 레이더 차트(영역별 분석), 가로 막대 차트(카테고리별 문제 수)

**Architecture:** StatsData FutureProvider에서 progress + categoryStats 2개 API를 병렬 호출. 각 위젯은 독립 파일로 분리. 레이더 차트는 fl_chart RadarChart, 가로 막대 차트는 커스텀 Row+Container 구현.

**Tech Stack:** Flutter, Riverpod FutureProvider, fl_chart ^0.70.0, freezed, retrofit, flutter_screenutil, AppColors, AppTextStyles

---

## File Structure

### 신규 생성
| 파일 | 역할 |
|------|------|
| `lib/data/models/progress/category_stats.dart` | CategoryStats freezed 모델 |
| `lib/presentation/providers/stats_providers.dart` | StatsData + statsDataProvider FutureProvider |
| `lib/presentation/widgets/stats/summary_stats_section.dart` | 3개 요약 통계 카드 Row |
| `lib/presentation/widgets/stats/ai_analysis_card.dart` | 로컬 생성 AI 영역 분석 텍스트 카드 |
| `lib/presentation/widgets/stats/radar_chart_section.dart` | fl_chart RadarChart 래퍼 |
| `lib/presentation/widgets/stats/bar_chart_section.dart` | 가로 막대 차트 (커스텀) |

### 수정
| 파일 | 변경 내용 |
|------|---------|
| `pubspec.yaml` | fl_chart: ^0.70.0 추가 |
| `lib/data/sources/progress_api.dart` | getCategoryStats 엔드포인트 추가 |
| `lib/presentation/pages/stats/stats_page.dart` | 플레이스홀더 → 전체 구현 교체 |

---

### Task 1: fl_chart 패키지 추가

**Files:**
- Modify: `pubspec.yaml`

- [ ] **Step 1: pubspec.yaml에 fl_chart 추가**

`dependencies:` 블록 내 `# UI/UX` 섹션 끝에 추가:

```yaml
  # 차트
  fl_chart: ^0.70.0
```

- [ ] **Step 2: 패키지 설치**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub get
```

Expected output: `Got dependencies!`

- [ ] **Step 3: 커밋**

```bash
git add pubspec.yaml pubspec.lock
git commit -m "chore: fl_chart 패키지 추가 (통계 화면 레이더 차트용)"
```

---

### Task 2: CategoryStats 모델 생성

**Files:**
- Create: `lib/data/models/progress/category_stats.dart`
- Create: `lib/data/models/progress/category_stats.freezed.dart` (코드 생성)
- Create: `lib/data/models/progress/category_stats.g.dart` (코드 생성)

- [ ] **Step 1: category_stats.dart 생성**

```dart
// lib/data/models/progress/category_stats.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'category_stats.freezed.dart';
part 'category_stats.g.dart';

/// GET /progress/categories 응답 단일 항목.
/// correctRate: 0.0~1.0 (마지막 시도 기준)
/// totalQuestionCount: 해당 토픽 전체 문제 수
@freezed
class CategoryStats with _$CategoryStats {
  const factory CategoryStats({
    required String topicCode,
    required String topicName,
    required int solvedCount,
    required int correctCount,
    required int totalQuestionCount,
    @Default(0.0) double correctRate,
  }) = _CategoryStats;

  factory CategoryStats.fromJson(Map<String, dynamic> json) =>
      _$CategoryStatsFromJson(json);
}
```

- [ ] **Step 2: 코드 생성 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

Expected: `category_stats.freezed.dart`, `category_stats.g.dart` 파일 생성됨

- [ ] **Step 3: 커밋**

```bash
git add lib/data/models/progress/category_stats.dart \
        lib/data/models/progress/category_stats.freezed.dart \
        lib/data/models/progress/category_stats.g.dart
git commit -m "feat: CategoryStats freezed 모델 추가 (카테고리별 학습 통계)"
```

---

### Task 3: ProgressApiClient에 getCategoryStats 추가

**Files:**
- Modify: `lib/data/sources/progress_api.dart`

- [ ] **Step 1: progress_api.dart 업데이트**

기존 파일 전체를 아래로 교체:

```dart
// lib/data/sources/progress_api.dart
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/progress/progress_response.dart';
import '../models/progress/heatmap_response.dart';
import '../models/progress/category_stats.dart';

part 'progress_api.g.dart';

@RestApi()
abstract class ProgressApiClient {
  factory ProgressApiClient(Dio dio, {String baseUrl}) = _ProgressApiClient;

  /// 전체 학습 현황.
  @GET('/progress')
  Future<ProgressResponse> getProgress(@Query('memberUuid') String memberUuid);

  /// 날짜별 학습 히트맵.
  @GET('/progress/heatmap')
  Future<HeatmapResponse> getHeatmap(
    @Query('memberUuid') String memberUuid,
    @Query('from') String? from,
    @Query('to') String? to,
  );

  /// 카테고리별 학습 통계. (미문서화 — 에러 시 null 처리)
  @GET('/progress/categories')
  Future<List<CategoryStats>> getCategoryStats(
    @Query('memberUuid') String memberUuid,
  );
}
```

- [ ] **Step 2: 코드 생성 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter pub run build_runner build --delete-conflicting-outputs
```

Expected: `progress_api.g.dart` 재생성됨

- [ ] **Step 3: 커밋**

```bash
git add lib/data/sources/progress_api.dart \
        lib/data/sources/progress_api.g.dart
git commit -m "feat: ProgressApiClient에 getCategoryStats 엔드포인트 추가"
```

---

### Task 4: stats_providers.dart 생성

**Files:**
- Create: `lib/presentation/providers/stats_providers.dart`

- [ ] **Step 1: stats_providers.dart 생성**

```dart
// lib/presentation/providers/stats_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/progress/progress_response.dart';
import '../../data/models/progress/category_stats.dart';
import '../../data/sources/progress_api.dart';
import 'member_store.dart';

/// 통계 화면에 필요한 API 응답 집계 모델.
/// categoryStats는 미문서화 API — 실패 시 null로 graceful 처리.
class StatsData {
  final ProgressResponse? progress;
  final List<CategoryStats>? categoryStats;

  const StatsData({this.progress, this.categoryStats});
}

/// API 호출 실패를 null로 처리하는 헬퍼.
Future<T?> _safe<T>(Future<T> call) async {
  try {
    return await call;
  } catch (_) {
    return null;
  }
}

/// 통계 화면 데이터 Provider.
/// progress + categoryStats를 병렬 호출.
final statsDataProvider = FutureProvider<StatsData>((ref) async {
  final memberUuid =
      await ref.watch(memberStoreProvider.notifier).getOrRegister();

  final dio = ref.read(dioProvider);
  final progressClient = ProgressApiClient(dio);

  final results = await Future.wait([
    _safe(progressClient.getProgress(memberUuid)),
    _safe(progressClient.getCategoryStats(memberUuid)),
  ]);

  return StatsData(
    progress: results[0] as ProgressResponse?,
    categoryStats: results[1] as List<CategoryStats>?,
  );
});
```

- [ ] **Step 2: 빌드 체크**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter analyze lib/presentation/providers/stats_providers.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/providers/stats_providers.dart
git commit -m "feat: statsDataProvider FutureProvider 추가 (통계 화면용)"
```

---

### Task 5: SummaryStatsSection 위젯 생성

**Files:**
- Create: `lib/presentation/widgets/stats/summary_stats_section.dart`

- [ ] **Step 1: summary_stats_section.dart 생성**

```dart
// lib/presentation/widgets/stats/summary_stats_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/progress_response.dart';

/// 상단 3개 요약 통계 카드 Row.
/// solvedCount / correctRate(%) / streakDays
class SummaryStatsSection extends StatelessWidget {
  final ProgressResponse? progress;

  const SummaryStatsSection({super.key, required this.progress});

  @override
  Widget build(BuildContext context) {
    final solved = progress?.solvedCount ?? 0;
    final rate = progress != null
        ? (progress!.correctRate * 100).round()
        : 0;
    final streak = progress?.streakDays ?? 0;

    return Row(
      children: [
        Expanded(child: _StatCard(value: '$solved문제', label: '푼 문제')),
        SizedBox(width: 12.w),
        Expanded(child: _StatCard(value: '$rate%', label: '합격 준비도')),
        SizedBox(width: 12.w),
        Expanded(child: _StatCard(value: '$streak일', label: '연속 학습')),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;

  const _StatCard({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 20.h),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: AppTextStyles.heading_24.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            label,
            style: AppTextStyles.tag_12.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/presentation/widgets/stats/summary_stats_section.dart
git commit -m "feat: SummaryStatsSection 위젯 추가 (요약 통계 3개 카드)"
```

---

### Task 6: AiAnalysisCard 위젯 생성

**Files:**
- Create: `lib/presentation/widgets/stats/ai_analysis_card.dart`

- [ ] **Step 1: ai_analysis_card.dart 생성**

```dart
// lib/presentation/widgets/stats/ai_analysis_card.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/progress_response.dart';
import '../../../data/models/progress/category_stats.dart';

/// 로컬 분석 텍스트 기반 AI 영역 분석 카드.
/// correctRate와 categoryStats에서 가장 취약한 영역을 추출해 메시지 생성.
class AiAnalysisCard extends StatelessWidget {
  final ProgressResponse? progress;
  final List<CategoryStats>? categoryStats;

  const AiAnalysisCard({
    super.key,
    required this.progress,
    required this.categoryStats,
  });

  /// 취약 영역 기반 분석 메시지 생성.
  String _buildAnalysisMessage() {
    final rate = progress?.correctRate ?? 0.0;
    final solved = progress?.solvedCount ?? 0;

    if (solved == 0) {
      return '아직 학습을 시작하지 않으셨네요. 오늘의 문제부터 풀어보세요!';
    }

    // 취약 영역 (correctRate 낮은 순 정렬)
    final weakTopics = (categoryStats ?? [])
      ..sort((a, b) => a.correctRate.compareTo(b.correctRate));
    final weakName = weakTopics.isNotEmpty ? weakTopics.first.topicName : null;

    if (rate == 0.0) {
      return '모든 토픽에서 정답률이 0%로 나타나 SQL 학습에 전반적인 어려움을 겪고 계신 것으로 보입니다.'
          '${weakName != null ? " 특히 '$weakName'부터 차근차근 복습해보세요." : ""}';
    } else if (rate < 0.4) {
      final msg = weakName != null
          ? "'$weakName' 영역이 가장 취약합니다. 해당 영역 문제를 집중적으로 풀어보세요."
          : '정답률이 낮습니다. 기초부터 차근차근 복습해보세요.';
      return msg;
    } else if (rate < 0.7) {
      final msg = weakName != null
          ? "전반적으로 중간 수준입니다. '$weakName' 영역에 집중하면 합격에 한 걸음 더 가까워질 수 있습니다."
          : '전반적으로 중간 수준입니다. 취약 영역을 더 집중적으로 학습해보세요.';
      return msg;
    } else {
      final msg = weakName != null
          ? "전반적으로 좋은 성과를 보이고 계십니다! '$weakName' 영역을 조금 더 다듬으면 완벽해질 것 같습니다."
          : '전반적으로 좋은 성과를 보이고 계십니다! 꾸준히 유지해나가세요.';
      return msg;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36.r,
            height: 36.r,
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Center(
              child: FaIcon(
                FontAwesomeIcons.robot,
                size: 16.r,
                color: AppColors.brandIndigo,
              ),
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI 영역 분석',
                  style: AppTextStyles.paragraph14Semibold.copyWith(
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 6.h),
                Text(
                  _buildAnalysisMessage(),
                  style: AppTextStyles.paragraph_14.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/presentation/widgets/stats/ai_analysis_card.dart
git commit -m "feat: AiAnalysisCard 위젯 추가 (취약 영역 로컬 분석 메시지)"
```

---

### Task 7: RadarChartSection 위젯 생성

**Files:**
- Create: `lib/presentation/widgets/stats/radar_chart_section.dart`

- [ ] **Step 1: radar_chart_section.dart 생성**

```dart
// lib/presentation/widgets/stats/radar_chart_section.dart
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/category_stats.dart';

/// 영역별 분석 레이더(스파이더) 차트 섹션.
/// categoryStats가 없으면 빈 상태 메시지 표시.
class RadarChartSection extends StatelessWidget {
  final List<CategoryStats>? categoryStats;

  const RadarChartSection({super.key, required this.categoryStats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '영역별 분석',
            style: AppTextStyles.subHeading_18.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 20.h),
          _buildChart(),
        ],
      ),
    );
  }

  Widget _buildChart() {
    final stats = categoryStats;

    // 데이터 없으면 빈 상태
    if (stats == null || stats.isEmpty) {
      return SizedBox(
        height: 220.h,
        child: Center(
          child: Text(
            '아직 학습 데이터가 없습니다',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textCaption,
            ),
          ),
        ),
      );
    }

    // correctRate 0.0~1.0 → 0~5 스케일로 변환
    final values = stats.map((s) => s.correctRate * 5).toList();
    final labels = stats.map((s) => s.topicName).toList();

    return SizedBox(
      height: 260.h,
      child: RadarChart(
        RadarChartData(
          radarShape: RadarShape.polygon,
          tickCount: 4,
          ticksTextStyle: const TextStyle(fontSize: 0, color: Colors.transparent),
          gridBorderData: BorderSide(
            color: AppColors.borderDefault,
            width: 1,
          ),
          radarBorderData: BorderSide(
            color: AppColors.borderMuted,
            width: 1,
          ),
          titlePositionPercentageOffset: 0.25,
          titleTextStyle: AppTextStyles.tag_10.copyWith(
            color: AppColors.textSecondary,
          ),
          getTitle: (index, angle) {
            final label = labels[index];
            // 긴 이름 줄바꿈
            final parts = label.split(' / ');
            return RadarChartTitle(
              text: parts.join('\n'),
              angle: 0,
            );
          },
          dataSets: [
            RadarDataSet(
              fillColor: AppColors.brandIndigo.withOpacity(0.15),
              borderColor: AppColors.brandIndigo,
              borderWidth: 2,
              entryRadius: 3,
              dataEntries: values.map((v) => RadarEntry(value: v)).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: 빌드 체크**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter analyze lib/presentation/widgets/stats/radar_chart_section.dart
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/widgets/stats/radar_chart_section.dart
git commit -m "feat: RadarChartSection 위젯 추가 (fl_chart 레이더 차트)"
```

---

### Task 8: BarChartSection 위젯 생성

**Files:**
- Create: `lib/presentation/widgets/stats/bar_chart_section.dart`

- [ ] **Step 1: bar_chart_section.dart 생성**

```dart
// lib/presentation/widgets/stats/bar_chart_section.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../core/app_colors.dart';
import '../../../core/text_styles.dart';
import '../../../data/models/progress/category_stats.dart';

/// 카테고리별 문제 수 가로 막대 차트 섹션.
/// totalQuestionCount 기준으로 막대 길이 비율 결정.
class BarChartSection extends StatelessWidget {
  final List<CategoryStats>? categoryStats;

  const BarChartSection({super.key, required this.categoryStats});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: AppColors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '카테고리별 문제 수',
            style: AppTextStyles.subHeading_18.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 16.h),
          _buildBars(),
        ],
      ),
    );
  }

  Widget _buildBars() {
    final stats = categoryStats;

    if (stats == null || stats.isEmpty) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 24.h),
        child: Center(
          child: Text(
            '아직 학습 데이터가 없습니다',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textCaption,
            ),
          ),
        ),
      );
    }

    // totalQuestionCount 최대값으로 비율 계산
    final maxCount = stats
        .map((s) => s.totalQuestionCount)
        .reduce((a, b) => a > b ? a : b);

    return Column(
      children: stats.map((stat) {
        final ratio = maxCount > 0
            ? stat.totalQuestionCount / maxCount
            : 0.0;

        return Padding(
          padding: EdgeInsets.only(bottom: 12.h),
          child: Row(
            children: [
              // 카테고리 이름 (고정 너비)
              SizedBox(
                width: 100.w,
                child: Text(
                  stat.topicName,
                  style: AppTextStyles.tag_10.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8.w),
              // 막대 (유연한 너비)
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4.r),
                  child: LinearProgressIndicator(
                    value: ratio,
                    minHeight: 8.h,
                    backgroundColor: AppColors.borderDefault,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.brandIndigo,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8.w),
              // 숫자
              SizedBox(
                width: 24.w,
                child: Text(
                  stat.totalQuestionCount.toString(),
                  style: AppTextStyles.tag_12.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/presentation/widgets/stats/bar_chart_section.dart
git commit -m "feat: BarChartSection 위젯 추가 (카테고리별 문제 수 가로 막대)"
```

---

### Task 9: StatsPage 완성

**Files:**
- Modify: `lib/presentation/pages/stats/stats_page.dart`

- [ ] **Step 1: stats_page.dart 전체 교체**

```dart
// lib/presentation/pages/stats/stats_page.dart
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
        // 헤더
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

        // AI 영역 분석 카드
        AiAnalysisCard(
          progress: data.progress,
          categoryStats: data.categoryStats,
        ),
        SizedBox(height: 16.h),

        // 레이더 차트 (영역별 분석)
        RadarChartSection(categoryStats: data.categoryStats),
        SizedBox(height: 16.h),

        // 가로 막대 차트 (카테고리별 문제 수)
        BarChartSection(categoryStats: data.categoryStats),
      ],
    );
  }
}

/// 로딩 스켈레톤.
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
          // 헤더 스켈레톤
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

          // 요약 카드 3개 스켈레톤
          Row(
            children: List.generate(3, (i) => [
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
            ]).expand((e) => e).toList(),
          ),
          SizedBox(height: 16.h),

          // 카드 스켈레톤 2개
          ...List.generate(3, (i) => Padding(
            padding: EdgeInsets.only(bottom: 16.h),
            child: Container(
              height: i == 0 ? 80.h : 260.h,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12.r),
              ),
            ),
          )),
        ],
      ),
    );
  }
}

/// 에러 뷰.
class _StatsErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _StatsErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '통계를 불러오지 못했습니다',
            style: AppTextStyles.paragraph_14.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          SizedBox(height: 12.h),
          TextButton(
            onPressed: onRetry,
            child: Text(
              '다시 시도',
              style: AppTextStyles.label_16.copyWith(
                color: AppColors.brandIndigo,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 2: flutter analyze 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter analyze lib/presentation/pages/stats/stats_page.dart \
               lib/presentation/providers/stats_providers.dart \
               lib/presentation/widgets/stats/
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add lib/presentation/pages/stats/stats_page.dart
git commit -m "feat: 통계 화면 구현 (요약 통계, AI 분석, 레이더/막대 차트) #stats"
```

---

### Task 10: 최종 통합 빌드 검증

**Files:** 없음 (빌드만)

- [ ] **Step 1: 전체 analyze 실행**

```bash
cd /Users/luca/Documents/GitHub/passql_app
flutter analyze
```

Expected: 에러 없음 (경고는 허용)

- [ ] **Step 2: 에뮬레이터/기기 연결 후 실행**

```bash
flutter run
```

확인 사항:
1. 앱 기동 — 통계 탭 클릭
2. 로딩 shimmer 표시
3. 데이터 로드 후: 헤더, 3개 통계 카드, AI 분석 카드, 레이더 차트, 막대 차트 순서로 표시
4. 당겨서 새로고침(RefreshIndicator) 동작 확인
5. 네트워크 오프라인 시 에러 뷰 + 재시도 버튼 확인

- [ ] **Step 3: 최종 커밋 (필요 시)**

```bash
git add -p
git commit -m "chore: 통계 화면 통합 검증 완료"
```

---

## Self-Review

### Spec 커버리지
| 요구사항 | 구현 태스크 |
|---------|-----------|
| "내 실력, 한눈에" 헤더 | Task 9 (_StatsScrollView) |
| 3개 요약 통계 카드 | Task 5 (SummaryStatsSection) |
| AI 영역 분석 카드 | Task 6 (AiAnalysisCard) |
| 레이더 차트 (영역별 분석) | Task 7 (RadarChartSection) |
| 가로 막대 차트 (카테고리별 문제 수) | Task 8 (BarChartSection) |
| 로딩 shimmer | Task 9 (_StatsSkeletonLoader) |
| 에러 + 재시도 | Task 9 (_StatsErrorView) |
| 당겨서 새로고침 | Task 9 (RefreshIndicator) |
| API graceful 처리 | Task 4 (statsDataProvider, _safe) |
| fl_chart 패키지 | Task 1 |

### 타입 일관성
- `CategoryStats` - Task 2에서 정의, Task 3~9까지 동일 타입명 사용
- `StatsData` - Task 4에서 정의, Task 9에서 임포트
- `ProgressResponse` - 기존 모델 그대로 재사용
- `statsDataProvider` - Task 4에서 정의, Task 9에서 watch

### Placeholder 없음
- 모든 스텝에 실제 코드 포함
- 빌드 검증 커맨드 포함
