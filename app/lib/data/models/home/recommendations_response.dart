import 'package:freezed_annotation/freezed_annotation.dart';
import 'question_summary.dart';

part 'recommendations_response.freezed.dart';
part 'recommendations_response.g.dart';

/// GET /questions/recommendations 응답.
@freezed
class RecommendationsResponse with _$RecommendationsResponse {
  const factory RecommendationsResponse({
    @Default([]) List<QuestionSummary> questions,
  }) = _RecommendationsResponse;

  factory RecommendationsResponse.fromJson(Map<String, dynamic> json) =>
      _$RecommendationsResponseFromJson(json);
}
