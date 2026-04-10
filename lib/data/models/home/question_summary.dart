import 'package:freezed_annotation/freezed_annotation.dart';

part 'question_summary.freezed.dart';
part 'question_summary.g.dart';

/// 오늘의 문제/추천 문제 카드에서 사용하는 축약 문제 모델.
/// difficulty: 1(쉬움), 2(보통), 3(어려움)
@freezed
class QuestionSummary with _$QuestionSummary {
  const factory QuestionSummary({
    required String questionUuid,
    String? topicName,
    String? stemPreview,
    int? difficulty,
    String? executionMode,
  }) = _QuestionSummary;

  factory QuestionSummary.fromJson(Map<String, dynamic> json) =>
      _$QuestionSummaryFromJson(json);
}
