// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'execute_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ExecuteResultImpl _$$ExecuteResultImplFromJson(Map<String, dynamic> json) =>
    _$ExecuteResultImpl(
      status: json['status'] as String?,
      columns:
          (json['columns'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      rows:
          (json['rows'] as List<dynamic>?)
              ?.map((e) => e as List<dynamic>)
              .toList() ??
          const [],
      rowCount: (json['rowCount'] as num?)?.toInt(),
      elapsedMs: (json['elapsedMs'] as num?)?.toInt(),
      errorCode: json['errorCode'] as String?,
      errorMessage: json['errorMessage'] as String?,
    );

Map<String, dynamic> _$$ExecuteResultImplToJson(_$ExecuteResultImpl instance) =>
    <String, dynamic>{
      'status': instance.status,
      'columns': instance.columns,
      'rows': instance.rows,
      'rowCount': instance.rowCount,
      'elapsedMs': instance.elapsedMs,
      'errorCode': instance.errorCode,
      'errorMessage': instance.errorMessage,
    };
