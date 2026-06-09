// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'submit_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SubmitResultImpl _$$SubmitResultImplFromJson(
  Map<String, dynamic> json,
) => _$SubmitResultImpl(
  isCorrect: json['isCorrect'] as bool,
  correctKey: json['correctKey'] as String?,
  rationale: json['rationale'] as String?,
  selectedResult: json['selectedResult'] == null
      ? null
      : ExecuteResult.fromJson(json['selectedResult'] as Map<String, dynamic>),
  correctResult: json['correctResult'] == null
      ? null
      : ExecuteResult.fromJson(json['correctResult'] as Map<String, dynamic>),
  correctSql: json['correctSql'] as String?,
  selectedSql: json['selectedSql'] as String?,
);

Map<String, dynamic> _$$SubmitResultImplToJson(_$SubmitResultImpl instance) =>
    <String, dynamic>{
      'isCorrect': instance.isCorrect,
      'correctKey': instance.correctKey,
      'rationale': instance.rationale,
      'selectedResult': instance.selectedResult,
      'correctResult': instance.correctResult,
      'correctSql': instance.correctSql,
      'selectedSql': instance.selectedSql,
    };
