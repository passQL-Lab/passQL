// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'heatmap_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$HeatmapEntryImpl _$$HeatmapEntryImplFromJson(Map<String, dynamic> json) =>
    _$HeatmapEntryImpl(
      date: json['date'] as String,
      solvedCount: (json['solvedCount'] as num).toInt(),
      correctCount: (json['correctCount'] as num).toInt(),
    );

Map<String, dynamic> _$$HeatmapEntryImplToJson(_$HeatmapEntryImpl instance) =>
    <String, dynamic>{
      'date': instance.date,
      'solvedCount': instance.solvedCount,
      'correctCount': instance.correctCount,
    };

_$HeatmapResponseImpl _$$HeatmapResponseImplFromJson(
  Map<String, dynamic> json,
) => _$HeatmapResponseImpl(
  entries:
      (json['entries'] as List<dynamic>?)
          ?.map((e) => HeatmapEntry.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$$HeatmapResponseImplToJson(
  _$HeatmapResponseImpl instance,
) => <String, dynamic>{'entries': instance.entries};
