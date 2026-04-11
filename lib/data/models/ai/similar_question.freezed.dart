// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'similar_question.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SimilarQuestion _$SimilarQuestionFromJson(Map<String, dynamic> json) {
  return _SimilarQuestion.fromJson(json);
}

/// @nodoc
mixin _$SimilarQuestion {
  String get questionUuid => throw _privateConstructorUsedError;
  String? get stem => throw _privateConstructorUsedError;
  String? get topicName => throw _privateConstructorUsedError;
  double? get score => throw _privateConstructorUsedError;

  /// Serializes this SimilarQuestion to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SimilarQuestion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SimilarQuestionCopyWith<SimilarQuestion> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SimilarQuestionCopyWith<$Res> {
  factory $SimilarQuestionCopyWith(
    SimilarQuestion value,
    $Res Function(SimilarQuestion) then,
  ) = _$SimilarQuestionCopyWithImpl<$Res, SimilarQuestion>;
  @useResult
  $Res call({
    String questionUuid,
    String? stem,
    String? topicName,
    double? score,
  });
}

/// @nodoc
class _$SimilarQuestionCopyWithImpl<$Res, $Val extends SimilarQuestion>
    implements $SimilarQuestionCopyWith<$Res> {
  _$SimilarQuestionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SimilarQuestion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? stem = freezed,
    Object? topicName = freezed,
    Object? score = freezed,
  }) {
    return _then(
      _value.copyWith(
            questionUuid: null == questionUuid
                ? _value.questionUuid
                : questionUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            stem: freezed == stem
                ? _value.stem
                : stem // ignore: cast_nullable_to_non_nullable
                      as String?,
            topicName: freezed == topicName
                ? _value.topicName
                : topicName // ignore: cast_nullable_to_non_nullable
                      as String?,
            score: freezed == score
                ? _value.score
                : score // ignore: cast_nullable_to_non_nullable
                      as double?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SimilarQuestionImplCopyWith<$Res>
    implements $SimilarQuestionCopyWith<$Res> {
  factory _$$SimilarQuestionImplCopyWith(
    _$SimilarQuestionImpl value,
    $Res Function(_$SimilarQuestionImpl) then,
  ) = __$$SimilarQuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String questionUuid,
    String? stem,
    String? topicName,
    double? score,
  });
}

/// @nodoc
class __$$SimilarQuestionImplCopyWithImpl<$Res>
    extends _$SimilarQuestionCopyWithImpl<$Res, _$SimilarQuestionImpl>
    implements _$$SimilarQuestionImplCopyWith<$Res> {
  __$$SimilarQuestionImplCopyWithImpl(
    _$SimilarQuestionImpl _value,
    $Res Function(_$SimilarQuestionImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SimilarQuestion
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? stem = freezed,
    Object? topicName = freezed,
    Object? score = freezed,
  }) {
    return _then(
      _$SimilarQuestionImpl(
        questionUuid: null == questionUuid
            ? _value.questionUuid
            : questionUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        stem: freezed == stem
            ? _value.stem
            : stem // ignore: cast_nullable_to_non_nullable
                  as String?,
        topicName: freezed == topicName
            ? _value.topicName
            : topicName // ignore: cast_nullable_to_non_nullable
                  as String?,
        score: freezed == score
            ? _value.score
            : score // ignore: cast_nullable_to_non_nullable
                  as double?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SimilarQuestionImpl implements _SimilarQuestion {
  const _$SimilarQuestionImpl({
    required this.questionUuid,
    this.stem,
    this.topicName,
    this.score,
  });

  factory _$SimilarQuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$SimilarQuestionImplFromJson(json);

  @override
  final String questionUuid;
  @override
  final String? stem;
  @override
  final String? topicName;
  @override
  final double? score;

  @override
  String toString() {
    return 'SimilarQuestion(questionUuid: $questionUuid, stem: $stem, topicName: $topicName, score: $score)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SimilarQuestionImpl &&
            (identical(other.questionUuid, questionUuid) ||
                other.questionUuid == questionUuid) &&
            (identical(other.stem, stem) || other.stem == stem) &&
            (identical(other.topicName, topicName) ||
                other.topicName == topicName) &&
            (identical(other.score, score) || other.score == score));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, questionUuid, stem, topicName, score);

  /// Create a copy of SimilarQuestion
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SimilarQuestionImplCopyWith<_$SimilarQuestionImpl> get copyWith =>
      __$$SimilarQuestionImplCopyWithImpl<_$SimilarQuestionImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$SimilarQuestionImplToJson(this);
  }
}

abstract class _SimilarQuestion implements SimilarQuestion {
  const factory _SimilarQuestion({
    required final String questionUuid,
    final String? stem,
    final String? topicName,
    final double? score,
  }) = _$SimilarQuestionImpl;

  factory _SimilarQuestion.fromJson(Map<String, dynamic> json) =
      _$SimilarQuestionImpl.fromJson;

  @override
  String get questionUuid;
  @override
  String? get stem;
  @override
  String? get topicName;
  @override
  double? get score;

  /// Create a copy of SimilarQuestion
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SimilarQuestionImplCopyWith<_$SimilarQuestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
