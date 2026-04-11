// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'choice_set_summary.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ChoiceSetSummaryImpl _$$ChoiceSetSummaryImplFromJson(
  Map<String, dynamic> json,
) => _$ChoiceSetSummaryImpl(
  choiceSetUuid: json['choiceSetUuid'] as String,
  source: json['source'] as String,
  status: json['status'] as String,
  sandboxValidationPassed: json['sandboxValidationPassed'] as bool?,
  createdAt: json['createdAt'] as String?,
  items:
      (json['items'] as List<dynamic>?)
          ?.map((e) => ChoiceItem.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$ChoiceSetSummaryImplToJson(
  _$ChoiceSetSummaryImpl instance,
) => <String, dynamic>{
  'choiceSetUuid': instance.choiceSetUuid,
  'source': instance.source,
  'status': instance.status,
  'sandboxValidationPassed': instance.sandboxValidationPassed,
  'createdAt': instance.createdAt,
  'items': instance.items,
};
