// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'category_stats.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

CategoryStats _$CategoryStatsFromJson(Map<String, dynamic> json) {
  return _CategoryStats.fromJson(json);
}

/// @nodoc
mixin _$CategoryStats {
  String get topicCode => throw _privateConstructorUsedError;
  String get topicName => throw _privateConstructorUsedError;
  int get solvedCount => throw _privateConstructorUsedError;
  int get correctCount => throw _privateConstructorUsedError;
  int get totalQuestionCount => throw _privateConstructorUsedError;
  double get correctRate => throw _privateConstructorUsedError;

  /// Serializes this CategoryStats to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CategoryStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CategoryStatsCopyWith<CategoryStats> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CategoryStatsCopyWith<$Res> {
  factory $CategoryStatsCopyWith(
    CategoryStats value,
    $Res Function(CategoryStats) then,
  ) = _$CategoryStatsCopyWithImpl<$Res, CategoryStats>;
  @useResult
  $Res call({
    String topicCode,
    String topicName,
    int solvedCount,
    int correctCount,
    int totalQuestionCount,
    double correctRate,
  });
}

/// @nodoc
class _$CategoryStatsCopyWithImpl<$Res, $Val extends CategoryStats>
    implements $CategoryStatsCopyWith<$Res> {
  _$CategoryStatsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CategoryStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicCode = null,
    Object? topicName = null,
    Object? solvedCount = null,
    Object? correctCount = null,
    Object? totalQuestionCount = null,
    Object? correctRate = null,
  }) {
    return _then(
      _value.copyWith(
            topicCode: null == topicCode
                ? _value.topicCode
                : topicCode // ignore: cast_nullable_to_non_nullable
                      as String,
            topicName: null == topicName
                ? _value.topicName
                : topicName // ignore: cast_nullable_to_non_nullable
                      as String,
            solvedCount: null == solvedCount
                ? _value.solvedCount
                : solvedCount // ignore: cast_nullable_to_non_nullable
                      as int,
            correctCount: null == correctCount
                ? _value.correctCount
                : correctCount // ignore: cast_nullable_to_non_nullable
                      as int,
            totalQuestionCount: null == totalQuestionCount
                ? _value.totalQuestionCount
                : totalQuestionCount // ignore: cast_nullable_to_non_nullable
                      as int,
            correctRate: null == correctRate
                ? _value.correctRate
                : correctRate // ignore: cast_nullable_to_non_nullable
                      as double,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CategoryStatsImplCopyWith<$Res>
    implements $CategoryStatsCopyWith<$Res> {
  factory _$$CategoryStatsImplCopyWith(
    _$CategoryStatsImpl value,
    $Res Function(_$CategoryStatsImpl) then,
  ) = __$$CategoryStatsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String topicCode,
    String topicName,
    int solvedCount,
    int correctCount,
    int totalQuestionCount,
    double correctRate,
  });
}

/// @nodoc
class __$$CategoryStatsImplCopyWithImpl<$Res>
    extends _$CategoryStatsCopyWithImpl<$Res, _$CategoryStatsImpl>
    implements _$$CategoryStatsImplCopyWith<$Res> {
  __$$CategoryStatsImplCopyWithImpl(
    _$CategoryStatsImpl _value,
    $Res Function(_$CategoryStatsImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CategoryStats
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicCode = null,
    Object? topicName = null,
    Object? solvedCount = null,
    Object? correctCount = null,
    Object? totalQuestionCount = null,
    Object? correctRate = null,
  }) {
    return _then(
      _$CategoryStatsImpl(
        topicCode: null == topicCode
            ? _value.topicCode
            : topicCode // ignore: cast_nullable_to_non_nullable
                  as String,
        topicName: null == topicName
            ? _value.topicName
            : topicName // ignore: cast_nullable_to_non_nullable
                  as String,
        solvedCount: null == solvedCount
            ? _value.solvedCount
            : solvedCount // ignore: cast_nullable_to_non_nullable
                  as int,
        correctCount: null == correctCount
            ? _value.correctCount
            : correctCount // ignore: cast_nullable_to_non_nullable
                  as int,
        totalQuestionCount: null == totalQuestionCount
            ? _value.totalQuestionCount
            : totalQuestionCount // ignore: cast_nullable_to_non_nullable
                  as int,
        correctRate: null == correctRate
            ? _value.correctRate
            : correctRate // ignore: cast_nullable_to_non_nullable
                  as double,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CategoryStatsImpl implements _CategoryStats {
  const _$CategoryStatsImpl({
    required this.topicCode,
    required this.topicName,
    required this.solvedCount,
    required this.correctCount,
    required this.totalQuestionCount,
    this.correctRate = 0.0,
  });

  factory _$CategoryStatsImpl.fromJson(Map<String, dynamic> json) =>
      _$$CategoryStatsImplFromJson(json);

  @override
  final String topicCode;
  @override
  final String topicName;
  @override
  final int solvedCount;
  @override
  final int correctCount;
  @override
  final int totalQuestionCount;
  @override
  @JsonKey()
  final double correctRate;

  @override
  String toString() {
    return 'CategoryStats(topicCode: $topicCode, topicName: $topicName, solvedCount: $solvedCount, correctCount: $correctCount, totalQuestionCount: $totalQuestionCount, correctRate: $correctRate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CategoryStatsImpl &&
            (identical(other.topicCode, topicCode) ||
                other.topicCode == topicCode) &&
            (identical(other.topicName, topicName) ||
                other.topicName == topicName) &&
            (identical(other.solvedCount, solvedCount) ||
                other.solvedCount == solvedCount) &&
            (identical(other.correctCount, correctCount) ||
                other.correctCount == correctCount) &&
            (identical(other.totalQuestionCount, totalQuestionCount) ||
                other.totalQuestionCount == totalQuestionCount) &&
            (identical(other.correctRate, correctRate) ||
                other.correctRate == correctRate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    topicCode,
    topicName,
    solvedCount,
    correctCount,
    totalQuestionCount,
    correctRate,
  );

  /// Create a copy of CategoryStats
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CategoryStatsImplCopyWith<_$CategoryStatsImpl> get copyWith =>
      __$$CategoryStatsImplCopyWithImpl<_$CategoryStatsImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CategoryStatsImplToJson(this);
  }
}

abstract class _CategoryStats implements CategoryStats {
  const factory _CategoryStats({
    required final String topicCode,
    required final String topicName,
    required final int solvedCount,
    required final int correctCount,
    required final int totalQuestionCount,
    final double correctRate,
  }) = _$CategoryStatsImpl;

  factory _CategoryStats.fromJson(Map<String, dynamic> json) =
      _$CategoryStatsImpl.fromJson;

  @override
  String get topicCode;
  @override
  String get topicName;
  @override
  int get solvedCount;
  @override
  int get correctCount;
  @override
  int get totalQuestionCount;
  @override
  double get correctRate;

  /// Create a copy of CategoryStats
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CategoryStatsImplCopyWith<_$CategoryStatsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
