// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'topic_tree.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$SubtopicItemImpl _$$SubtopicItemImplFromJson(Map<String, dynamic> json) =>
    _$SubtopicItemImpl(
      code: json['code'] as String,
      displayName: json['displayName'] as String,
      sortOrder: (json['sortOrder'] as num?)?.toInt(),
      isActive: json['isActive'] as bool?,
    );

Map<String, dynamic> _$$SubtopicItemImplToJson(_$SubtopicItemImpl instance) =>
    <String, dynamic>{
      'code': instance.code,
      'displayName': instance.displayName,
      'sortOrder': instance.sortOrder,
      'isActive': instance.isActive,
    };

_$TopicTreeImpl _$$TopicTreeImplFromJson(Map<String, dynamic> json) =>
    _$TopicTreeImpl(
      topicUuid: json['topicUuid'] as String,
      code: json['code'] as String,
      displayName: json['displayName'] as String,
      sortOrder: (json['sortOrder'] as num?)?.toInt(),
      isActive: json['isActive'] as bool?,
      subtopics:
          (json['subtopics'] as List<dynamic>?)
              ?.map((e) => SubtopicItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$$TopicTreeImplToJson(_$TopicTreeImpl instance) =>
    <String, dynamic>{
      'topicUuid': instance.topicUuid,
      'code': instance.code,
      'displayName': instance.displayName,
      'sortOrder': instance.sortOrder,
      'isActive': instance.isActive,
      'subtopics': instance.subtopics,
    };
