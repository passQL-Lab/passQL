import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/home/greeting_response.dart';
import '../../data/models/home/recommendations_response.dart';
import '../../data/models/home/today_question_response.dart';
import '../../data/models/progress/heatmap_response.dart';
import '../../data/models/progress/progress_response.dart';
import '../../data/models/exam/exam_schedule_response.dart';
import '../../data/sources/exam_schedule_api.dart';
import '../../data/sources/home_api.dart';
import '../../data/sources/progress_api.dart';
import '../../data/sources/question_api.dart';
import 'member_store.dart';

/// 홈 화면에 필요한 모든 API 응답을 담는 집계 모델.
/// 각 필드는 nullable — API 실패 시 해당 섹션을 graceful하게 숨김 처리.
class HomeData {
  final GreetingResponse? greeting;
  final ProgressResponse? progress;
  final TodayQuestionResponse? todayQuestion;
  final RecommendationsResponse? recommendations;
  final ExamScheduleResponse? examSchedule;
  final HeatmapResponse? heatmap;

  const HomeData({
    this.greeting,
    this.progress,
    this.todayQuestion,
    this.recommendations,
    this.examSchedule,
    this.heatmap,
  });
}

/// API 호출 실패를 null로 처리하는 헬퍼.
Future<T?> _safe<T>(Future<T> call) async {
  try {
    return await call;
  } catch (_) {
    return null;
  }
}

/// 홈 화면 데이터 Provider.
///
/// memberStoreProvider에서 UUID를 읽어 6개 API를 병렬 호출.
/// 개별 API 실패는 null로 처리 — 전체 화면 에러 방지.
final homeDataProvider = FutureProvider<HomeData>((ref) async {
  final memberUuid =
      await ref.watch(memberStoreProvider.notifier).getOrRegister();

  final dio = ref.read(dioProvider);
  final homeClient = HomeApiClient(dio);
  final progressClient = ProgressApiClient(dio);
  final questionClient = QuestionApiClient(dio);
  final examClient = ExamScheduleApiClient(dio);

  // 6개 API 병렬 호출.
  // getRecommendations(size, excludeQuestionUuid) — 둘 다 positional 파라미터.
  // getHeatmap(memberUuid, from, to) — from/to는 nullable String.
  final results = await Future.wait([
    _safe(homeClient.getGreeting(memberUuid)),
    _safe(progressClient.getProgress(memberUuid)),
    _safe(questionClient.getTodayQuestion(memberUuid)),
    _safe(questionClient.getRecommendations(3, null)),
    _safe(examClient.getSelectedSchedule()),
    _safe(progressClient.getHeatmap(memberUuid, null, null)),
  ]);

  return HomeData(
    greeting: results[0] as GreetingResponse?,
    progress: results[1] as ProgressResponse?,
    todayQuestion: results[2] as TodayQuestionResponse?,
    recommendations: results[3] as RecommendationsResponse?,
    examSchedule: results[4] as ExamScheduleResponse?,
    heatmap: results[5] as HeatmapResponse?,
  );
});
