// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'topic_tree.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SubtopicItem _$SubtopicItemFromJson(Map<String, dynamic> json) {
  return _SubtopicItem.fromJson(json);
}

/// @nodoc
mixin _$SubtopicItem {
  String get code => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  int? get sortOrder => throw _privateConstructorUsedError;
  bool? get isActive => throw _privateConstructorUsedError;

  /// Serializes this SubtopicItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SubtopicItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SubtopicItemCopyWith<SubtopicItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SubtopicItemCopyWith<$Res> {
  factory $SubtopicItemCopyWith(
    SubtopicItem value,
    $Res Function(SubtopicItem) then,
  ) = _$SubtopicItemCopyWithImpl<$Res, SubtopicItem>;
  @useResult
  $Res call({String code, String displayName, int? sortOrder, bool? isActive});
}

/// @nodoc
class _$SubtopicItemCopyWithImpl<$Res, $Val extends SubtopicItem>
    implements $SubtopicItemCopyWith<$Res> {
  _$SubtopicItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SubtopicItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? code = null,
    Object? displayName = null,
    Object? sortOrder = freezed,
    Object? isActive = freezed,
  }) {
    return _then(
      _value.copyWith(
            code: null == code
                ? _value.code
                : code // ignore: cast_nullable_to_non_nullable
                      as String,
            displayName: null == displayName
                ? _value.displayName
                : displayName // ignore: cast_nullable_to_non_nullable
                      as String,
            sortOrder: freezed == sortOrder
                ? _value.sortOrder
                : sortOrder // ignore: cast_nullable_to_non_nullable
                      as int?,
            isActive: freezed == isActive
                ? _value.isActive
                : isActive // ignore: cast_nullable_to_non_nullable
                      as bool?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SubtopicItemImplCopyWith<$Res>
    implements $SubtopicItemCopyWith<$Res> {
  factory _$$SubtopicItemImplCopyWith(
    _$SubtopicItemImpl value,
    $Res Function(_$SubtopicItemImpl) then,
  ) = __$$SubtopicItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String code, String displayName, int? sortOrder, bool? isActive});
}

/// @nodoc
class __$$SubtopicItemImplCopyWithImpl<$Res>
    extends _$SubtopicItemCopyWithImpl<$Res, _$SubtopicItemImpl>
    implements _$$SubtopicItemImplCopyWith<$Res> {
  __$$SubtopicItemImplCopyWithImpl(
    _$SubtopicItemImpl _value,
    $Res Function(_$SubtopicItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SubtopicItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? code = null,
    Object? displayName = null,
    Object? sortOrder = freezed,
    Object? isActive = freezed,
  }) {
    return _then(
      _$SubtopicItemImpl(
        code: null == code
            ? _value.code
            : code // ignore: cast_nullable_to_non_nullable
                  as String,
        displayName: null == displayName
            ? _value.displayName
            : displayName // ignore: cast_nullable_to_non_nullable
                  as String,
        sortOrder: freezed == sortOrder
            ? _value.sortOrder
            : sortOrder // ignore: cast_nullable_to_non_nullable
                  as int?,
        isActive: freezed == isActive
            ? _value.isActive
            : isActive // ignore: cast_nullable_to_non_nullable
                  as bool?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SubtopicItemImpl implements _SubtopicItem {
  const _$SubtopicItemImpl({
    required this.code,
    required this.displayName,
    this.sortOrder,
    this.isActive,
  });

  factory _$SubtopicItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$SubtopicItemImplFromJson(json);

  @override
  final String code;
  @override
  final String displayName;
  @override
  final int? sortOrder;
  @override
  final bool? isActive;

  @override
  String toString() {
    return 'SubtopicItem(code: $code, displayName: $displayName, sortOrder: $sortOrder, isActive: $isActive)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SubtopicItemImpl &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, code, displayName, sortOrder, isActive);

  /// Create a copy of SubtopicItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SubtopicItemImplCopyWith<_$SubtopicItemImpl> get copyWith =>
      __$$SubtopicItemImplCopyWithImpl<_$SubtopicItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SubtopicItemImplToJson(this);
  }
}

abstract class _SubtopicItem implements SubtopicItem {
  const factory _SubtopicItem({
    required final String code,
    required final String displayName,
    final int? sortOrder,
    final bool? isActive,
  }) = _$SubtopicItemImpl;

  factory _SubtopicItem.fromJson(Map<String, dynamic> json) =
      _$SubtopicItemImpl.fromJson;

  @override
  String get code;
  @override
  String get displayName;
  @override
  int? get sortOrder;
  @override
  bool? get isActive;

  /// Create a copy of SubtopicItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SubtopicItemImplCopyWith<_$SubtopicItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TopicTree _$TopicTreeFromJson(Map<String, dynamic> json) {
  return _TopicTree.fromJson(json);
}

/// @nodoc
mixin _$TopicTree {
  String get topicUuid => throw _privateConstructorUsedError;
  String get code => throw _privateConstructorUsedError;
  String get displayName => throw _privateConstructorUsedError;
  int? get sortOrder => throw _privateConstructorUsedError;
  bool? get isActive => throw _privateConstructorUsedError;
  List<SubtopicItem> get subtopics => throw _privateConstructorUsedError;

  /// Serializes this TopicTree to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TopicTree
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TopicTreeCopyWith<TopicTree> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TopicTreeCopyWith<$Res> {
  factory $TopicTreeCopyWith(TopicTree value, $Res Function(TopicTree) then) =
      _$TopicTreeCopyWithImpl<$Res, TopicTree>;
  @useResult
  $Res call({
    String topicUuid,
    String code,
    String displayName,
    int? sortOrder,
    bool? isActive,
    List<SubtopicItem> subtopics,
  });
}

/// @nodoc
class _$TopicTreeCopyWithImpl<$Res, $Val extends TopicTree>
    implements $TopicTreeCopyWith<$Res> {
  _$TopicTreeCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TopicTree
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicUuid = null,
    Object? code = null,
    Object? displayName = null,
    Object? sortOrder = freezed,
    Object? isActive = freezed,
    Object? subtopics = null,
  }) {
    return _then(
      _value.copyWith(
            topicUuid: null == topicUuid
                ? _value.topicUuid
                : topicUuid // ignore: cast_nullable_to_non_nullable
                      as String,
            code: null == code
                ? _value.code
                : code // ignore: cast_nullable_to_non_nullable
                      as String,
            displayName: null == displayName
                ? _value.displayName
                : displayName // ignore: cast_nullable_to_non_nullable
                      as String,
            sortOrder: freezed == sortOrder
                ? _value.sortOrder
                : sortOrder // ignore: cast_nullable_to_non_nullable
                      as int?,
            isActive: freezed == isActive
                ? _value.isActive
                : isActive // ignore: cast_nullable_to_non_nullable
                      as bool?,
            subtopics: null == subtopics
                ? _value.subtopics
                : subtopics // ignore: cast_nullable_to_non_nullable
                      as List<SubtopicItem>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$TopicTreeImplCopyWith<$Res>
    implements $TopicTreeCopyWith<$Res> {
  factory _$$TopicTreeImplCopyWith(
    _$TopicTreeImpl value,
    $Res Function(_$TopicTreeImpl) then,
  ) = __$$TopicTreeImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String topicUuid,
    String code,
    String displayName,
    int? sortOrder,
    bool? isActive,
    List<SubtopicItem> subtopics,
  });
}

/// @nodoc
class __$$TopicTreeImplCopyWithImpl<$Res>
    extends _$TopicTreeCopyWithImpl<$Res, _$TopicTreeImpl>
    implements _$$TopicTreeImplCopyWith<$Res> {
  __$$TopicTreeImplCopyWithImpl(
    _$TopicTreeImpl _value,
    $Res Function(_$TopicTreeImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of TopicTree
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? topicUuid = null,
    Object? code = null,
    Object? displayName = null,
    Object? sortOrder = freezed,
    Object? isActive = freezed,
    Object? subtopics = null,
  }) {
    return _then(
      _$TopicTreeImpl(
        topicUuid: null == topicUuid
            ? _value.topicUuid
            : topicUuid // ignore: cast_nullable_to_non_nullable
                  as String,
        code: null == code
            ? _value.code
            : code // ignore: cast_nullable_to_non_nullable
                  as String,
        displayName: null == displayName
            ? _value.displayName
            : displayName // ignore: cast_nullable_to_non_nullable
                  as String,
        sortOrder: freezed == sortOrder
            ? _value.sortOrder
            : sortOrder // ignore: cast_nullable_to_non_nullable
                  as int?,
        isActive: freezed == isActive
            ? _value.isActive
            : isActive // ignore: cast_nullable_to_non_nullable
                  as bool?,
        subtopics: null == subtopics
            ? _value._subtopics
            : subtopics // ignore: cast_nullable_to_non_nullable
                  as List<SubtopicItem>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TopicTreeImpl implements _TopicTree {
  const _$TopicTreeImpl({
    required this.topicUuid,
    required this.code,
    required this.displayName,
    this.sortOrder,
    this.isActive,
    final List<SubtopicItem> subtopics = const [],
  }) : _subtopics = subtopics;

  factory _$TopicTreeImpl.fromJson(Map<String, dynamic> json) =>
      _$$TopicTreeImplFromJson(json);

  @override
  final String topicUuid;
  @override
  final String code;
  @override
  final String displayName;
  @override
  final int? sortOrder;
  @override
  final bool? isActive;
  final List<SubtopicItem> _subtopics;
  @override
  @JsonKey()
  List<SubtopicItem> get subtopics {
    if (_subtopics is EqualUnmodifiableListView) return _subtopics;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_subtopics);
  }

  @override
  String toString() {
    return 'TopicTree(topicUuid: $topicUuid, code: $code, displayName: $displayName, sortOrder: $sortOrder, isActive: $isActive, subtopics: $subtopics)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TopicTreeImpl &&
            (identical(other.topicUuid, topicUuid) ||
                other.topicUuid == topicUuid) &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            const DeepCollectionEquality().equals(
              other._subtopics,
              _subtopics,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    topicUuid,
    code,
    displayName,
    sortOrder,
    isActive,
    const DeepCollectionEquality().hash(_subtopics),
  );

  /// Create a copy of TopicTree
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TopicTreeImplCopyWith<_$TopicTreeImpl> get copyWith =>
      __$$TopicTreeImplCopyWithImpl<_$TopicTreeImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TopicTreeImplToJson(this);
  }
}

abstract class _TopicTree implements TopicTree {
  const factory _TopicTree({
    required final String topicUuid,
    required final String code,
    required final String displayName,
    final int? sortOrder,
    final bool? isActive,
    final List<SubtopicItem> subtopics,
  }) = _$TopicTreeImpl;

  factory _TopicTree.fromJson(Map<String, dynamic> json) =
      _$TopicTreeImpl.fromJson;

  @override
  String get topicUuid;
  @override
  String get code;
  @override
  String get displayName;
  @override
  int? get sortOrder;
  @override
  bool? get isActive;
  @override
  List<SubtopicItem> get subtopics;

  /// Create a copy of TopicTree
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TopicTreeImplCopyWith<_$TopicTreeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
