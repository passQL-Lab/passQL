// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'greeting_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

GreetingResponse _$GreetingResponseFromJson(Map<String, dynamic> json) {
  return _GreetingResponse.fromJson(json);
}

/// @nodoc
mixin _$GreetingResponse {
  String get nickname => throw _privateConstructorUsedError;
  String get message => throw _privateConstructorUsedError;
  String get messageType => throw _privateConstructorUsedError;

  /// Serializes this GreetingResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GreetingResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GreetingResponseCopyWith<GreetingResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GreetingResponseCopyWith<$Res> {
  factory $GreetingResponseCopyWith(
    GreetingResponse value,
    $Res Function(GreetingResponse) then,
  ) = _$GreetingResponseCopyWithImpl<$Res, GreetingResponse>;
  @useResult
  $Res call({String nickname, String message, String messageType});
}

/// @nodoc
class _$GreetingResponseCopyWithImpl<$Res, $Val extends GreetingResponse>
    implements $GreetingResponseCopyWith<$Res> {
  _$GreetingResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GreetingResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nickname = null,
    Object? message = null,
    Object? messageType = null,
  }) {
    return _then(
      _value.copyWith(
            nickname: null == nickname
                ? _value.nickname
                : nickname // ignore: cast_nullable_to_non_nullable
                      as String,
            message: null == message
                ? _value.message
                : message // ignore: cast_nullable_to_non_nullable
                      as String,
            messageType: null == messageType
                ? _value.messageType
                : messageType // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$GreetingResponseImplCopyWith<$Res>
    implements $GreetingResponseCopyWith<$Res> {
  factory _$$GreetingResponseImplCopyWith(
    _$GreetingResponseImpl value,
    $Res Function(_$GreetingResponseImpl) then,
  ) = __$$GreetingResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String nickname, String message, String messageType});
}

/// @nodoc
class __$$GreetingResponseImplCopyWithImpl<$Res>
    extends _$GreetingResponseCopyWithImpl<$Res, _$GreetingResponseImpl>
    implements _$$GreetingResponseImplCopyWith<$Res> {
  __$$GreetingResponseImplCopyWithImpl(
    _$GreetingResponseImpl _value,
    $Res Function(_$GreetingResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of GreetingResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? nickname = null,
    Object? message = null,
    Object? messageType = null,
  }) {
    return _then(
      _$GreetingResponseImpl(
        nickname: null == nickname
            ? _value.nickname
            : nickname // ignore: cast_nullable_to_non_nullable
                  as String,
        message: null == message
            ? _value.message
            : message // ignore: cast_nullable_to_non_nullable
                  as String,
        messageType: null == messageType
            ? _value.messageType
            : messageType // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$GreetingResponseImpl implements _GreetingResponse {
  const _$GreetingResponseImpl({
    required this.nickname,
    required this.message,
    required this.messageType,
  });

  factory _$GreetingResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$GreetingResponseImplFromJson(json);

  @override
  final String nickname;
  @override
  final String message;
  @override
  final String messageType;

  @override
  String toString() {
    return 'GreetingResponse(nickname: $nickname, message: $message, messageType: $messageType)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GreetingResponseImpl &&
            (identical(other.nickname, nickname) ||
                other.nickname == nickname) &&
            (identical(other.message, message) || other.message == message) &&
            (identical(other.messageType, messageType) ||
                other.messageType == messageType));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, nickname, message, messageType);

  /// Create a copy of GreetingResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GreetingResponseImplCopyWith<_$GreetingResponseImpl> get copyWith =>
      __$$GreetingResponseImplCopyWithImpl<_$GreetingResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$GreetingResponseImplToJson(this);
  }
}

abstract class _GreetingResponse implements GreetingResponse {
  const factory _GreetingResponse({
    required final String nickname,
    required final String message,
    required final String messageType,
  }) = _$GreetingResponseImpl;

  factory _GreetingResponse.fromJson(Map<String, dynamic> json) =
      _$GreetingResponseImpl.fromJson;

  @override
  String get nickname;
  @override
  String get message;
  @override
  String get messageType;

  /// Create a copy of GreetingResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GreetingResponseImplCopyWith<_$GreetingResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
