// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ai_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AiResultImpl _$$AiResultImplFromJson(Map<String, dynamic> json) =>
    _$AiResultImpl(
      text: json['text'] as String,
      promptVersion: (json['promptVersion'] as num?)?.toInt(),
    );

Map<String, dynamic> _$$AiResultImplToJson(_$AiResultImpl instance) =>
    <String, dynamic>{
      'text': instance.text,
      'promptVersion': instance.promptVersion,
    };
