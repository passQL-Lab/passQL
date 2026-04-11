import 'package:freezed_annotation/freezed_annotation.dart';
import 'topic_stat.dart';

part 'topic_analysis_response.freezed.dart';
part 'topic_analysis_response.g.dart';

/// GET /progress/topic-analysis 응답.
@freezed
class TopicAnalysisResponse with _$TopicAnalysisResponse {
  const factory TopicAnalysisResponse({
    @Default([]) List<TopicStat> topicStats,
  }) = _TopicAnalysisResponse;

  factory TopicAnalysisResponse.fromJson(Map<String, dynamic> json) =>
      _$TopicAnalysisResponseFromJson(json);
}
