// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'readiness_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ReadinessResponseImpl _$$ReadinessResponseImplFromJson(
  Map<String, dynamic> json,
) => _$ReadinessResponseImpl(
  score: (json['score'] as num).toDouble(),
  accuracy: (json['accuracy'] as num).toDouble(),
  coverage: (json['coverage'] as num).toDouble(),
  recency: (json['recency'] as num).toDouble(),
  lastStudiedAt: json['lastStudiedAt'] as String?,
  recentAttemptCount: (json['recentAttemptCount'] as num).toInt(),
  coveredTopicCount: (json['coveredTopicCount'] as num).toInt(),
  activeTopicCount: (json['activeTopicCount'] as num).toInt(),
  daysUntilExam: (json['daysUntilExam'] as num?)?.toInt(),
  toneKey: json['toneKey'] as String,
);

Map<String, dynamic> _$$ReadinessResponseImplToJson(
  _$ReadinessResponseImpl instance,
) => <String, dynamic>{
  'score': instance.score,
  'accuracy': instance.accuracy,
  'coverage': instance.coverage,
  'recency': instance.recency,
  'lastStudiedAt': instance.lastStudiedAt,
  'recentAttemptCount': instance.recentAttemptCount,
  'coveredTopicCount': instance.coveredTopicCount,
  'activeTopicCount': instance.activeTopicCount,
  'daysUntilExam': instance.daysUntilExam,
  'toneKey': instance.toneKey,
};
