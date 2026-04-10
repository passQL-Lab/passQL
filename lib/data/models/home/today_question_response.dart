import 'package:freezed_annotation/freezed_annotation.dart';
import 'question_summary.dart';

part 'today_question_response.freezed.dart';
part 'today_question_response.g.dart';

/// GET /questions/today 응답.
/// question이 null이면 오늘의 문제 없음.
@freezed
class TodayQuestionResponse with _$TodayQuestionResponse {
  const factory TodayQuestionResponse({
    QuestionSummary? question,
    @Default(false) bool alreadySolvedToday,
  }) = _TodayQuestionResponse;

  factory TodayQuestionResponse.fromJson(Map<String, dynamic> json) =>
      _$TodayQuestionResponseFromJson(json);
}
