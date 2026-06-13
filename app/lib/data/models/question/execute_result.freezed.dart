// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'execute_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ExecuteResult _$ExecuteResultFromJson(Map<String, dynamic> json) {
  return _ExecuteResult.fromJson(json);
}

/// @nodoc
mixin _$ExecuteResult {
  String? get status => throw _privateConstructorUsedError;
  List<String> get columns => throw _privateConstructorUsedError;
  List<List<dynamic>> get rows => throw _privateConstructorUsedError;
  int? get rowCount => throw _privateConstructorUsedError;
  int? get elapsedMs => throw _privateConstructorUsedError;
  String? get errorCode => throw _privateConstructorUsedError;
  String? get errorMessage => throw _privateConstructorUsedError;

  /// Serializes this ExecuteResult to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ExecuteResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ExecuteResultCopyWith<ExecuteResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ExecuteResultCopyWith<$Res> {
  factory $ExecuteResultCopyWith(
    ExecuteResult value,
    $Res Function(ExecuteResult) then,
  ) = _$ExecuteResultCopyWithImpl<$Res, ExecuteResult>;
  @useResult
  $Res call({
    String? status,
    List<String> columns,
    List<List<dynamic>> rows,
    int? rowCount,
    int? elapsedMs,
    String? errorCode,
    String? errorMessage,
  });
}

/// @nodoc
class _$ExecuteResultCopyWithImpl<$Res, $Val extends ExecuteResult>
    implements $ExecuteResultCopyWith<$Res> {
  _$ExecuteResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ExecuteResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = freezed,
    Object? columns = null,
    Object? rows = null,
    Object? rowCount = freezed,
    Object? elapsedMs = freezed,
    Object? errorCode = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(
      _value.copyWith(
            status: freezed == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String?,
            columns: null == columns
                ? _value.columns
                : columns // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            rows: null == rows
                ? _value.rows
                : rows // ignore: cast_nullable_to_non_nullable
                      as List<List<dynamic>>,
            rowCount: freezed == rowCount
                ? _value.rowCount
                : rowCount // ignore: cast_nullable_to_non_nullable
                      as int?,
            elapsedMs: freezed == elapsedMs
                ? _value.elapsedMs
                : elapsedMs // ignore: cast_nullable_to_non_nullable
                      as int?,
            errorCode: freezed == errorCode
                ? _value.errorCode
                : errorCode // ignore: cast_nullable_to_non_nullable
                      as String?,
            errorMessage: freezed == errorMessage
                ? _value.errorMessage
                : errorMessage // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ExecuteResultImplCopyWith<$Res>
    implements $ExecuteResultCopyWith<$Res> {
  factory _$$ExecuteResultImplCopyWith(
    _$ExecuteResultImpl value,
    $Res Function(_$ExecuteResultImpl) then,
  ) = __$$ExecuteResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String? status,
    List<String> columns,
    List<List<dynamic>> rows,
    int? rowCount,
    int? elapsedMs,
    String? errorCode,
    String? errorMessage,
  });
}

/// @nodoc
class __$$ExecuteResultImplCopyWithImpl<$Res>
    extends _$ExecuteResultCopyWithImpl<$Res, _$ExecuteResultImpl>
    implements _$$ExecuteResultImplCopyWith<$Res> {
  __$$ExecuteResultImplCopyWithImpl(
    _$ExecuteResultImpl _value,
    $Res Function(_$ExecuteResultImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ExecuteResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = freezed,
    Object? columns = null,
    Object? rows = null,
    Object? rowCount = freezed,
    Object? elapsedMs = freezed,
    Object? errorCode = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(
      _$ExecuteResultImpl(
        status: freezed == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String?,
        columns: null == columns
            ? _value._columns
            : columns // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        rows: null == rows
            ? _value._rows
            : rows // ignore: cast_nullable_to_non_nullable
                  as List<List<dynamic>>,
        rowCount: freezed == rowCount
            ? _value.rowCount
            : rowCount // ignore: cast_nullable_to_non_nullable
                  as int?,
        elapsedMs: freezed == elapsedMs
            ? _value.elapsedMs
            : elapsedMs // ignore: cast_nullable_to_non_nullable
                  as int?,
        errorCode: freezed == errorCode
            ? _value.errorCode
            : errorCode // ignore: cast_nullable_to_non_nullable
                  as String?,
        errorMessage: freezed == errorMessage
            ? _value.errorMessage
            : errorMessage // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ExecuteResultImpl implements _ExecuteResult {
  const _$ExecuteResultImpl({
    this.status,
    final List<String> columns = const [],
    final List<List<dynamic>> rows = const [],
    this.rowCount,
    this.elapsedMs,
    this.errorCode,
    this.errorMessage,
  }) : _columns = columns,
       _rows = rows;

  factory _$ExecuteResultImpl.fromJson(Map<String, dynamic> json) =>
      _$$ExecuteResultImplFromJson(json);

  @override
  final String? status;
  final List<String> _columns;
  @override
  @JsonKey()
  List<String> get columns {
    if (_columns is EqualUnmodifiableListView) return _columns;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_columns);
  }

  final List<List<dynamic>> _rows;
  @override
  @JsonKey()
  List<List<dynamic>> get rows {
    if (_rows is EqualUnmodifiableListView) return _rows;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_rows);
  }

  @override
  final int? rowCount;
  @override
  final int? elapsedMs;
  @override
  final String? errorCode;
  @override
  final String? errorMessage;

  @override
  String toString() {
    return 'ExecuteResult(status: $status, columns: $columns, rows: $rows, rowCount: $rowCount, elapsedMs: $elapsedMs, errorCode: $errorCode, errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ExecuteResultImpl &&
            (identical(other.status, status) || other.status == status) &&
            const DeepCollectionEquality().equals(other._columns, _columns) &&
            const DeepCollectionEquality().equals(other._rows, _rows) &&
            (identical(other.rowCount, rowCount) ||
                other.rowCount == rowCount) &&
            (identical(other.elapsedMs, elapsedMs) ||
                other.elapsedMs == elapsedMs) &&
            (identical(other.errorCode, errorCode) ||
                other.errorCode == errorCode) &&
            (identical(other.errorMessage, errorMessage) ||
                other.errorMessage == errorMessage));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    status,
    const DeepCollectionEquality().hash(_columns),
    const DeepCollectionEquality().hash(_rows),
    rowCount,
    elapsedMs,
    errorCode,
    errorMessage,
  );

  /// Create a copy of ExecuteResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ExecuteResultImplCopyWith<_$ExecuteResultImpl> get copyWith =>
      __$$ExecuteResultImplCopyWithImpl<_$ExecuteResultImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ExecuteResultImplToJson(this);
  }
}

abstract class _ExecuteResult implements ExecuteResult {
  const factory _ExecuteResult({
    final String? status,
    final List<String> columns,
    final List<List<dynamic>> rows,
    final int? rowCount,
    final int? elapsedMs,
    final String? errorCode,
    final String? errorMessage,
  }) = _$ExecuteResultImpl;

  factory _ExecuteResult.fromJson(Map<String, dynamic> json) =
      _$ExecuteResultImpl.fromJson;

  @override
  String? get status;
  @override
  List<String> get columns;
  @override
  List<List<dynamic>> get rows;
  @override
  int? get rowCount;
  @override
  int? get elapsedMs;
  @override
  String? get errorCode;
  @override
  String? get errorMessage;

  /// Create a copy of ExecuteResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ExecuteResultImplCopyWith<_$ExecuteResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
