// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'similar_question.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SimilarQuestionImpl _$$SimilarQuestionImplFromJson(
  Map<String, dynamic> json,
) => _$SimilarQuestionImpl(
  questionUuid: json['questionUuid'] as String,
  stem: json['stem'] as String?,
  topicName: json['topicName'] as String?,
  score: (json['score'] as num?)?.toDouble(),
);

Map<String, dynamic> _$$SimilarQuestionImplToJson(
  _$SimilarQuestionImpl instance,
) => <String, dynamic>{
  'questionUuid': instance.questionUuid,
  'stem': instance.stem,
  'topicName': instance.topicName,
  'score': instance.score,
};
