// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'submit_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SubmitResult _$SubmitResultFromJson(Map<String, dynamic> json) {
  return _SubmitResult.fromJson(json);
}

/// @nodoc
mixin _$SubmitResult {
  bool get isCorrect => throw _privateConstructorUsedError;
  String? get correctKey => throw _privateConstructorUsedError;
  String? get rationale => throw _privateConstructorUsedError;
  ExecuteResult? get selectedResult => throw _privateConstructorUsedError;
  ExecuteResult? get correctResult => throw _privateConstructorUsedError;
  String? get correctSql => throw _privateConstructorUsedError;
  String? get selectedSql => throw _privateConstructorUsedError;

  /// Serializes this SubmitResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SubmitResultCopyWith<SubmitResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SubmitResultCopyWith<$Res> {
  factory $SubmitResultCopyWith(
    SubmitResult value,
    $Res Function(SubmitResult) then,
  ) = _$SubmitResultCopyWithImpl<$Res, SubmitResult>;
  @useResult
  $Res call({
    bool isCorrect,
    String? correctKey,
    String? rationale,
    ExecuteResult? selectedResult,
    ExecuteResult? correctResult,
    String? correctSql,
    String? selectedSql,
  });

  $ExecuteResultCopyWith<$Res>? get selectedResult;
  $ExecuteResultCopyWith<$Res>? get correctResult;
}

