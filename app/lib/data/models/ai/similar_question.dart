import 'package:freezed_annotation/freezed_annotation.dart';

part 'similar_question.freezed.dart';
part 'similar_question.g.dart';

/// AI 유사 문제. score: 유사도 점수(0~1).
@freezed
class SimilarQuestion with _$SimilarQuestion {
  const factory SimilarQuestion({
    required String questionUuid,
    String? stem,
    String? topicName,
    double? score,
  }) = _SimilarQuestion;

  factory SimilarQuestion.fromJson(Map<String, dynamic> json) =>
      _$SimilarQuestionFromJson(json);
}
