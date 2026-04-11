// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question_list_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$QuestionListResponseImpl _$$QuestionListResponseImplFromJson(
  Map<String, dynamic> json,
) => _$QuestionListResponseImpl(
  content: (json['content'] as List<dynamic>)
      .map((e) => QuestionSummary.fromJson(e as Map<String, dynamic>))
      .toList(),
  totalElements: (json['totalElements'] as num).toInt(),
  totalPages: (json['totalPages'] as num).toInt(),
  number: (json['number'] as num).toInt(),
  last: json['last'] as bool,
);

Map<String, dynamic> _$$QuestionListResponseImplToJson(
  _$QuestionListResponseImpl instance,
) => <String, dynamic>{
  'content': instance.content,
  'totalElements': instance.totalElements,
  'totalPages': instance.totalPages,
  'number': instance.number,
  'last': instance.last,
};
