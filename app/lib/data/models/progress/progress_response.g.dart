// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ProgressResponseImpl _$$ProgressResponseImplFromJson(
  Map<String, dynamic> json,
) => _$ProgressResponseImpl(
  solvedCount: (json['solvedCount'] as num).toInt(),
  correctRate: (json['correctRate'] as num).toDouble(),
  streakDays: (json['streakDays'] as num).toInt(),
  readiness: json['readiness'] == null
      ? null
      : ReadinessResponse.fromJson(json['readiness'] as Map<String, dynamic>),
);

Map<String, dynamic> _$$ProgressResponseImplToJson(
  _$ProgressResponseImpl instance,
) => <String, dynamic>{
  'solvedCount': instance.solvedCount,
  'correctRate': instance.correctRate,
  'streakDays': instance.streakDays,
  'readiness': instance.readiness,
};
