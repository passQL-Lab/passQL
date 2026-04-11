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
