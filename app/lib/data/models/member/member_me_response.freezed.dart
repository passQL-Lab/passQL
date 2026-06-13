// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'member_me_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

MemberMeResponse _$MemberMeResponseFromJson(Map<String, dynamic> json) {
  return _MemberMeResponse.fromJson(json);
}

/// @nodoc
mixin _$MemberMeResponse {
  String get memberUuid => throw _privateConstructorUsedError;
  String get nickname => throw _privateConstructorUsedError;

  /// Serializes this MemberMeResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of MemberMeResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $MemberMeResponseCopyWith<MemberMeResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $MemberMeResponseCopyWith<$Res> {
  factory $MemberMeResponseCopyWith(
    MemberMeResponse value,
    $Res Function(MemberMeResponse) then,
  ) = _$MemberMeResponseCopyWithImpl<$Res, MemberMeResponse>;
  @useResult
  $Res call({String memberUuid, String nickname});
}

/// @nodoc
class _$MemberMeResponseCopyWithImpl<$Res, $Val extends MemberMeResponse>
    implements $MemberMeResponseCopyWith<$Res> {
  _$MemberMeResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of MemberMeResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? memberUuid = null, Object? nickname = null}) {
    return _then(
      _value.copyWith(
            memberUuid: null == memberUuid
                ? _value.memberUuid
                : memberUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            nickname: null == nickname
                ? _value.nickname
                : nickname // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$MemberMeResponseImplCopyWith<$Res>
    implements $MemberMeResponseCopyWith<$Res> {
  factory _$$MemberMeResponseImplCopyWith(
    _$MemberMeResponseImpl value,
    $Res Function(_$MemberMeResponseImpl) then,
  ) = __$$MemberMeResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String memberUuid, String nickname});
}

/// @nodoc
class __$$MemberMeResponseImplCopyWithImpl<$Res>
    extends _$MemberMeResponseCopyWithImpl<$Res, _$MemberMeResponseImpl>
    implements _$$MemberMeResponseImplCopyWith<$Res> {
  __$$MemberMeResponseImplCopyWithImpl(
    _$MemberMeResponseImpl _value,
    $Res Function(_$MemberMeResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of MemberMeResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? memberUuid = null, Object? nickname = null}) {
    return _then(
      _$MemberMeResponseImpl(
        memberUuid: null == memberUuid
            ? _value.memberUuid
            : memberUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        nickname: null == nickname
            ? _value.nickname
            : nickname // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$MemberMeResponseImpl implements _MemberMeResponse {
  const _$MemberMeResponseImpl({
    required this.memberUuid,
    required this.nickname,
  });

  factory _$MemberMeResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$MemberMeResponseImplFromJson(json);

  @override
  final String memberUuid;
  @override
  final String nickname;

  @override
  String toString() {
    return 'MemberMeResponse(memberUuid: $memberUuid, nickname: $nickname)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MemberMeResponseImpl &&
            (identical(other.memberUuid, memberUuid) ||
                other.memberUuid == memberUuid) &&
            (identical(other.nickname, nickname) ||
                other.nickname == nickname));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, memberUuid, nickname);

  /// Create a copy of MemberMeResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MemberMeResponseImplCopyWith<_$MemberMeResponseImpl> get copyWith =>
      __$$MemberMeResponseImplCopyWithImpl<_$MemberMeResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$MemberMeResponseImplToJson(this);
  }
}

abstract class _MemberMeResponse implements MemberMeResponse {
  const factory _MemberMeResponse({
    required final String memberUuid,
    required final String nickname,
  }) = _$MemberMeResponseImpl;

  factory _MemberMeResponse.fromJson(Map<String, dynamic> json) =
      _$MemberMeResponseImpl.fromJson;

  @override
  String get memberUuid;
  @override
  String get nickname;

  /// Create a copy of MemberMeResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MemberMeResponseImplCopyWith<_$MemberMeResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
