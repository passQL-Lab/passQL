import 'package:freezed_annotation/freezed_annotation.dart';
import '../home/question_summary.dart';

part 'question_list_response.freezed.dart';
part 'question_list_response.g.dart';

/// Spring Page wrapper for [QuestionSummary] responses.
@freezed
class QuestionListResponse with _$QuestionListResponse {
  const factory QuestionListResponse({
    required List<QuestionSummary> content,
    required int totalElements,
    required int totalPages,
    required int number,
    required bool last,
  }) = _QuestionListResponse;

  factory QuestionListResponse.fromJson(Map<String, dynamic> json) =>
      _$QuestionListResponseFromJson(json);
}
