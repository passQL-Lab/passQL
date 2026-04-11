// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'question_detail.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

QuestionDetail _$QuestionDetailFromJson(Map<String, dynamic> json) {
  return _QuestionDetail.fromJson(json);
}

/// @nodoc
mixin _$QuestionDetail {
  String get questionUuid => throw _privateConstructorUsedError;
  String? get topicName => throw _privateConstructorUsedError;
  String? get subtopicName => throw _privateConstructorUsedError;
  int? get difficulty => throw _privateConstructorUsedError;
  String? get executionMode => throw _privateConstructorUsedError;
  String get stem => throw _privateConstructorUsedError;
  String? get schemaDisplay => throw _privateConstructorUsedError;
  String? get schemaDdl => throw _privateConstructorUsedError;
  String? get schemaSampleData => throw _privateConstructorUsedError;
  String? get schemaIntent => throw _privateConstructorUsedError;
  String? get answerSql => throw _privateConstructorUsedError;
  String? get hint => throw _privateConstructorUsedError;
  List<ChoiceSetSummary> get choiceSets => throw _privateConstructorUsedError;

  /// Serializes this QuestionDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of QuestionDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $QuestionDetailCopyWith<QuestionDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $QuestionDetailCopyWith<$Res> {
  factory $QuestionDetailCopyWith(
    QuestionDetail value,
    $Res Function(QuestionDetail) then,
  ) = _$QuestionDetailCopyWithImpl<$Res, QuestionDetail>;
  @useResult
  $Res call({
    String questionUuid,
    String? topicName,
    String? subtopicName,
    int? difficulty,
    String? executionMode,
    String stem,
    String? schemaDisplay,
    String? schemaDdl,
    String? schemaSampleData,
    String? schemaIntent,
    String? answerSql,
    String? hint,
    List<ChoiceSetSummary> choiceSets,
  });
}

