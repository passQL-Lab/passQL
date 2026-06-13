// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'question_list_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

QuestionListResponse _$QuestionListResponseFromJson(Map<String, dynamic> json) {
  return _QuestionListResponse.fromJson(json);
}

/// @nodoc
mixin _$QuestionListResponse {
  List<QuestionSummary> get content => throw _privateConstructorUsedError;
  int get totalElements => throw _privateConstructorUsedError;
  int get totalPages => throw _privateConstructorUsedError;
  int get number => throw _privateConstructorUsedError;
  bool get last => throw _privateConstructorUsedError;

  /// Serializes this QuestionListResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of QuestionListResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $QuestionListResponseCopyWith<QuestionListResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $QuestionListResponseCopyWith<$Res> {
  factory $QuestionListResponseCopyWith(
    QuestionListResponse value,
    $Res Function(QuestionListResponse) then,
  ) = _$QuestionListResponseCopyWithImpl<$Res, QuestionListResponse>;
  @useResult
  $Res call({
    List<QuestionSummary> content,
    int totalElements,
    int totalPages,
    int number,
    bool last,
  });
}

/// @nodoc
class _$QuestionListResponseCopyWithImpl<
  $Res,
  $Val extends QuestionListResponse
>
    implements $QuestionListResponseCopyWith<$Res> {
  _$QuestionListResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of QuestionListResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = null,
    Object? totalElements = null,
    Object? totalPages = null,
    Object? number = null,
    Object? last = null,
  }) {
    return _then(
      _value.copyWith(
            content: null == content
                ? _value.content
                : content // ignore: cast_nullable_to_non_nullable
                      as List<QuestionSummary>,
            totalElements: null == totalElements
                ? _value.totalElements
                : totalElements // ignore: cast_nullable_to_non_nullable
                      as int,
            totalPages: null == totalPages
                ? _value.totalPages
                : totalPages // ignore: cast_nullable_to_non_nullable
                      as int,
            number: null == number
                ? _value.number
                : number // ignore: cast_nullable_to_non_nullable
                      as int,
            last: null == last
                ? _value.last
                : last // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$QuestionListResponseImplCopyWith<$Res>
    implements $QuestionListResponseCopyWith<$Res> {
  factory _$$QuestionListResponseImplCopyWith(
    _$QuestionListResponseImpl value,
    $Res Function(_$QuestionListResponseImpl) then,
  ) = __$$QuestionListResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    List<QuestionSummary> content,
    int totalElements,
    int totalPages,
    int number,
    bool last,
  });
}

/// @nodoc
class __$$QuestionListResponseImplCopyWithImpl<$Res>
    extends _$QuestionListResponseCopyWithImpl<$Res, _$QuestionListResponseImpl>
    implements _$$QuestionListResponseImplCopyWith<$Res> {
  __$$QuestionListResponseImplCopyWithImpl(
    _$QuestionListResponseImpl _value,
    $Res Function(_$QuestionListResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of QuestionListResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? content = null,
    Object? totalElements = null,
    Object? totalPages = null,
    Object? number = null,
    Object? last = null,
  }) {
    return _then(
      _$QuestionListResponseImpl(
        content: null == content
            ? _value._content
            : content // ignore: cast_nullable_to_non_nullable
                  as List<QuestionSummary>,
        totalElements: null == totalElements
            ? _value.totalElements
            : totalElements // ignore: cast_nullable_to_non_nullable
                  as int,
        totalPages: null == totalPages
            ? _value.totalPages
            : totalPages // ignore: cast_nullable_to_non_nullable
                  as int,
        number: null == number
            ? _value.number
            : number // ignore: cast_nullable_to_non_nullable
                  as int,
        last: null == last
            ? _value.last
            : last // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$QuestionListResponseImpl implements _QuestionListResponse {
  const _$QuestionListResponseImpl({
    required final List<QuestionSummary> content,
    required this.totalElements,
    required this.totalPages,
    required this.number,
    required this.last,
  }) : _content = content;

  factory _$QuestionListResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$QuestionListResponseImplFromJson(json);

  final List<QuestionSummary> _content;
  @override
  List<QuestionSummary> get content {
    if (_content is EqualUnmodifiableListView) return _content;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_content);
  }

  @override
  final int totalElements;
  @override
  final int totalPages;
  @override
  final int number;
  @override
  final bool last;

  @override
  String toString() {
    return 'QuestionListResponse(content: $content, totalElements: $totalElements, totalPages: $totalPages, number: $number, last: $last)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$QuestionListResponseImpl &&
            const DeepCollectionEquality().equals(other._content, _content) &&
            (identical(other.totalElements, totalElements) ||
                other.totalElements == totalElements) &&
            (identical(other.totalPages, totalPages) ||
                other.totalPages == totalPages) &&
            (identical(other.number, number) || other.number == number) &&
            (identical(other.last, last) || other.last == last));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_content),
    totalElements,
    totalPages,
    number,
    last,
  );

  /// Create a copy of QuestionListResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$QuestionListResponseImplCopyWith<_$QuestionListResponseImpl>
  get copyWith =>
      __$$QuestionListResponseImplCopyWithImpl<_$QuestionListResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$QuestionListResponseImplToJson(this);
  }
}

abstract class _QuestionListResponse implements QuestionListResponse {
  const factory _QuestionListResponse({
    required final List<QuestionSummary> content,
    required final int totalElements,
    required final int totalPages,
    required final int number,
    required final bool last,
  }) = _$QuestionListResponseImpl;

  factory _QuestionListResponse.fromJson(Map<String, dynamic> json) =
      _$QuestionListResponseImpl.fromJson;

  @override
  List<QuestionSummary> get content;
  @override
  int get totalElements;
  @override
  int get totalPages;
  @override
  int get number;
  @override
  bool get last;

  /// Create a copy of QuestionListResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$QuestionListResponseImplCopyWith<_$QuestionListResponseImpl>
  get copyWith => throw _privateConstructorUsedError;
}
