// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'progress_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ProgressResponse _$ProgressResponseFromJson(Map<String, dynamic> json) {
  return _ProgressResponse.fromJson(json);
}

/// @nodoc
mixin _$ProgressResponse {
  int get solvedCount => throw _privateConstructorUsedError;
  double get correctRate => throw _privateConstructorUsedError;
  int get streakDays => throw _privateConstructorUsedError;
  ReadinessResponse? get readiness => throw _privateConstructorUsedError;

  /// Serializes this ProgressResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ProgressResponseCopyWith<ProgressResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ProgressResponseCopyWith<$Res> {
  factory $ProgressResponseCopyWith(
    ProgressResponse value,
    $Res Function(ProgressResponse) then,
  ) = _$ProgressResponseCopyWithImpl<$Res, ProgressResponse>;
  @useResult
  $Res call({
    int solvedCount,
    double correctRate,
    int streakDays,
    ReadinessResponse? readiness,
  });

  $ReadinessResponseCopyWith<$Res>? get readiness;
}

/// @nodoc
class _$ProgressResponseCopyWithImpl<$Res, $Val extends ProgressResponse>
    implements $ProgressResponseCopyWith<$Res> {
  _$ProgressResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? solvedCount = null,
    Object? correctRate = null,
    Object? streakDays = null,
    Object? readiness = freezed,
  }) {
    return _then(
      _value.copyWith(
            solvedCount: null == solvedCount
                ? _value.solvedCount
                : solvedCount // ignore: cast_nullable_to_non_nullable
                      as int,
            correctRate: null == correctRate
                ? _value.correctRate
                : correctRate // ignore: cast_nullable_to_non_nullable
                      as double,
            streakDays: null == streakDays
                ? _value.streakDays
                : streakDays // ignore: cast_nullable_to_non_nullable
                      as int,
            readiness: freezed == readiness
                ? _value.readiness
                : readiness // ignore: cast_nullable_to_non_nullable
                      as ReadinessResponse?,
          )
          as $Val,
    );
  }

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ReadinessResponseCopyWith<$Res>? get readiness {
    if (_value.readiness == null) {
      return null;
    }

    return $ReadinessResponseCopyWith<$Res>(_value.readiness!, (value) {
      return _then(_value.copyWith(readiness: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ProgressResponseImplCopyWith<$Res>
    implements $ProgressResponseCopyWith<$Res> {
  factory _$$ProgressResponseImplCopyWith(
    _$ProgressResponseImpl value,
    $Res Function(_$ProgressResponseImpl) then,
  ) = __$$ProgressResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int solvedCount,
    double correctRate,
    int streakDays,
    ReadinessResponse? readiness,
  });

  @override
  $ReadinessResponseCopyWith<$Res>? get readiness;
}

/// @nodoc
class __$$ProgressResponseImplCopyWithImpl<$Res>
    extends _$ProgressResponseCopyWithImpl<$Res, _$ProgressResponseImpl>
    implements _$$ProgressResponseImplCopyWith<$Res> {
  __$$ProgressResponseImplCopyWithImpl(
    _$ProgressResponseImpl _value,
    $Res Function(_$ProgressResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? solvedCount = null,
    Object? correctRate = null,
    Object? streakDays = null,
    Object? readiness = freezed,
  }) {
    return _then(
      _$ProgressResponseImpl(
        solvedCount: null == solvedCount
            ? _value.solvedCount
            : solvedCount // ignore: cast_nullable_to_non_nullable
                  as int,
        correctRate: null == correctRate
            ? _value.correctRate
            : correctRate // ignore: cast_nullable_to_non_nullable
                  as double,
        streakDays: null == streakDays
            ? _value.streakDays
            : streakDays // ignore: cast_nullable_to_non_nullable
                  as int,
        readiness: freezed == readiness
            ? _value.readiness
            : readiness // ignore: cast_nullable_to_non_nullable
                  as ReadinessResponse?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ProgressResponseImpl implements _ProgressResponse {
  const _$ProgressResponseImpl({
    required this.solvedCount,
    required this.correctRate,
    required this.streakDays,
    this.readiness,
  });

  factory _$ProgressResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$ProgressResponseImplFromJson(json);

  @override
  final int solvedCount;
  @override
  final double correctRate;
  @override
  final int streakDays;
  @override
  final ReadinessResponse? readiness;

  @override
  String toString() {
    return 'ProgressResponse(solvedCount: $solvedCount, correctRate: $correctRate, streakDays: $streakDays, readiness: $readiness)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ProgressResponseImpl &&
            (identical(other.solvedCount, solvedCount) ||
                other.solvedCount == solvedCount) &&
            (identical(other.correctRate, correctRate) ||
                other.correctRate == correctRate) &&
            (identical(other.streakDays, streakDays) ||
                other.streakDays == streakDays) &&
            (identical(other.readiness, readiness) ||
                other.readiness == readiness));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, solvedCount, correctRate, streakDays, readiness);

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ProgressResponseImplCopyWith<_$ProgressResponseImpl> get copyWith =>
      __$$ProgressResponseImplCopyWithImpl<_$ProgressResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$ProgressResponseImplToJson(this);
  }
}

abstract class _ProgressResponse implements ProgressResponse {
  const factory _ProgressResponse({
    required final int solvedCount,
    required final double correctRate,
    required final int streakDays,
    final ReadinessResponse? readiness,
  }) = _$ProgressResponseImpl;

  factory _ProgressResponse.fromJson(Map<String, dynamic> json) =
      _$ProgressResponseImpl.fromJson;

  @override
  int get solvedCount;
  @override
  double get correctRate;
  @override
  int get streakDays;
  @override
  ReadinessResponse? get readiness;

  /// Create a copy of ProgressResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ProgressResponseImplCopyWith<_$ProgressResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
