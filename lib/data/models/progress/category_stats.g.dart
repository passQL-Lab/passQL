// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_stats.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryStatsImpl _$$CategoryStatsImplFromJson(Map<String, dynamic> json) =>
    _$CategoryStatsImpl(
      topicCode: json['topicCode'] as String,
      topicName: json['topicName'] as String,
      solvedCount: (json['solvedCount'] as num).toInt(),
      correctCount: (json['correctCount'] as num).toInt(),
      totalQuestionCount: (json['totalQuestionCount'] as num).toInt(),
      correctRate: (json['correctRate'] as num?)?.toDouble() ?? 0.0,
    );

Map<String, dynamic> _$$CategoryStatsImplToJson(_$CategoryStatsImpl instance) =>
    <String, dynamic>{
      'topicCode': instance.topicCode,
      'topicName': instance.topicName,
      'solvedCount': instance.solvedCount,
      'correctCount': instance.correctCount,
      'totalQuestionCount': instance.totalQuestionCount,
      'correctRate': instance.correctRate,
    };
