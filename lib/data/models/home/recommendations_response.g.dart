// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recommendations_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RecommendationsResponseImpl _$$RecommendationsResponseImplFromJson(
  Map<String, dynamic> json,
) => _$RecommendationsResponseImpl(
  questions:
      (json['questions'] as List<dynamic>?)
          ?.map((e) => QuestionSummary.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$RecommendationsResponseImplToJson(
  _$RecommendationsResponseImpl instance,
) => <String, dynamic>{'questions': instance.questions};
