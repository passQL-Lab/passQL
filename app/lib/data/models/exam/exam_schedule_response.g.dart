// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'exam_schedule_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ExamScheduleResponseImpl _$$ExamScheduleResponseImplFromJson(
  Map<String, dynamic> json,
) => _$ExamScheduleResponseImpl(
  examScheduleUuid: json['examScheduleUuid'] as String,
  certType: json['certType'] as String,
  round: (json['round'] as num).toInt(),
  examDate: json['examDate'] as String,
  isSelected: json['isSelected'] as bool,
);

Map<String, dynamic> _$$ExamScheduleResponseImplToJson(
  _$ExamScheduleResponseImpl instance,
) => <String, dynamic>{
  'examScheduleUuid': instance.examScheduleUuid,
  'certType': instance.certType,
  'round': instance.round,
  'examDate': instance.examDate,
  'isSelected': instance.isSelected,
};
