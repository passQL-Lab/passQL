// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'choice_item.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ChoiceItem _$ChoiceItemFromJson(Map<String, dynamic> json) {
  return _ChoiceItem.fromJson(json);
}

/// @nodoc
mixin _$ChoiceItem {
  String get key => throw _privateConstructorUsedError;
  String get kind => throw _privateConstructorUsedError;
  String get body => throw _privateConstructorUsedError;
  bool? get isCorrect => throw _privateConstructorUsedError;
  String? get rationale => throw _privateConstructorUsedError;
  int? get sortOrder => throw _privateConstructorUsedError;

  /// Serializes this ChoiceItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ChoiceItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ChoiceItemCopyWith<ChoiceItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChoiceItemCopyWith<$Res> {
  factory $ChoiceItemCopyWith(
    ChoiceItem value,
    $Res Function(ChoiceItem) then,
  ) = _$ChoiceItemCopyWithImpl<$Res, ChoiceItem>;
  @useResult
  $Res call({
    String key,
    String kind,
    String body,
    bool? isCorrect,
    String? rationale,
    int? sortOrder,
  });
}

/// @nodoc
class _$ChoiceItemCopyWithImpl<$Res, $Val extends ChoiceItem>
    implements $ChoiceItemCopyWith<$Res> {
  _$ChoiceItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ChoiceItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? key = null,
    Object? kind = null,
    Object? body = null,
    Object? isCorrect = freezed,
    Object? rationale = freezed,
    Object? sortOrder = freezed,
  }) {
    return _then(
      _value.copyWith(
            key: null == key
                ? _value.key
                : key // ignore: cast_nullable_to_non_nullable
                      as String,
            kind: null == kind
                ? _value.kind
                : kind // ignore: cast_nullable_to_non_nullable
                      as String,
            body: null == body
                ? _value.body
                : body // ignore: cast_nullable_to_non_nullable
                      as String,
            isCorrect: freezed == isCorrect
                ? _value.isCorrect
                : isCorrect // ignore: cast_nullable_to_non_nullable
                      as bool?,
            rationale: freezed == rationale
                ? _value.rationale
                : rationale // ignore: cast_nullable_to_non_nullable
                      as String?,
            sortOrder: freezed == sortOrder
                ? _value.sortOrder
                : sortOrder // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ChoiceItemImplCopyWith<$Res>
    implements $ChoiceItemCopyWith<$Res> {
  factory _$$ChoiceItemImplCopyWith(
    _$ChoiceItemImpl value,
    $Res Function(_$ChoiceItemImpl) then,
  ) = __$$ChoiceItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String key,
    String kind,
    String body,
    bool? isCorrect,
    String? rationale,
    int? sortOrder,
  });
}

/// @nodoc
class __$$ChoiceItemImplCopyWithImpl<$Res>
    extends _$ChoiceItemCopyWithImpl<$Res, _$ChoiceItemImpl>
    implements _$$ChoiceItemImplCopyWith<$Res> {
  __$$ChoiceItemImplCopyWithImpl(
    _$ChoiceItemImpl _value,
    $Res Function(_$ChoiceItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ChoiceItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? key = null,
    Object? kind = null,
    Object? body = null,
    Object? isCorrect = freezed,
    Object? rationale = freezed,
    Object? sortOrder = freezed,
  }) {
    return _then(
      _$ChoiceItemImpl(
        key: null == key
            ? _value.key
            : key // ignore: cast_nullable_to_non_nullable
                  as String,
        kind: null == kind
            ? _value.kind
            : kind // ignore: cast_nullable_to_non_nullable
                  as String,
        body: null == body
            ? _value.body
            : body // ignore: cast_nullable_to_non_nullable
                  as String,
        isCorrect: freezed == isCorrect
            ? _value.isCorrect
            : isCorrect // ignore: cast_nullable_to_non_nullable
                  as bool?,
        rationale: freezed == rationale
            ? _value.rationale
            : rationale // ignore: cast_nullable_to_non_nullable
                  as String?,
        sortOrder: freezed == sortOrder
            ? _value.sortOrder
            : sortOrder // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ChoiceItemImpl implements _ChoiceItem {
  const _$ChoiceItemImpl({
    required this.key,
    required this.kind,
    required this.body,
    this.isCorrect,
    this.rationale,
    this.sortOrder,
  });

  factory _$ChoiceItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$ChoiceItemImplFromJson(json);

  @override
  final String key;
  @override
  final String kind;
  @override
  final String body;
  @override
  final bool? isCorrect;
  @override
  final String? rationale;
  @override
  final int? sortOrder;

  @override
  String toString() {
    return 'ChoiceItem(key: $key, kind: $kind, body: $body, isCorrect: $isCorrect, rationale: $rationale, sortOrder: $sortOrder)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChoiceItemImpl &&
            (identical(other.key, key) || other.key == key) &&
            (identical(other.kind, kind) || other.kind == kind) &&
            (identical(other.body, body) || other.body == body) &&
            (identical(other.isCorrect, isCorrect) ||
                other.isCorrect == isCorrect) &&
            (identical(other.rationale, rationale) ||
                other.rationale == rationale) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    key,
    kind,
    body,
    isCorrect,
    rationale,
    sortOrder,
  );

  /// Create a copy of ChoiceItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ChoiceItemImplCopyWith<_$ChoiceItemImpl> get copyWith =>
      __$$ChoiceItemImplCopyWithImpl<_$ChoiceItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ChoiceItemImplToJson(this);
  }
}

abstract class _ChoiceItem implements ChoiceItem {
  const factory _ChoiceItem({
    required final String key,
    required final String kind,
    required final String body,
    final bool? isCorrect,
    final String? rationale,
    final int? sortOrder,
  }) = _$ChoiceItemImpl;

  factory _ChoiceItem.fromJson(Map<String, dynamic> json) =
      _$ChoiceItemImpl.fromJson;

  @override
  String get key;
  @override
  String get kind;
  @override
  String get body;
  @override
  bool? get isCorrect;
  @override
  String? get rationale;
  @override
  int? get sortOrder;

  /// Create a copy of ChoiceItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ChoiceItemImplCopyWith<_$ChoiceItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
