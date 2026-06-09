// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'execute_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ExecuteRequest _$ExecuteRequestFromJson(Map<String, dynamic> json) {
  return _ExecuteRequest.fromJson(json);
}

/// @nodoc
mixin _$ExecuteRequest {
  String get sql => throw _privateConstructorUsedError;

  /// Serializes this ExecuteRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ExecuteRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ExecuteRequestCopyWith<ExecuteRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExecuteRequestCopyWith<$Res> {
  factory $ExecuteRequestCopyWith(
    ExecuteRequest value,
    $Res Function(ExecuteRequest) then,
  ) = _$ExecuteRequestCopyWithImpl<$Res, ExecuteRequest>;
  @useResult
  $Res call({String sql});
}

/// @nodoc
class _$ExecuteRequestCopyWithImpl<$Res, $Val extends ExecuteRequest>
    implements $ExecuteRequestCopyWith<$Res> {
  _$ExecuteRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ExecuteRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? sql = null}) {
    return _then(
      _value.copyWith(
            sql: null == sql
                ? _value.sql
                : sql // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ExecuteRequestImplCopyWith<$Res>
    implements $ExecuteRequestCopyWith<$Res> {
  factory _$$ExecuteRequestImplCopyWith(
    _$ExecuteRequestImpl value,
    $Res Function(_$ExecuteRequestImpl) then,
  ) = __$$ExecuteRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String sql});
}

/// @nodoc
class __$$ExecuteRequestImplCopyWithImpl<$Res>
    extends _$ExecuteRequestCopyWithImpl<$Res, _$ExecuteRequestImpl>
    implements _$$ExecuteRequestImplCopyWith<$Res> {
  __$$ExecuteRequestImplCopyWithImpl(
    _$ExecuteRequestImpl _value,
    $Res Function(_$ExecuteRequestImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ExecuteRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? sql = null}) {
    return _then(
      _$ExecuteRequestImpl(
        sql: null == sql
            ? _value.sql
            : sql // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ExecuteRequestImpl implements _ExecuteRequest {
  const _$ExecuteRequestImpl({required this.sql});

  factory _$ExecuteRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExecuteRequestImplFromJson(json);

  @override
  final String sql;

  @override
  String toString() {
    return 'ExecuteRequest(sql: $sql)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExecuteRequestImpl &&
            (identical(other.sql, sql) || other.sql == sql));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, sql);

  /// Create a copy of ExecuteRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ExecuteRequestImplCopyWith<_$ExecuteRequestImpl> get copyWith =>
      __$$ExecuteRequestImplCopyWithImpl<_$ExecuteRequestImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$ExecuteRequestImplToJson(this);
  }
}

abstract class _ExecuteRequest implements ExecuteRequest {
  const factory _ExecuteRequest({required final String sql}) =
      _$ExecuteRequestImpl;

  factory _ExecuteRequest.fromJson(Map<String, dynamic> json) =
      _$ExecuteRequestImpl.fromJson;

  @override
  String get sql;

  /// Create a copy of ExecuteRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ExecuteRequestImplCopyWith<_$ExecuteRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
