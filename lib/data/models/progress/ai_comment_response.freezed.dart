// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_comment_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

AiCommentResponse _$AiCommentResponseFromJson(Map<String, dynamic> json) {
  return _AiCommentResponse.fromJson(json);
}

/// @nodoc
mixin _$AiCommentResponse {
  String get comment => throw _privateConstructorUsedError;
  String? get generatedAt => throw _privateConstructorUsedError;

  /// Serializes this AiCommentResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AiCommentResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AiCommentResponseCopyWith<AiCommentResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AiCommentResponseCopyWith<$Res> {
  factory $AiCommentResponseCopyWith(
    AiCommentResponse value,
    $Res Function(AiCommentResponse) then,
  ) = _$AiCommentResponseCopyWithImpl<$Res, AiCommentResponse>;
  @useResult
  $Res call({String comment, String? generatedAt});
}

/// @nodoc
class _$AiCommentResponseCopyWithImpl<$Res, $Val extends AiCommentResponse>
    implements $AiCommentResponseCopyWith<$Res> {
  _$AiCommentResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AiCommentResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? comment = null, Object? generatedAt = freezed}) {
    return _then(
      _value.copyWith(
            comment: null == comment
                ? _value.comment
                : comment // ignore: cast_nullable_to_non_nullable
                      as String,
            generatedAt: freezed == generatedAt
                ? _value.generatedAt
                : generatedAt // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$AiCommentResponseImplCopyWith<$Res>
    implements $AiCommentResponseCopyWith<$Res> {
  factory _$$AiCommentResponseImplCopyWith(
    _$AiCommentResponseImpl value,
    $Res Function(_$AiCommentResponseImpl) then,
  ) = __$$AiCommentResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String comment, String? generatedAt});
}

/// @nodoc
class __$$AiCommentResponseImplCopyWithImpl<$Res>
    extends _$AiCommentResponseCopyWithImpl<$Res, _$AiCommentResponseImpl>
    implements _$$AiCommentResponseImplCopyWith<$Res> {
  __$$AiCommentResponseImplCopyWithImpl(
    _$AiCommentResponseImpl _value,
    $Res Function(_$AiCommentResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AiCommentResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? comment = null, Object? generatedAt = freezed}) {
    return _then(
      _$AiCommentResponseImpl(
        comment: null == comment
            ? _value.comment
            : comment // ignore: cast_nullable_to_non_nullable
                  as String,
        generatedAt: freezed == generatedAt
            ? _value.generatedAt
            : generatedAt // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$AiCommentResponseImpl implements _AiCommentResponse {
  const _$AiCommentResponseImpl({required this.comment, this.generatedAt});

  factory _$AiCommentResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$AiCommentResponseImplFromJson(json);

  @override
  final String comment;
  @override
  final String? generatedAt;

  @override
  String toString() {
    return 'AiCommentResponse(comment: $comment, generatedAt: $generatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AiCommentResponseImpl &&
            (identical(other.comment, comment) || other.comment == comment) &&
            (identical(other.generatedAt, generatedAt) ||
                other.generatedAt == generatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, comment, generatedAt);

  /// Create a copy of AiCommentResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AiCommentResponseImplCopyWith<_$AiCommentResponseImpl> get copyWith =>
      __$$AiCommentResponseImplCopyWithImpl<_$AiCommentResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$AiCommentResponseImplToJson(this);
  }
}

abstract class _AiCommentResponse implements AiCommentResponse {
  const factory _AiCommentResponse({
    required final String comment,
    final String? generatedAt,
  }) = _$AiCommentResponseImpl;

  factory _AiCommentResponse.fromJson(Map<String, dynamic> json) =
      _$AiCommentResponseImpl.fromJson;

  @override
  String get comment;
  @override
  String? get generatedAt;

  /// Create a copy of AiCommentResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AiCommentResponseImplCopyWith<_$AiCommentResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
