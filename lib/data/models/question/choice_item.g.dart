// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'choice_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ChoiceItemImpl _$$ChoiceItemImplFromJson(Map<String, dynamic> json) =>
    _$ChoiceItemImpl(
      key: json['key'] as String,
      kind: json['kind'] as String,
      body: json['body'] as String,
      isCorrect: json['isCorrect'] as bool?,
      rationale: json['rationale'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$ChoiceItemImplToJson(_$ChoiceItemImpl instance) =>
    <String, dynamic>{
      'key': instance.key,
      'kind': instance.kind,
      'body': instance.body,
      'isCorrect': instance.isCorrect,
      'rationale': instance.rationale,
      'sortOrder': instance.sortOrder,
    };
