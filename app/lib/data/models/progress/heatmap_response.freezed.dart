// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'heatmap_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

HeatmapEntry _$HeatmapEntryFromJson(Map<String, dynamic> json) {
  return _HeatmapEntry.fromJson(json);
}

/// @nodoc
mixin _$HeatmapEntry {
  String get date => throw _privateConstructorUsedError;
  int get solvedCount => throw _privateConstructorUsedError;
  int get correctCount => throw _privateConstructorUsedError;

  /// Serializes this HeatmapEntry to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of HeatmapEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $HeatmapEntryCopyWith<HeatmapEntry> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HeatmapEntryCopyWith<$Res> {
  factory $HeatmapEntryCopyWith(
    HeatmapEntry value,
    $Res Function(HeatmapEntry) then,
  ) = _$HeatmapEntryCopyWithImpl<$Res, HeatmapEntry>;
  @useResult
  $Res call({String date, int solvedCount, int correctCount});
}

/// @nodoc
class _$HeatmapEntryCopyWithImpl<$Res, $Val extends HeatmapEntry>
    implements $HeatmapEntryCopyWith<$Res> {
  _$HeatmapEntryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of HeatmapEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? date = null,
    Object? solvedCount = null,
    Object? correctCount = null,
  }) {
    return _then(
      _value.copyWith(
            date: null == date
                ? _value.date
                : date // ignore: cast_nullable_to_non_nullable
                      as String,
            solvedCount: null == solvedCount
                ? _value.solvedCount
                : solvedCount // ignore: cast_nullable_to_non_nullable
                      as int,
            correctCount: null == correctCount
                ? _value.correctCount
                : correctCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$HeatmapEntryImplCopyWith<$Res>
    implements $HeatmapEntryCopyWith<$Res> {
  factory _$$HeatmapEntryImplCopyWith(
    _$HeatmapEntryImpl value,
    $Res Function(_$HeatmapEntryImpl) then,
  ) = __$$HeatmapEntryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String date, int solvedCount, int correctCount});
}

/// @nodoc
class __$$HeatmapEntryImplCopyWithImpl<$Res>
    extends _$HeatmapEntryCopyWithImpl<$Res, _$HeatmapEntryImpl>
    implements _$$HeatmapEntryImplCopyWith<$Res> {
  __$$HeatmapEntryImplCopyWithImpl(
    _$HeatmapEntryImpl _value,
    $Res Function(_$HeatmapEntryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of HeatmapEntry
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? date = null,
    Object? solvedCount = null,
    Object? correctCount = null,
  }) {
    return _then(
      _$HeatmapEntryImpl(
        date: null == date
            ? _value.date
            : date // ignore: cast_nullable_to_non_nullable
                  as String,
        solvedCount: null == solvedCount
            ? _value.solvedCount
            : solvedCount // ignore: cast_nullable_to_non_nullable
                  as int,
        correctCount: null == correctCount
            ? _value.correctCount
            : correctCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$HeatmapEntryImpl implements _HeatmapEntry {
  const _$HeatmapEntryImpl({
    required this.date,
    required this.solvedCount,
    required this.correctCount,
  });

  factory _$HeatmapEntryImpl.fromJson(Map<String, dynamic> json) =>
      _$$HeatmapEntryImplFromJson(json);

  @override
  final String date;
  @override
  final int solvedCount;
  @override
  final int correctCount;

  @override
  String toString() {
    return 'HeatmapEntry(date: $date, solvedCount: $solvedCount, correctCount: $correctCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HeatmapEntryImpl &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.solvedCount, solvedCount) ||
                other.solvedCount == solvedCount) &&
            (identical(other.correctCount, correctCount) ||
                other.correctCount == correctCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, date, solvedCount, correctCount);

  /// Create a copy of HeatmapEntry
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$HeatmapEntryImplCopyWith<_$HeatmapEntryImpl> get copyWith =>
      __$$HeatmapEntryImplCopyWithImpl<_$HeatmapEntryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$HeatmapEntryImplToJson(this);
  }
}

abstract class _HeatmapEntry implements HeatmapEntry {
  const factory _HeatmapEntry({
    required final String date,
    required final int solvedCount,
    required final int correctCount,
  }) = _$HeatmapEntryImpl;

  factory _HeatmapEntry.fromJson(Map<String, dynamic> json) =
      _$HeatmapEntryImpl.fromJson;

  @override
  String get date;
  @override
  int get solvedCount;
  @override
  int get correctCount;

  /// Create a copy of HeatmapEntry
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$HeatmapEntryImplCopyWith<_$HeatmapEntryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

HeatmapResponse _$HeatmapResponseFromJson(Map<String, dynamic> json) {
  return _HeatmapResponse.fromJson(json);
}

/// @nodoc
mixin _$HeatmapResponse {
  List<HeatmapEntry> get entries => throw _privateConstructorUsedError;

  /// Serializes this HeatmapResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of HeatmapResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $HeatmapResponseCopyWith<HeatmapResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $HeatmapResponseCopyWith<$Res> {
  factory $HeatmapResponseCopyWith(
    HeatmapResponse value,
    $Res Function(HeatmapResponse) then,
  ) = _$HeatmapResponseCopyWithImpl<$Res, HeatmapResponse>;
  @useResult
  $Res call({List<HeatmapEntry> entries});
}

/// @nodoc
class _$HeatmapResponseCopyWithImpl<$Res, $Val extends HeatmapResponse>
    implements $HeatmapResponseCopyWith<$Res> {
  _$HeatmapResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of HeatmapResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? entries = null}) {
    return _then(
      _value.copyWith(
            entries: null == entries
                ? _value.entries
                : entries // ignore: cast_nullable_to_non_nullable
                      as List<HeatmapEntry>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$HeatmapResponseImplCopyWith<$Res>
    implements $HeatmapResponseCopyWith<$Res> {
  factory _$$HeatmapResponseImplCopyWith(
    _$HeatmapResponseImpl value,
    $Res Function(_$HeatmapResponseImpl) then,
  ) = __$$HeatmapResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<HeatmapEntry> entries});
}

/// @nodoc
class __$$HeatmapResponseImplCopyWithImpl<$Res>
    extends _$HeatmapResponseCopyWithImpl<$Res, _$HeatmapResponseImpl>
    implements _$$HeatmapResponseImplCopyWith<$Res> {
  __$$HeatmapResponseImplCopyWithImpl(
    _$HeatmapResponseImpl _value,
    $Res Function(_$HeatmapResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of HeatmapResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? entries = null}) {
    return _then(
      _$HeatmapResponseImpl(
        entries: null == entries
            ? _value._entries
            : entries // ignore: cast_nullable_to_non_nullable
                  as List<HeatmapEntry>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$HeatmapResponseImpl implements _HeatmapResponse {
  const _$HeatmapResponseImpl({final List<HeatmapEntry> entries = const []})
    : _entries = entries;

  factory _$HeatmapResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$HeatmapResponseImplFromJson(json);

  final List<HeatmapEntry> _entries;
  @override
  @JsonKey()
  List<HeatmapEntry> get entries {
    if (_entries is EqualUnmodifiableListView) return _entries;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_entries);
  }

  @override
  String toString() {
    return 'HeatmapResponse(entries: $entries)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$HeatmapResponseImpl &&
            const DeepCollectionEquality().equals(other._entries, _entries));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_entries));

  /// Create a copy of HeatmapResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$HeatmapResponseImplCopyWith<_$HeatmapResponseImpl> get copyWith =>
      __$$HeatmapResponseImplCopyWithImpl<_$HeatmapResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$HeatmapResponseImplToJson(this);
  }
}

abstract class _HeatmapResponse implements HeatmapResponse {
  const factory _HeatmapResponse({final List<HeatmapEntry> entries}) =
      _$HeatmapResponseImpl;

  factory _HeatmapResponse.fromJson(Map<String, dynamic> json) =
      _$HeatmapResponseImpl.fromJson;

  @override
  List<HeatmapEntry> get entries;

  /// Create a copy of HeatmapResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$HeatmapResponseImplCopyWith<_$HeatmapResponseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
