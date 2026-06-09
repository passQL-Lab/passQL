// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'choice_set_summary.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ChoiceSetSummary _$ChoiceSetSummaryFromJson(Map<String, dynamic> json) {
  return _ChoiceSetSummary.fromJson(json);
}

/// @nodoc
mixin _$ChoiceSetSummary {
  String get choiceSetUuid => throw _privateConstructorUsedError;
  String get source => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  bool? get sandboxValidationPassed => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  List<ChoiceItem> get items => throw _privateConstructorUsedError;

  /// Serializes this ChoiceSetSummary to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ChoiceSetSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ChoiceSetSummaryCopyWith<ChoiceSetSummary> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChoiceSetSummaryCopyWith<$Res> {
  factory $ChoiceSetSummaryCopyWith(
    ChoiceSetSummary value,
    $Res Function(ChoiceSetSummary) then,
  ) = _$ChoiceSetSummaryCopyWithImpl<$Res, ChoiceSetSummary>;
  @useResult
  $Res call({
    String choiceSetUuid,
    String source,
    String status,
    bool? sandboxValidationPassed,
    String? createdAt,
    List<ChoiceItem> items,
  });
}

/// @nodoc
class _$ChoiceSetSummaryCopyWithImpl<$Res, $Val extends ChoiceSetSummary>
    implements $ChoiceSetSummaryCopyWith<$Res> {
  _$ChoiceSetSummaryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ChoiceSetSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? choiceSetUuid = null,
    Object? source = null,
    Object? status = null,
    Object? sandboxValidationPassed = freezed,
    Object? createdAt = freezed,
    Object? items = null,
  }) {
    return _then(
      _value.copyWith(
            choiceSetUuid: null == choiceSetUuid
                ? _value.choiceSetUuid
                : choiceSetUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            source: null == source
                ? _value.source
                : source // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            sandboxValidationPassed: freezed == sandboxValidationPassed
                ? _value.sandboxValidationPassed
                : sandboxValidationPassed // ignore: cast_nullable_to_non_nullable
                      as bool?,
            createdAt: freezed == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as String?,
            items: null == items
                ? _value.items
                : items // ignore: cast_nullable_to_non_nullable
                      as List<ChoiceItem>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ChoiceSetSummaryImplCopyWith<$Res>
    implements $ChoiceSetSummaryCopyWith<$Res> {
  factory _$$ChoiceSetSummaryImplCopyWith(
    _$ChoiceSetSummaryImpl value,
    $Res Function(_$ChoiceSetSummaryImpl) then,
  ) = __$$ChoiceSetSummaryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String choiceSetUuid,
    String source,
    String status,
    bool? sandboxValidationPassed,
    String? createdAt,
    List<ChoiceItem> items,
  });
}

/// @nodoc
class __$$ChoiceSetSummaryImplCopyWithImpl<$Res>
    extends _$ChoiceSetSummaryCopyWithImpl<$Res, _$ChoiceSetSummaryImpl>
    implements _$$ChoiceSetSummaryImplCopyWith<$Res> {
  __$$ChoiceSetSummaryImplCopyWithImpl(
    _$ChoiceSetSummaryImpl _value,
    $Res Function(_$ChoiceSetSummaryImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ChoiceSetSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? choiceSetUuid = null,
    Object? source = null,
    Object? status = null,
    Object? sandboxValidationPassed = freezed,
    Object? createdAt = freezed,
    Object? items = null,
  }) {
    return _then(
      _$ChoiceSetSummaryImpl(
        choiceSetUuid: null == choiceSetUuid
            ? _value.choiceSetUuid
            : choiceSetUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        source: null == source
            ? _value.source
            : source // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        sandboxValidationPassed: freezed == sandboxValidationPassed
            ? _value.sandboxValidationPassed
            : sandboxValidationPassed // ignore: cast_nullable_to_non_nullable
                  as bool?,
        createdAt: freezed == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as String?,
        items: null == items
            ? _value._items
            : items // ignore: cast_nullable_to_non_nullable
                  as List<ChoiceItem>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ChoiceSetSummaryImpl implements _ChoiceSetSummary {
  const _$ChoiceSetSummaryImpl({
    required this.choiceSetUuid,
    required this.source,
    required this.status,
    this.sandboxValidationPassed,
    this.createdAt,
    final List<ChoiceItem> items = const [],
  }) : _items = items;

  factory _$ChoiceSetSummaryImpl.fromJson(Map<String, dynamic> json) =>
      _$$ChoiceSetSummaryImplFromJson(json);

  @override
  final String choiceSetUuid;
  @override
  final String source;
  @override
  final String status;
  @override
  final bool? sandboxValidationPassed;
  @override
  final String? createdAt;
  final List<ChoiceItem> _items;
  @override
  @JsonKey()
  List<ChoiceItem> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  String toString() {
    return 'ChoiceSetSummary(choiceSetUuid: $choiceSetUuid, source: $source, status: $status, sandboxValidationPassed: $sandboxValidationPassed, createdAt: $createdAt, items: $items)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChoiceSetSummaryImpl &&
            (identical(other.choiceSetUuid, choiceSetUuid) ||
                other.choiceSetUuid == choiceSetUuid) &&
            (identical(other.source, source) || other.source == source) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(
                  other.sandboxValidationPassed,
                  sandboxValidationPassed,
                ) ||
                other.sandboxValidationPassed == sandboxValidationPassed) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            const DeepCollectionEquality().equals(other._items, _items));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    choiceSetUuid,
    source,
    status,
    sandboxValidationPassed,
    createdAt,
    const DeepCollectionEquality().hash(_items),
  );

  /// Create a copy of ChoiceSetSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ChoiceSetSummaryImplCopyWith<_$ChoiceSetSummaryImpl> get copyWith =>
      __$$ChoiceSetSummaryImplCopyWithImpl<_$ChoiceSetSummaryImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$ChoiceSetSummaryImplToJson(this);
  }
}

abstract class _ChoiceSetSummary implements ChoiceSetSummary {
  const factory _ChoiceSetSummary({
    required final String choiceSetUuid,
    required final String source,
    required final String status,
    final bool? sandboxValidationPassed,
    final String? createdAt,
    final List<ChoiceItem> items,
  }) = _$ChoiceSetSummaryImpl;

  factory _ChoiceSetSummary.fromJson(Map<String, dynamic> json) =
      _$ChoiceSetSummaryImpl.fromJson;

  @override
  String get choiceSetUuid;
  @override
  String get source;
  @override
  String get status;
  @override
  bool? get sandboxValidationPassed;
  @override
  String? get createdAt;
  @override
  List<ChoiceItem> get items;

  /// Create a copy of ChoiceSetSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ChoiceSetSummaryImplCopyWith<_$ChoiceSetSummaryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
