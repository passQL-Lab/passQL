// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'topic_analysis_response.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

TopicAnalysisResponse _$TopicAnalysisResponseFromJson(
  Map<String, dynamic> json,
) {
  return _TopicAnalysisResponse.fromJson(json);
}

/// @nodoc
mixin _$TopicAnalysisResponse {
  List<TopicStat> get topicStats => throw _privateConstructorUsedError;

  /// Serializes this TopicAnalysisResponse to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TopicAnalysisResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TopicAnalysisResponseCopyWith<TopicAnalysisResponse> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TopicAnalysisResponseCopyWith<$Res> {
  factory $TopicAnalysisResponseCopyWith(
    TopicAnalysisResponse value,
    $Res Function(TopicAnalysisResponse) then,
  ) = _$TopicAnalysisResponseCopyWithImpl<$Res, TopicAnalysisResponse>;
  @useResult
  $Res call({List<TopicStat> topicStats});
}

/// @nodoc
class _$TopicAnalysisResponseCopyWithImpl<
  $Res,
  $Val extends TopicAnalysisResponse
>
    implements $TopicAnalysisResponseCopyWith<$Res> {
  _$TopicAnalysisResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TopicAnalysisResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? topicStats = null}) {
    return _then(
      _value.copyWith(
            topicStats: null == topicStats
                ? _value.topicStats
                : topicStats // ignore: cast_nullable_to_non_nullable
                      as List<TopicStat>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TopicAnalysisResponseImplCopyWith<$Res>
    implements $TopicAnalysisResponseCopyWith<$Res> {
  factory _$$TopicAnalysisResponseImplCopyWith(
    _$TopicAnalysisResponseImpl value,
    $Res Function(_$TopicAnalysisResponseImpl) then,
  ) = __$$TopicAnalysisResponseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<TopicStat> topicStats});
}

/// @nodoc
class __$$TopicAnalysisResponseImplCopyWithImpl<$Res>
    extends
        _$TopicAnalysisResponseCopyWithImpl<$Res, _$TopicAnalysisResponseImpl>
    implements _$$TopicAnalysisResponseImplCopyWith<$Res> {
  __$$TopicAnalysisResponseImplCopyWithImpl(
    _$TopicAnalysisResponseImpl _value,
    $Res Function(_$TopicAnalysisResponseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TopicAnalysisResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? topicStats = null}) {
    return _then(
      _$TopicAnalysisResponseImpl(
        topicStats: null == topicStats
            ? _value._topicStats
            : topicStats // ignore: cast_nullable_to_non_nullable
                  as List<TopicStat>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TopicAnalysisResponseImpl implements _TopicAnalysisResponse {
  const _$TopicAnalysisResponseImpl({
    final List<TopicStat> topicStats = const [],
  }) : _topicStats = topicStats;

  factory _$TopicAnalysisResponseImpl.fromJson(Map<String, dynamic> json) =>
      _$$TopicAnalysisResponseImplFromJson(json);

  final List<TopicStat> _topicStats;
  @override
  @JsonKey()
  List<TopicStat> get topicStats {
    if (_topicStats is EqualUnmodifiableListView) return _topicStats;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_topicStats);
  }

  @override
  String toString() {
    return 'TopicAnalysisResponse(topicStats: $topicStats)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TopicAnalysisResponseImpl &&
            const DeepCollectionEquality().equals(
              other._topicStats,
              _topicStats,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_topicStats),
  );

  /// Create a copy of TopicAnalysisResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TopicAnalysisResponseImplCopyWith<_$TopicAnalysisResponseImpl>
  get copyWith =>
      __$$TopicAnalysisResponseImplCopyWithImpl<_$TopicAnalysisResponseImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$TopicAnalysisResponseImplToJson(this);
  }
}

abstract class _TopicAnalysisResponse implements TopicAnalysisResponse {
  const factory _TopicAnalysisResponse({final List<TopicStat> topicStats}) =
      _$TopicAnalysisResponseImpl;

  factory _TopicAnalysisResponse.fromJson(Map<String, dynamic> json) =
      _$TopicAnalysisResponseImpl.fromJson;

  @override
  List<TopicStat> get topicStats;

  /// Create a copy of TopicAnalysisResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TopicAnalysisResponseImplCopyWith<_$TopicAnalysisResponseImpl>
  get copyWith => throw _privateConstructorUsedError;
}
