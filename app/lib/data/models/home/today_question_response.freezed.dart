// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'today_question_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TodayQuestionResponse _$TodayQuestionResponseFromJson(
  Map<String, dynamic> json,
) {
  return _TodayQuestionResponse.fromJson(json);
}

/// @nodoc
mixin _$TodayQuestionResponse {
  QuestionSummary? get question => throw _privateConstructorUsedError;
  bool get alreadySolvedToday => throw _privateConstructorUsedError;

  /// Serializes this TodayQuestionResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TodayQuestionResponseCopyWith<TodayQuestionResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TodayQuestionResponseCopyWith<$Res> {
  factory $TodayQuestionResponseCopyWith(
    TodayQuestionResponse value,
    $Res Function(TodayQuestionResponse) then,
  ) = _$TodayQuestionResponseCopyWithImpl<$Res, TodayQuestionResponse>;
  @useResult
  $Res call({QuestionSummary? question, bool alreadySolvedToday});

  $QuestionSummaryCopyWith<$Res>? get question;
}

/// @nodoc
class _$TodayQuestionResponseCopyWithImpl<
  $Res,
  $Val extends TodayQuestionResponse
>
    implements $TodayQuestionResponseCopyWith<$Res> {
  _$TodayQuestionResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? question = freezed, Object? alreadySolvedToday = null}) {
    return _then(
      _value.copyWith(
            question: freezed == question
                ? _value.question
                : question // ignore: cast_nullable_to_non_nullable
                      as QuestionSummary?,
            alreadySolvedToday: null == alreadySolvedToday
                ? _value.alreadySolvedToday
                : alreadySolvedToday // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $QuestionSummaryCopyWith<$Res>? get question {
    if (_value.question == null) {
      return null;
    }

    return $QuestionSummaryCopyWith<$Res>(_value.question!, (value) {
      return _then(_value.copyWith(question: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$TodayQuestionResponseImplCopyWith<$Res>
    implements $TodayQuestionResponseCopyWith<$Res> {
  factory _$$TodayQuestionResponseImplCopyWith(
    _$TodayQuestionResponseImpl value,
    $Res Function(_$TodayQuestionResponseImpl) then,
  ) = __$$TodayQuestionResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({QuestionSummary? question, bool alreadySolvedToday});

  @override
  $QuestionSummaryCopyWith<$Res>? get question;
}

/// @nodoc
class __$$TodayQuestionResponseImplCopyWithImpl<$Res>
    extends
        _$TodayQuestionResponseCopyWithImpl<$Res, _$TodayQuestionResponseImpl>
    implements _$$TodayQuestionResponseImplCopyWith<$Res> {
  __$$TodayQuestionResponseImplCopyWithImpl(
    _$TodayQuestionResponseImpl _value,
    $Res Function(_$TodayQuestionResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? question = freezed, Object? alreadySolvedToday = null}) {
    return _then(
      _$TodayQuestionResponseImpl(
        question: freezed == question
            ? _value.question
            : question // ignore: cast_nullable_to_non_nullable
                  as QuestionSummary?,
        alreadySolvedToday: null == alreadySolvedToday
            ? _value.alreadySolvedToday
            : alreadySolvedToday // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TodayQuestionResponseImpl implements _TodayQuestionResponse {
  const _$TodayQuestionResponseImpl({
    this.question,
    this.alreadySolvedToday = false,
  });

  factory _$TodayQuestionResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$TodayQuestionResponseImplFromJson(json);

  @override
  final QuestionSummary? question;
  @override
  @JsonKey()
  final bool alreadySolvedToday;

  @override
  String toString() {
    return 'TodayQuestionResponse(question: $question, alreadySolvedToday: $alreadySolvedToday)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TodayQuestionResponseImpl &&
            (identical(other.question, question) ||
                other.question == question) &&
            (identical(other.alreadySolvedToday, alreadySolvedToday) ||
                other.alreadySolvedToday == alreadySolvedToday));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, question, alreadySolvedToday);

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TodayQuestionResponseImplCopyWith<_$TodayQuestionResponseImpl>
  get copyWith =>
      __$$TodayQuestionResponseImplCopyWithImpl<_$TodayQuestionResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$TodayQuestionResponseImplToJson(this);
  }
}

abstract class _TodayQuestionResponse implements TodayQuestionResponse {
  const factory _TodayQuestionResponse({
    final QuestionSummary? question,
    final bool alreadySolvedToday,
  }) = _$TodayQuestionResponseImpl;

  factory _TodayQuestionResponse.fromJson(Map<String, dynamic> json) =
      _$TodayQuestionResponseImpl.fromJson;

  @override
  QuestionSummary? get question;
  @override
  bool get alreadySolvedToday;

  /// Create a copy of TodayQuestionResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TodayQuestionResponseImplCopyWith<_$TodayQuestionResponseImpl>
  get copyWith => throw _privateConstructorUsedError;
}
