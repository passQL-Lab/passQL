// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'nickname_regenerate_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

NicknameRegenerateResponse _$NicknameRegenerateResponseFromJson(
  Map<String, dynamic> json,
) {
  return _NicknameRegenerateResponse.fromJson(json);
}

/// @nodoc
mixin _$NicknameRegenerateResponse {
  String get nickname => throw _privateConstructorUsedError;

  /// Serializes this NicknameRegenerateResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of NicknameRegenerateResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $NicknameRegenerateResponseCopyWith<NicknameRegenerateResponse>
  get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NicknameRegenerateResponseCopyWith<$Res> {
  factory $NicknameRegenerateResponseCopyWith(
    NicknameRegenerateResponse value,
    $Res Function(NicknameRegenerateResponse) then,
  ) =
      _$NicknameRegenerateResponseCopyWithImpl<
        $Res,
        NicknameRegenerateResponse
      >;
  @useResult
  $Res call({String nickname});
}

/// @nodoc
class _$NicknameRegenerateResponseCopyWithImpl<
  $Res,
  $Val extends NicknameRegenerateResponse
>
    implements $NicknameRegenerateResponseCopyWith<$Res> {
  _$NicknameRegenerateResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of NicknameRegenerateResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? nickname = null}) {
    return _then(
      _value.copyWith(
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
abstract class _$$NicknameRegenerateResponseImplCopyWith<$Res>
    implements $NicknameRegenerateResponseCopyWith<$Res> {
  factory _$$NicknameRegenerateResponseImplCopyWith(
    _$NicknameRegenerateResponseImpl value,
    $Res Function(_$NicknameRegenerateResponseImpl) then,
  ) = __$$NicknameRegenerateResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String nickname});
}

/// @nodoc
class __$$NicknameRegenerateResponseImplCopyWithImpl<$Res>
    extends
        _$NicknameRegenerateResponseCopyWithImpl<
          $Res,
          _$NicknameRegenerateResponseImpl
        >
    implements _$$NicknameRegenerateResponseImplCopyWith<$Res> {
  __$$NicknameRegenerateResponseImplCopyWithImpl(
    _$NicknameRegenerateResponseImpl _value,
    $Res Function(_$NicknameRegenerateResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of NicknameRegenerateResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? nickname = null}) {
    return _then(
      _$NicknameRegenerateResponseImpl(
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
class _$NicknameRegenerateResponseImpl implements _NicknameRegenerateResponse {
  const _$NicknameRegenerateResponseImpl({required this.nickname});

  factory _$NicknameRegenerateResponseImpl.fromJson(
    Map<String, dynamic> json,
  ) => _$$NicknameRegenerateResponseImplFromJson(json);

  @override
  final String nickname;

  @override
  String toString() {
    return 'NicknameRegenerateResponse(nickname: $nickname)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NicknameRegenerateResponseImpl &&
            (identical(other.nickname, nickname) ||
                other.nickname == nickname));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, nickname);

  /// Create a copy of NicknameRegenerateResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$NicknameRegenerateResponseImplCopyWith<_$NicknameRegenerateResponseImpl>
  get copyWith =>
      __$$NicknameRegenerateResponseImplCopyWithImpl<
        _$NicknameRegenerateResponseImpl
      >(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$NicknameRegenerateResponseImplToJson(this);
  }
}

abstract class _NicknameRegenerateResponse
    implements NicknameRegenerateResponse {
  const factory _NicknameRegenerateResponse({required final String nickname}) =
      _$NicknameRegenerateResponseImpl;

  factory _NicknameRegenerateResponse.fromJson(Map<String, dynamic> json) =
      _$NicknameRegenerateResponseImpl.fromJson;

  @override
  String get nickname;

  /// Create a copy of NicknameRegenerateResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$NicknameRegenerateResponseImplCopyWith<_$NicknameRegenerateResponseImpl>
  get copyWith => throw _privateConstructorUsedError;
}
