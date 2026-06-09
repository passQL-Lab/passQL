import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../data/models/progress/progress_response.dart';
import '../../data/models/progress/topic_analysis_response.dart';
import '../../data/models/progress/ai_comment_response.dart';
import '../../data/sources/progress_api.dart';
import 'member_store.dart';

/// 통계 화면 집계 모델.
/// 각 필드 nullable — API 실패 시 해당 섹션 graceful 숨김.
class StatsData {
  final ProgressResponse? progress;
  final TopicAnalysisResponse? topicAnalysis;
  final AiCommentResponse? aiComment;

  const StatsData({this.progress, this.topicAnalysis, this.aiComment});
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
/// progress + topicAnalysis + aiComment 3개 병렬 호출.
final statsDataProvider = FutureProvider<StatsData>((ref) async {
  final memberUuid =
      await ref.watch(memberStoreProvider.notifier).getOrRegister();

  final dio = ref.read(dioProvider);
  final progressClient = ProgressApiClient(dio);

  final results = await Future.wait([
    _safe(progressClient.getProgress(memberUuid)),
    _safe(progressClient.getTopicAnalysis(memberUuid)),
    _safe(progressClient.getAiComment(memberUuid)),
  ]);

  return StatsData(
    progress: results[0] as ProgressResponse?,
    topicAnalysis: results[1] as TopicAnalysisResponse?,
    aiComment: results[2] as AiCommentResponse?,
  );
});
