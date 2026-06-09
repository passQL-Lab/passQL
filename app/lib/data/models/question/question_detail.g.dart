// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question_detail.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$QuestionDetailImpl _$$QuestionDetailImplFromJson(Map<String, dynamic> json) =>
    _$QuestionDetailImpl(
      questionUuid: json['questionUuid'] as String,
      topicName: json['topicName'] as String?,
      subtopicName: json['subtopicName'] as String?,
      difficulty: (json['difficulty'] as num?)?.toInt(),
      executionMode: json['executionMode'] as String?,
      stem: json['stem'] as String,
      schemaDisplay: json['schemaDisplay'] as String?,
      schemaDdl: json['schemaDdl'] as String?,
      schemaSampleData: json['schemaSampleData'] as String?,
      schemaIntent: json['schemaIntent'] as String?,
      answerSql: json['answerSql'] as String?,
      hint: json['hint'] as String?,
      choiceSets:
          (json['choiceSets'] as List<dynamic>?)
              ?.map((e) => ChoiceSetSummary.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$QuestionDetailImplToJson(
  _$QuestionDetailImpl instance,
) => <String, dynamic>{
  'questionUuid': instance.questionUuid,
  'topicName': instance.topicName,
  'subtopicName': instance.subtopicName,
  'difficulty': instance.difficulty,
  'executionMode': instance.executionMode,
  'stem': instance.stem,
  'schemaDisplay': instance.schemaDisplay,
  'schemaDdl': instance.schemaDdl,
  'schemaSampleData': instance.schemaSampleData,
  'schemaIntent': instance.schemaIntent,
  'answerSql': instance.answerSql,
  'hint': instance.hint,
  'choiceSets': instance.choiceSets,
};