/// @nodoc
class _$QuestionDetailCopyWithImpl<$Res, $Val extends QuestionDetail>
    implements $QuestionDetailCopyWith<$Res> {
  _$QuestionDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of QuestionDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? topicName = freezed,
    Object? subtopicName = freezed,
    Object? difficulty = freezed,
    Object? executionMode = freezed,
    Object? stem = null,
    Object? schemaDisplay = freezed,
    Object? schemaDdl = freezed,
    Object? schemaSampleData = freezed,
    Object? schemaIntent = freezed,
    Object? answerSql = freezed,
    Object? hint = freezed,
    Object? choiceSets = null,
  }) {
    return _then(
      _value.copyWith(
            questionUuid: null == questionUuid
                ? _value.questionUuid
                : questionUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            topicName: freezed == topicName
                ? _value.topicName
                : topicName // ignore: cast_nullable_to_non_nullable
                      as String?,
            subtopicName: freezed == subtopicName
                ? _value.subtopicName
                : subtopicName // ignore: cast_nullable_to_non_nullable
                      as String?,
            difficulty: freezed == difficulty
                ? _value.difficulty
                : difficulty // ignore: cast_nullable_to_non_nullable
                      as int?,
            executionMode: freezed == executionMode
                ? _value.executionMode
                : executionMode // ignore: cast_nullable_to_non_nullable
                      as String?,
            stem: null == stem
                ? _value.stem
                : stem // ignore: cast_nullable_to_non_nullable
                      as String,
            schemaDisplay: freezed == schemaDisplay
                ? _value.schemaDisplay
                : schemaDisplay // ignore: cast_nullable_to_non_nullable
                      as String?,
            schemaDdl: freezed == schemaDdl
                ? _value.schemaDdl
                : schemaDdl // ignore: cast_nullable_to_non_nullable
                      as String?,
            schemaSampleData: freezed == schemaSampleData
                ? _value.schemaSampleData
                : schemaSampleData // ignore: cast_nullable_to_non_nullable
                      as String?,
            schemaIntent: freezed == schemaIntent
                ? _value.schemaIntent
                : schemaIntent // ignore: cast_nullable_to_non_nullable
                      as String?,
            answerSql: freezed == answerSql
                ? _value.answerSql
                : answerSql // ignore: cast_nullable_to_non_nullable
                      as String?,
            hint: freezed == hint
                ? _value.hint
                : hint // ignore: cast_nullable_to_non_nullable
                      as String?,
            choiceSets: null == choiceSets
                ? _value.choiceSets
                : choiceSets // ignore: cast_nullable_to_non_nullable
                      as List<ChoiceSetSummary>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$QuestionDetailImplCopyWith<$Res>
    implements $QuestionDetailCopyWith<$Res> {
  factory _$$QuestionDetailImplCopyWith(
    _$QuestionDetailImpl value,
    $Res Function(_$QuestionDetailImpl) then,
  ) = __$$QuestionDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String questionUuid,
    String? topicName,
    String? subtopicName,
    int? difficulty,
    String? executionMode,
    String stem,
    String? schemaDisplay,
    String? schemaDdl,
    String? schemaSampleData,
    String? schemaIntent,
    String? answerSql,
    String? hint,
    List<ChoiceSetSummary> choiceSets,
  });
}

/// @nodoc
class __$$QuestionDetailImplCopyWithImpl<$Res>
    extends _$QuestionDetailCopyWithImpl<$Res, _$QuestionDetailImpl>
    implements _$$QuestionDetailImplCopyWith<$Res> {
  __$$QuestionDetailImplCopyWithImpl(
    _$QuestionDetailImpl _value,
    $Res Function(_$QuestionDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of QuestionDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? questionUuid = null,
    Object? topicName = freezed,
    Object? subtopicName = freezed,
    Object? difficulty = freezed,
    Object? executionMode = freezed,
    Object? stem = null,
    Object? schemaDisplay = freezed,
    Object? schemaDdl = freezed,
    Object? schemaSampleData = freezed,
    Object? schemaIntent = freezed,
    Object? answerSql = freezed,
    Object? hint = freezed,
    Object? choiceSets = null,
  }) {
    return _then(
      _$QuestionDetailImpl(
        questionUuid: null == questionUuid
            ? _value.questionUuid
            : questionUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        topicName: freezed == topicName
            ? _value.topicName
            : topicName // ignore: cast_nullable_to_non_nullable
                  as String?,
        subtopicName: freezed == subtopicName
            ? _value.subtopicName
            : subtopicName // ignore: cast_nullable_to_non_nullable
                  as String?,
        difficulty: freezed == difficulty
            ? _value.difficulty
            : difficulty // ignore: cast_nullable_to_non_nullable
                  as int?,
        executionMode: freezed == executionMode
            ? _value.executionMode
            : executionMode // ignore: cast_nullable_to_non_nullable
                  as String?,
        stem: null == stem
            ? _value.stem
            : stem // ignore: cast_nullable_to_non_nullable
                  as String,
        schemaDisplay: freezed == schemaDisplay
            ? _value.schemaDisplay
            : schemaDisplay // ignore: cast_nullable_to_non_nullable
                  as String?,
        schemaDdl: freezed == schemaDdl
            ? _value.schemaDdl
            : schemaDdl // ignore: cast_nullable_to_non_nullable
                  as String?,
        schemaSampleData: freezed == schemaSampleData
            ? _value.schemaSampleData
            : schemaSampleData // ignore: cast_nullable_to_non_nullable
                  as String?,
        schemaIntent: freezed == schemaIntent
            ? _value.schemaIntent
            : schemaIntent // ignore: cast_nullable_to_non_nullable
                  as String?,
        answerSql: freezed == answerSql
            ? _value.answerSql
            : answerSql // ignore: cast_nullable_to_non_nullable
                  as String?,
        hint: freezed == hint
            ? _value.hint
            : hint // ignore: cast_nullable_to_non_nullable
                  as String?,
        choiceSets: null == choiceSets
            ? _value._choiceSets
            : choiceSets // ignore: cast_nullable_to_non_nullable
                  as List<ChoiceSetSummary>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$QuestionDetailImpl implements _QuestionDetail {
  const _$QuestionDetailImpl({
    required this.questionUuid,
    this.topicName,
    this.subtopicName,
    this.difficulty,
    this.executionMode,
    required this.stem,
    this.schemaDisplay,
    this.schemaDdl,
    this.schemaSampleData,
    this.schemaIntent,
    this.answerSql,
    this.hint,
    final List<ChoiceSetSummary> choiceSets = const [],
  }) : _choiceSets = choiceSets;

  factory _$QuestionDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$QuestionDetailImplFromJson(json);

  @override
  final String questionUuid;
  @override
  final String? topicName;
  @override
  final String? subtopicName;
  @override
  final int? difficulty;
  @override
  final String? executionMode;
  @override
  final String stem;
  @override
  final String? schemaDisplay;
  @override
  final String? schemaDdl;
  @override
  final String? schemaSampleData;
  @override
  final String? schemaIntent;
  @override
  final String? answerSql;
  @override
  final String? hint;
  final List<ChoiceSetSummary> _choiceSets;
  @override
  @JsonKey()
  List<ChoiceSetSummary> get choiceSets {
    if (_choiceSets is EqualUnmodifiableListView) return _choiceSets;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_choiceSets);
  }

  @override
  String toString() {
    return 'QuestionDetail(questionUuid: $questionUuid, topicName: $topicName, subtopicName: $subtopicName, difficulty: $difficulty, executionMode: $executionMode, stem: $stem, schemaDisplay: $schemaDisplay, schemaDdl: $schemaDdl, schemaSampleData: $schemaSampleData, schemaIntent: $schemaIntent, answerSql: $answerSql, hint: $hint, choiceSets: $choiceSets)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$QuestionDetailImpl &&
            (identical(other.questionUuid, questionUuid) ||
                other.questionUuid == questionUuid) &&
            (identical(other.topicName, topicName) ||
                other.topicName == topicName) &&
            (identical(other.subtopicName, subtopicName) ||
                other.subtopicName == subtopicName) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            (identical(other.executionMode, executionMode) ||
                other.executionMode == executionMode) &&
            (identical(other.stem, stem) || other.stem == stem) &&
            (identical(other.schemaDisplay, schemaDisplay) ||
                other.schemaDisplay == schemaDisplay) &&
            (identical(other.schemaDdl, schemaDdl) ||
                other.schemaDdl == schemaDdl) &&
            (identical(other.schemaSampleData, schemaSampleData) ||
                other.schemaSampleData == schemaSampleData) &&
            (identical(other.schemaIntent, schemaIntent) ||
                other.schemaIntent == schemaIntent) &&
            (identical(other.answerSql, answerSql) ||
                other.answerSql == answerSql) &&
            (identical(other.hint, hint) || other.hint == hint) &&
            const DeepCollectionEquality().equals(
              other._choiceSets,
              _choiceSets,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    questionUuid,
    topicName,
    subtopicName,
    difficulty,
    executionMode,
    stem,
    schemaDisplay,
    schemaDdl,
    schemaSampleData,
    schemaIntent,
    answerSql,
    hint,
    const DeepCollectionEquality().hash(_choiceSets),
  );

  /// Create a copy of QuestionDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$QuestionDetailImplCopyWith<_$QuestionDetailImpl> get copyWith =>
      __$$QuestionDetailImplCopyWithImpl<_$QuestionDetailImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$QuestionDetailImplToJson(this);
  }
}

abstract class _QuestionDetail implements QuestionDetail {
  const factory _QuestionDetail({
    required final String questionUuid,
    final String? topicName,
    final String? subtopicName,
    final int? difficulty,
    final String? executionMode,
    required final String stem,
    final String? schemaDisplay,
    final String? schemaDdl,
    final String? schemaSampleData,
    final String? schemaIntent,
    final String? answerSql,
    final String? hint,
    final List<ChoiceSetSummary> choiceSets,
  }) = _$QuestionDetailImpl;

  factory _QuestionDetail.fromJson(Map<String, dynamic> json) =
      _$QuestionDetailImpl.fromJson;

  @override
  String get questionUuid;
  @override
  String? get topicName;
  @override
  String? get subtopicName;
  @override
  int? get difficulty;
  @override
  String? get executionMode;
  @override
  String get stem;
  @override
  String? get schemaDisplay;
  @override
  String? get schemaDdl;
  @override
  String? get schemaSampleData;
  @override
  String? get schemaIntent;
  @override
  String? get answerSql;
  @override
  String? get hint;
  @override
  List<ChoiceSetSummary> get choiceSets;

  /// Create a copy of QuestionDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$QuestionDetailImplCopyWith<_$QuestionDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