/// @nodoc
class _$SubmitResultCopyWithImpl<$Res, $Val extends SubmitResult>
    implements $SubmitResultCopyWith<$Res> {
  _$SubmitResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isCorrect = null,
    Object? correctKey = freezed,
    Object? rationale = freezed,
    Object? selectedResult = freezed,
    Object? correctResult = freezed,
    Object? correctSql = freezed,
    Object? selectedSql = freezed,
  }) {
    return _then(
      _value.copyWith(
            isCorrect: null == isCorrect
                ? _value.isCorrect
                : isCorrect // ignore: cast_nullable_to_non_nullable
                      as bool,
            correctKey: freezed == correctKey
                ? _value.correctKey
                : correctKey // ignore: cast_nullable_to_non_nullable
                      as String?,
            rationale: freezed == rationale
                ? _value.rationale
                : rationale // ignore: cast_nullable_to_non_nullable
                      as String?,
            selectedResult: freezed == selectedResult
                ? _value.selectedResult
                : selectedResult // ignore: cast_nullable_to_non_nullable
                      as ExecuteResult?,
            correctResult: freezed == correctResult
                ? _value.correctResult
                : correctResult // ignore: cast_nullable_to_non_nullable
                      as ExecuteResult?,
            correctSql: freezed == correctSql
                ? _value.correctSql
                : correctSql // ignore: cast_nullable_to_non_nullable
                      as String?,
            selectedSql: freezed == selectedSql
                ? _value.selectedSql
                : selectedSql // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ExecuteResultCopyWith<$Res>? get selectedResult {
    if (_value.selectedResult == null) {
      return null;
    }

    return $ExecuteResultCopyWith<$Res>(_value.selectedResult!, (value) {
      return _then(_value.copyWith(selectedResult: value) as $Val);
    });
  }

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $ExecuteResultCopyWith<$Res>? get correctResult {
    if (_value.correctResult == null) {
      return null;
    }

    return $ExecuteResultCopyWith<$Res>(_value.correctResult!, (value) {
      return _then(_value.copyWith(correctResult: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$SubmitResultImplCopyWith<$Res>
    implements $SubmitResultCopyWith<$Res> {
  factory _$$SubmitResultImplCopyWith(
    _$SubmitResultImpl value,
    $Res Function(_$SubmitResultImpl) then,
  ) = __$$SubmitResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    bool isCorrect,
    String? correctKey,
    String? rationale,
    ExecuteResult? selectedResult,
    ExecuteResult? correctResult,
    String? correctSql,
    String? selectedSql,
  });

  @override
  $ExecuteResultCopyWith<$Res>? get selectedResult;
  @override
  $ExecuteResultCopyWith<$Res>? get correctResult;
}

/// @nodoc
class __$$SubmitResultImplCopyWithImpl<$Res>
    extends _$SubmitResultCopyWithImpl<$Res, _$SubmitResultImpl>
    implements _$$SubmitResultImplCopyWith<$Res> {
  __$$SubmitResultImplCopyWithImpl(
    _$SubmitResultImpl _value,
    $Res Function(_$SubmitResultImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? isCorrect = null,
    Object? correctKey = freezed,
    Object? rationale = freezed,
    Object? selectedResult = freezed,
    Object? correctResult = freezed,
    Object? correctSql = freezed,
    Object? selectedSql = freezed,
  }) {
    return _then(
      _$SubmitResultImpl(
        isCorrect: null == isCorrect
            ? _value.isCorrect
            : isCorrect // ignore: cast_nullable_to_non_nullable
                  as bool,
        correctKey: freezed == correctKey
            ? _value.correctKey
            : correctKey // ignore: cast_nullable_to_non_nullable
                  as String?,
        rationale: freezed == rationale
            ? _value.rationale
            : rationale // ignore: cast_nullable_to_non_nullable
                  as String?,
        selectedResult: freezed == selectedResult
            ? _value.selectedResult
            : selectedResult // ignore: cast_nullable_to_non_nullable
                  as ExecuteResult?,
        correctResult: freezed == correctResult
            ? _value.correctResult
            : correctResult // ignore: cast_nullable_to_non_nullable
                  as ExecuteResult?,
        correctSql: freezed == correctSql
            ? _value.correctSql
            : correctSql // ignore: cast_nullable_to_non_nullable
                  as String?,
        selectedSql: freezed == selectedSql
            ? _value.selectedSql
            : selectedSql // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SubmitResultImpl implements _SubmitResult {
  const _$SubmitResultImpl({
    required this.isCorrect,
    this.correctKey,
    this.rationale,
    this.selectedResult,
    this.correctResult,
    this.correctSql,
    this.selectedSql,
  });

  factory _$SubmitResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$SubmitResultImplFromJson(json);

  @override
  final bool isCorrect;
  @override
  final String? correctKey;
  @override
  final String? rationale;
  @override
  final ExecuteResult? selectedResult;
  @override
  final ExecuteResult? correctResult;
  @override
  final String? correctSql;
  @override
  final String? selectedSql;

  @override
  String toString() {
    return 'SubmitResult(isCorrect: $isCorrect, correctKey: $correctKey, rationale: $rationale, selectedResult: $selectedResult, correctResult: $correctResult, correctSql: $correctSql, selectedSql: $selectedSql)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SubmitResultImpl &&
            (identical(other.isCorrect, isCorrect) ||
                other.isCorrect == isCorrect) &&
            (identical(other.correctKey, correctKey) ||
                other.correctKey == correctKey) &&
            (identical(other.rationale, rationale) ||
                other.rationale == rationale) &&
            (identical(other.selectedResult, selectedResult) ||
                other.selectedResult == selectedResult) &&
            (identical(other.correctResult, correctResult) ||
                other.correctResult == correctResult) &&
            (identical(other.correctSql, correctSql) ||
                other.correctSql == correctSql) &&
            (identical(other.selectedSql, selectedSql) ||
                other.selectedSql == selectedSql));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    isCorrect,
    correctKey,
    rationale,
    selectedResult,
    correctResult,
    correctSql,
    selectedSql,
  );

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SubmitResultImplCopyWith<_$SubmitResultImpl> get copyWith =>
      __$$SubmitResultImplCopyWithImpl<_$SubmitResultImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SubmitResultImplToJson(this);
  }
}

abstract class _SubmitResult implements SubmitResult {
  const factory _SubmitResult({
    required final bool isCorrect,
    final String? correctKey,
    final String? rationale,
    final ExecuteResult? selectedResult,
    final ExecuteResult? correctResult,
    final String? correctSql,
    final String? selectedSql,
  }) = _$SubmitResultImpl;

  factory _SubmitResult.fromJson(Map<String, dynamic> json) =
      _$SubmitResultImpl.fromJson;

  @override
  bool get isCorrect;
  @override
  String? get correctKey;
  @override
  String? get rationale;
  @override
  ExecuteResult? get selectedResult;
  @override
  ExecuteResult? get correctResult;
  @override
  String? get correctSql;
  @override
  String? get selectedSql;

  /// Create a copy of SubmitResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SubmitResultImplCopyWith<_$SubmitResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
