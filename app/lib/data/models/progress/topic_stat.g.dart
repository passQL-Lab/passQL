// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'topic_stat.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TopicStatImpl _$$TopicStatImplFromJson(Map<String, dynamic> json) =>
    _$TopicStatImpl(
      topicUuid: json['topicUuid'] as String,
      displayName: json['displayName'] as String,
      totalQuestionCount: (json['totalQuestionCount'] as num).toInt(),
      correctRate: (json['correctRate'] as num?)?.toDouble() ?? 0.0,
      solvedCount: (json['solvedCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$TopicStatImplToJson(_$TopicStatImpl instance) =>
    <String, dynamic>{
      'topicUuid': instance.topicUuid,
      'displayName': instance.displayName,
      'totalQuestionCount': instance.totalQuestionCount,
      'correctRate': instance.correctRate,
      'solvedCount': instance.solvedCount,
    };
