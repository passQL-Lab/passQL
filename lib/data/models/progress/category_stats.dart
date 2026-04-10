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
