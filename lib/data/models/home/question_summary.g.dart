// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$QuestionSummaryImpl _$$QuestionSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$QuestionSummaryImpl(
  questionUuid: json['questionUuid'] as String,
  topicName: json['topicName'] as String?,
  stemPreview: json['stemPreview'] as String?,
  difficulty: (json['difficulty'] as num?)?.toInt(),
  executionMode: json['executionMode'] as String?,
);

Map<String, dynamic> _$$QuestionSummaryImplToJson(
  _$QuestionSummaryImpl instance,
) => <String, dynamic>{
  'questionUuid': instance.questionUuid,
  'topicName': instance.topicName,
  'stemPreview': instance.stemPreview,
  'difficulty': instance.difficulty,
  'executionMode': instance.executionMode,
};
