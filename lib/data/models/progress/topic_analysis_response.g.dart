// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'topic_analysis_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TopicAnalysisResponseImpl _$$TopicAnalysisResponseImplFromJson(
  Map<String, dynamic> json,
) => _$TopicAnalysisResponseImpl(
  topicStats:
      (json['topicStats'] as List<dynamic>?)
          ?.map((e) => TopicStat.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$TopicAnalysisResponseImplToJson(
  _$TopicAnalysisResponseImpl instance,
) => <String, dynamic>{'topicStats': instance.topicStats};
