// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'recommendations_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

RecommendationsResponse _$RecommendationsResponseFromJson(
  Map<String, dynamic> json,
) {
  return _RecommendationsResponse.fromJson(json);
}

/// @nodoc
mixin _$RecommendationsResponse {
  List<QuestionSummary> get questions => throw _privateConstructorUsedError;

  /// Serializes this RecommendationsResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RecommendationsResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RecommendationsResponseCopyWith<RecommendationsResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RecommendationsResponseCopyWith<$Res> {
  factory $RecommendationsResponseCopyWith(
    RecommendationsResponse value,
    $Res Function(RecommendationsResponse) then,
  ) = _$RecommendationsResponseCopyWithImpl<$Res, RecommendationsResponse>;
  @useResult
  $Res call({List<QuestionSummary> questions});
}

/// @nodoc
class _$RecommendationsResponseCopyWithImpl<
  $Res,
  $Val extends RecommendationsResponse
>
    implements $RecommendationsResponseCopyWith<$Res> {
  _$RecommendationsResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RecommendationsResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? questions = null}) {
    return _then(
      _value.copyWith(
            questions: null == questions
                ? _value.questions
                : questions // ignore: cast_nullable_to_non_nullable
                      as List<QuestionSummary>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RecommendationsResponseImplCopyWith<$Res>
    implements $RecommendationsResponseCopyWith<$Res> {
  factory _$$RecommendationsResponseImplCopyWith(
    _$RecommendationsResponseImpl value,
    $Res Function(_$RecommendationsResponseImpl) then,
  ) = __$$RecommendationsResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<QuestionSummary> questions});
}

/// @nodoc
class __$$RecommendationsResponseImplCopyWithImpl<$Res>
    extends
        _$RecommendationsResponseCopyWithImpl<
          $Res,
          _$RecommendationsResponseImpl
        >
    implements _$$RecommendationsResponseImplCopyWith<$Res> {
  __$$RecommendationsResponseImplCopyWithImpl(
    _$RecommendationsResponseImpl _value,
    $Res Function(_$RecommendationsResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RecommendationsResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? questions = null}) {
    return _then(
      _$RecommendationsResponseImpl(
        questions: null == questions
            ? _value._questions
            : questions // ignore: cast_nullable_to_non_nullable
                  as List<QuestionSummary>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$RecommendationsResponseImpl implements _RecommendationsResponse {
  const _$RecommendationsResponseImpl({
    final List<QuestionSummary> questions = const [],
  }) : _questions = questions;

  factory _$RecommendationsResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$RecommendationsResponseImplFromJson(json);

  final List<QuestionSummary> _questions;
  @override
  @JsonKey()
  List<QuestionSummary> get questions {
    if (_questions is EqualUnmodifiableListView) return _questions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_questions);
  }

  @override
  String toString() {
    return 'RecommendationsResponse(questions: $questions)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RecommendationsResponseImpl &&
            const DeepCollectionEquality().equals(
              other._questions,
              _questions,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_questions));

  /// Create a copy of RecommendationsResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RecommendationsResponseImplCopyWith<_$RecommendationsResponseImpl>
  get copyWith =>
      __$$RecommendationsResponseImplCopyWithImpl<
        _$RecommendationsResponseImpl
      >(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RecommendationsResponseImplToJson(this);
  }
}

abstract class _RecommendationsResponse implements RecommendationsResponse {
  const factory _RecommendationsResponse({
    final List<QuestionSummary> questions,
  }) = _$RecommendationsResponseImpl;

  factory _RecommendationsResponse.fromJson(Map<String, dynamic> json) =
      _$RecommendationsResponseImpl.fromJson;

  @override
  List<QuestionSummary> get questions;

  /// Create a copy of RecommendationsResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RecommendationsResponseImplCopyWith<_$RecommendationsResponseImpl>
  get copyWith => throw _privateConstructorUsedError;
}
