// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'question_summary.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

QuestionSummary _$QuestionSummaryFromJson(Map<String, dynamic> json) {
  return _QuestionSummary.fromJson(json);
}

/// @nodoc
mixin _$QuestionSummary {
  String get questionUuid => throw _privateConstructorUsedError;
  String? get topicCode => throw _privateConstructorUsedError;
  String? get topicName => throw _privateConstructorUsedError;
  String? get stemPreview => throw _privateConstructorUsedError;
  int? get difficulty => throw _privateConstructorUsedError;
  String? get executionMode => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;

  /// Serializes this QuestionSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of QuestionSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $QuestionSummaryCopyWith<QuestionSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $QuestionSummaryCopyWith<$Res> {
  factory $QuestionSummaryCopyWith(
    QuestionSummary value,
    $Res Function(QuestionSummary) then,
  ) = _$QuestionSummaryCopyWithImpl<$Res, QuestionSummary>;
  @useResult
  $Res call({
    String questionUuid,
    String? topicCode,
    String? topicName,
    String? stemPreview,
    int? difficulty,
    String? executionMode,
    String? createdAt,
  });
}

/// @nodoc
class _$QuestionSummaryCopyWithImpl<$Res, $Val extends QuestionSummary>
    implements $QuestionSummaryCopyWith<$Res> {
  _$QuestionSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of QuestionSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? topicCode = freezed,
    Object? topicName = freezed,
    Object? stemPreview = freezed,
    Object? difficulty = freezed,
    Object? executionMode = freezed,
    Object? createdAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            questionUuid: null == questionUuid
                ? _value.questionUuid
                : questionUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            topicCode: freezed == topicCode
                ? _value.topicCode
                : topicCode // ignore: cast_nullable_to_non_nullable
                      as String?,
            topicName: freezed == topicName
                ? _value.topicName
                : topicName // ignore: cast_nullable_to_non_nullable
                      as String?,
            stemPreview: freezed == stemPreview
                ? _value.stemPreview
                : stemPreview // ignore: cast_nullable_to_non_nullable
                      as String?,
            difficulty: freezed == difficulty
                ? _value.difficulty
                : difficulty // ignore: cast_nullable_to_non_nullable
                      as int?,
            executionMode: freezed == executionMode
                ? _value.executionMode
                : executionMode // ignore: cast_nullable_to_non_nullable
                      as String?,
            createdAt: freezed == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$QuestionSummaryImplCopyWith<$Res>
    implements $QuestionSummaryCopyWith<$Res> {
  factory _$$QuestionSummaryImplCopyWith(
    _$QuestionSummaryImpl value,
    $Res Function(_$QuestionSummaryImpl) then,
  ) = __$$QuestionSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String questionUuid,
    String? topicCode,
    String? topicName,
    String? stemPreview,
    int? difficulty,
    String? executionMode,
    String? createdAt,
  });
}

/// @nodoc
class __$$QuestionSummaryImplCopyWithImpl<$Res>
    extends _$QuestionSummaryCopyWithImpl<$Res, _$QuestionSummaryImpl>
    implements _$$QuestionSummaryImplCopyWith<$Res> {
  __$$QuestionSummaryImplCopyWithImpl(
    _$QuestionSummaryImpl _value,
    $Res Function(_$QuestionSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of QuestionSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? topicCode = freezed,
    Object? topicName = freezed,
    Object? stemPreview = freezed,
    Object? difficulty = freezed,
    Object? executionMode = freezed,
    Object? createdAt = freezed,
  }) {
    return _then(
      _$QuestionSummaryImpl(
        questionUuid: null == questionUuid
            ? _value.questionUuid
            : questionUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        topicCode: freezed == topicCode
            ? _value.topicCode
            : topicCode // ignore: cast_nullable_to_non_nullable
                  as String?,
        topicName: freezed == topicName
            ? _value.topicName
            : topicName // ignore: cast_nullable_to_non_nullable
                  as String?,
        stemPreview: freezed == stemPreview
            ? _value.stemPreview
            : stemPreview // ignore: cast_nullable_to_non_nullable
                  as String?,
        difficulty: freezed == difficulty
            ? _value.difficulty
            : difficulty // ignore: cast_nullable_to_non_nullable
                  as int?,
        executionMode: freezed == executionMode
            ? _value.executionMode
            : executionMode // ignore: cast_nullable_to_non_nullable
                  as String?,
        createdAt: freezed == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$QuestionSummaryImpl implements _QuestionSummary {
  const _$QuestionSummaryImpl({
    required this.questionUuid,
    this.topicCode,
    this.topicName,
    this.stemPreview,
    this.difficulty,
    this.executionMode,
    this.createdAt,
  });

  factory _$QuestionSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$QuestionSummaryImplFromJson(json);

  @override
  final String questionUuid;
  @override
  final String? topicCode;
  @override
  final String? topicName;
  @override
  final String? stemPreview;
  @override
  final int? difficulty;
  @override
  final String? executionMode;
  @override
  final String? createdAt;

  @override
  String toString() {
    return 'QuestionSummary(questionUuid: $questionUuid, topicCode: $topicCode, topicName: $topicName, stemPreview: $stemPreview, difficulty: $difficulty, executionMode: $executionMode, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$QuestionSummaryImpl &&
            (identical(other.questionUuid, questionUuid) ||
                other.questionUuid == questionUuid) &&
            (identical(other.topicCode, topicCode) ||
                other.topicCode == topicCode) &&
            (identical(other.topicName, topicName) ||
                other.topicName == topicName) &&
            (identical(other.stemPreview, stemPreview) ||
                other.stemPreview == stemPreview) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            (identical(other.executionMode, executionMode) ||
                other.executionMode == executionMode) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    questionUuid,
    topicCode,
    topicName,
    stemPreview,
    difficulty,
    executionMode,
    createdAt,
  );

  /// Create a copy of QuestionSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$QuestionSummaryImplCopyWith<_$QuestionSummaryImpl> get copyWith =>
      __$$QuestionSummaryImplCopyWithImpl<_$QuestionSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$QuestionSummaryImplToJson(this);
  }
}

abstract class _QuestionSummary implements QuestionSummary {
  const factory _QuestionSummary({
    required final String questionUuid,
    final String? topicCode,
    final String? topicName,
    final String? stemPreview,
    final int? difficulty,
    final String? executionMode,
    final String? createdAt,
  }) = _$QuestionSummaryImpl;

  factory _QuestionSummary.fromJson(Map<String, dynamic> json) =
      _$QuestionSummaryImpl.fromJson;

  @override
  String get questionUuid;
  @override
  String? get topicCode;
  @override
  String? get topicName;
  @override
  String? get stemPreview;
  @override
  int? get difficulty;
  @override
  String? get executionMode;
  @override
  String? get createdAt;

  /// Create a copy of QuestionSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$QuestionSummaryImplCopyWith<_$QuestionSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
