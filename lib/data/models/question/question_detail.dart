import 'package:freezed_annotation/freezed_annotation.dart';
import 'choice_set_summary.dart';

part 'question_detail.freezed.dart';
part 'question_detail.g.dart';

/// 문제 상세 응답. executionMode에 따라 UI 분기.
/// EXECUTABLE: SQL 실행 + 스키마 표시
/// CONCEPT_ONLY: 텍스트 선택지만 표시
@freezed
class QuestionDetail with _$QuestionDetail {
  const factory QuestionDetail({
    required String questionUuid,
    String? topicName,
    String? subtopicName,
    int? difficulty,
    String? executionMode,
    required String stem,
    String? schemaDisplay,
    String? schemaDdl,
    String? schemaSampleData,
    String? schemaIntent,
    String? answerSql,
    String? hint,
    @Default([]) List<ChoiceSetSummary> choiceSets,
  }) = _QuestionDetail;

  factory QuestionDetail.fromJson(Map<String, dynamic> json) =>
      _$QuestionDetailFromJson(json);
}
