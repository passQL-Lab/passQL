import 'package:freezed_annotation/freezed_annotation.dart';

part 'topic_stat.freezed.dart';
part 'topic_stat.g.dart';

/// GET /progress/topic-analysis 응답 내 토픽별 집계 항목.
@freezed
class TopicStat with _$TopicStat {
  const factory TopicStat({
    required String topicUuid,
    required String displayName,
    required int totalQuestionCount,
    @Default(0.0) double correctRate,
    @Default(0) int solvedCount,
  }) = _TopicStat;

  factory TopicStat.fromJson(Map<String, dynamic> json) =>
      _$TopicStatFromJson(json);
}
