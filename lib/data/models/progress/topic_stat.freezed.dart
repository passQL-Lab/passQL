// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'topic_stat.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TopicStat _$TopicStatFromJson(Map<String, dynamic> json) {
  return _TopicStat.fromJson(json);
}

/// @nodoc
mixin _$TopicStat {
  String get topicUuid => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  int get totalQuestionCount => throw _privateConstructorUsedError;
  double get correctRate => throw _privateConstructorUsedError;
  int get solvedCount => throw _privateConstructorUsedError;

  /// Serializes this TopicStat to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TopicStat
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TopicStatCopyWith<TopicStat> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TopicStatCopyWith<$Res> {
  factory $TopicStatCopyWith(TopicStat value, $Res Function(TopicStat) then) =
      _$TopicStatCopyWithImpl<$Res, TopicStat>;
  @useResult
  $Res call({
    String topicUuid,
    String displayName,
    int totalQuestionCount,
    double correctRate,
    int solvedCount,
  });
}

/// @nodoc
class _$TopicStatCopyWithImpl<$Res, $Val extends TopicStat>
    implements $TopicStatCopyWith<$Res> {
  _$TopicStatCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TopicStat
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicUuid = null,
    Object? displayName = null,
    Object? totalQuestionCount = null,
    Object? correctRate = null,
    Object? solvedCount = null,
  }) {
    return _then(
      _value.copyWith(
            topicUuid: null == topicUuid
                ? _value.topicUuid
                : topicUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            displayName: null == displayName
                ? _value.displayName
                : displayName // ignore: cast_nullable_to_non_nullable
                      as String,
            totalQuestionCount: null == totalQuestionCount
                ? _value.totalQuestionCount
                : totalQuestionCount // ignore: cast_nullable_to_non_nullable
                      as int,
            correctRate: null == correctRate
                ? _value.correctRate
                : correctRate // ignore: cast_nullable_to_non_nullable
                      as double,
            solvedCount: null == solvedCount
                ? _value.solvedCount
                : solvedCount // ignore: cast_nullable_to_non_nullable
                      as int,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TopicStatImplCopyWith<$Res>
    implements $TopicStatCopyWith<$Res> {
  factory _$$TopicStatImplCopyWith(
    _$TopicStatImpl value,
    $Res Function(_$TopicStatImpl) then,
  ) = __$$TopicStatImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String topicUuid,
    String displayName,
    int totalQuestionCount,
    double correctRate,
    int solvedCount,
  });
}

/// @nodoc
class __$$TopicStatImplCopyWithImpl<$Res>
    extends _$TopicStatCopyWithImpl<$Res, _$TopicStatImpl>
    implements _$$TopicStatImplCopyWith<$Res> {
  __$$TopicStatImplCopyWithImpl(
    _$TopicStatImpl _value,
    $Res Function(_$TopicStatImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TopicStat
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicUuid = null,
    Object? displayName = null,
    Object? totalQuestionCount = null,
    Object? correctRate = null,
    Object? solvedCount = null,
  }) {
    return _then(
      _$TopicStatImpl(
        topicUuid: null == topicUuid
            ? _value.topicUuid
            : topicUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        displayName: null == displayName
            ? _value.displayName
            : displayName // ignore: cast_nullable_to_non_nullable
                  as String,
        totalQuestionCount: null == totalQuestionCount
            ? _value.totalQuestionCount
            : totalQuestionCount // ignore: cast_nullable_to_non_nullable
                  as int,
        correctRate: null == correctRate
            ? _value.correctRate
            : correctRate // ignore: cast_nullable_to_non_nullable
                  as double,
        solvedCount: null == solvedCount
            ? _value.solvedCount
            : solvedCount // ignore: cast_nullable_to_non_nullable
                  as int,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TopicStatImpl implements _TopicStat {
  const _$TopicStatImpl({
    required this.topicUuid,
    required this.displayName,
    required this.totalQuestionCount,
    this.correctRate = 0.0,
    this.solvedCount = 0,
  });

  factory _$TopicStatImpl.fromJson(Map<String, dynamic> json) =>
      _$$TopicStatImplFromJson(json);

  @override
  final String topicUuid;
  @override
  final String displayName;
  @override
  final int totalQuestionCount;
  @override
  @JsonKey()
  final double correctRate;
  @override
  @JsonKey()
  final int solvedCount;

  @override
  String toString() {
    return 'TopicStat(topicUuid: $topicUuid, displayName: $displayName, totalQuestionCount: $totalQuestionCount, correctRate: $correctRate, solvedCount: $solvedCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TopicStatImpl &&
            (identical(other.topicUuid, topicUuid) ||
                other.topicUuid == topicUuid) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.totalQuestionCount, totalQuestionCount) ||
                other.totalQuestionCount == totalQuestionCount) &&
            (identical(other.correctRate, correctRate) ||
                other.correctRate == correctRate) &&
            (identical(other.solvedCount, solvedCount) ||
                other.solvedCount == solvedCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    topicUuid,
    displayName,
    totalQuestionCount,
    correctRate,
    solvedCount,
  );

  /// Create a copy of TopicStat
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TopicStatImplCopyWith<_$TopicStatImpl> get copyWith =>
      __$$TopicStatImplCopyWithImpl<_$TopicStatImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TopicStatImplToJson(this);
  }
}

abstract class _TopicStat implements TopicStat {
  const factory _TopicStat({
    required final String topicUuid,
    required final String displayName,
    required final int totalQuestionCount,
    final double correctRate,
    final int solvedCount,
  }) = _$TopicStatImpl;

  factory _TopicStat.fromJson(Map<String, dynamic> json) =
      _$TopicStatImpl.fromJson;

  @override
  String get topicUuid;
  @override
  String get displayName;
  @override
  int get totalQuestionCount;
  @override
  double get correctRate;
  @override
  int get solvedCount;

  /// Create a copy of TopicStat
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TopicStatImplCopyWith<_$TopicStatImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
