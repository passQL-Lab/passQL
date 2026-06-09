// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'greeting_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$GreetingResponseImpl _$$GreetingResponseImplFromJson(
  Map<String, dynamic> json,
) => _$GreetingResponseImpl(
  nickname: json['nickname'] as String,
  message: json['message'] as String,
  messageType: json['messageType'] as String,
);

Map<String, dynamic> _$$GreetingResponseImplToJson(
  _$GreetingResponseImpl instance,
) => <String, dynamic>{
  'nickname': instance.nickname,
  'message': instance.message,
  'messageType': instance.messageType,
};
