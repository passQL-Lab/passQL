import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/progress/progress_response.dart';
import '../models/progress/heatmap_response.dart';
import '../models/progress/topic_analysis_response.dart';
import '../models/progress/ai_comment_response.dart';

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

  /// 토픽별 정답률/문제수 분석 (레이더 차트 + 막대 차트용).
  @GET('/progress/topic-analysis')
  Future<TopicAnalysisResponse> getTopicAnalysis(
    @Query('memberUuid') String memberUuid,
  );

  /// AI 영역 분석 코멘트 (Redis 24h 캐시, AI 호출 latency 있음).
  @GET('/progress/ai-comment')
  Future<AiCommentResponse> getAiComment(
    @Query('memberUuid') String memberUuid,
  );
}
