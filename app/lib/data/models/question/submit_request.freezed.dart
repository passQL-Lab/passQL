// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'submit_request.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SubmitRequest _$SubmitRequestFromJson(Map<String, dynamic> json) {
  return _SubmitRequest.fromJson(json);
}

/// @nodoc
mixin _$SubmitRequest {
  String get choiceSetId => throw _privateConstructorUsedError;
  String get selectedChoiceKey => throw _privateConstructorUsedError;

  /// Serializes this SubmitRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SubmitRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SubmitRequestCopyWith<SubmitRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SubmitRequestCopyWith<$Res> {
  factory $SubmitRequestCopyWith(
    SubmitRequest value,
    $Res Function(SubmitRequest) then,
  ) = _$SubmitRequestCopyWithImpl<$Res, SubmitRequest>;
  @useResult
  $Res call({String choiceSetId, String selectedChoiceKey});
}

/// @nodoc
class _$SubmitRequestCopyWithImpl<$Res, $Val extends SubmitRequest>
    implements $SubmitRequestCopyWith<$Res> {
  _$SubmitRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SubmitRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? choiceSetId = null, Object? selectedChoiceKey = null}) {
    return _then(
      _value.copyWith(
            choiceSetId: null == choiceSetId
                ? _value.choiceSetId
                : choiceSetId // ignore: cast_nullable_to_non_nullable
                      as String,
            selectedChoiceKey: null == selectedChoiceKey
                ? _value.selectedChoiceKey
                : selectedChoiceKey // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SubmitRequestImplCopyWith<$Res>
    implements $SubmitRequestCopyWith<$Res> {
  factory _$$SubmitRequestImplCopyWith(
    _$SubmitRequestImpl value,
    $Res Function(_$SubmitRequestImpl) then,
  ) = __$$SubmitRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String choiceSetId, String selectedChoiceKey});
}

/// @nodoc
class __$$SubmitRequestImplCopyWithImpl<$Res>
    extends _$SubmitRequestCopyWithImpl<$Res, _$SubmitRequestImpl>
    implements _$$SubmitRequestImplCopyWith<$Res> {
  __$$SubmitRequestImplCopyWithImpl(
    _$SubmitRequestImpl _value,
    $Res Function(_$SubmitRequestImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SubmitRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? choiceSetId = null, Object? selectedChoiceKey = null}) {
    return _then(
      _$SubmitRequestImpl(
        choiceSetId: null == choiceSetId
            ? _value.choiceSetId
            : choiceSetId // ignore: cast_nullable_to_non_nullable
                  as String,
        selectedChoiceKey: null == selectedChoiceKey
            ? _value.selectedChoiceKey
            : selectedChoiceKey // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SubmitRequestImpl implements _SubmitRequest {
  const _$SubmitRequestImpl({
    required this.choiceSetId,
    required this.selectedChoiceKey,
  });

  factory _$SubmitRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$SubmitRequestImplFromJson(json);

  @override
  final String choiceSetId;
  @override
  final String selectedChoiceKey;

  @override
  String toString() {
    return 'SubmitRequest(choiceSetId: $choiceSetId, selectedChoiceKey: $selectedChoiceKey)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SubmitRequestImpl &&
            (identical(other.choiceSetId, choiceSetId) ||
                other.choiceSetId == choiceSetId) &&
            (identical(other.selectedChoiceKey, selectedChoiceKey) ||
                other.selectedChoiceKey == selectedChoiceKey));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, choiceSetId, selectedChoiceKey);

  /// Create a copy of SubmitRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SubmitRequestImplCopyWith<_$SubmitRequestImpl> get copyWith =>
      __$$SubmitRequestImplCopyWithImpl<_$SubmitRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SubmitRequestImplToJson(this);
  }
}

abstract class _SubmitRequest implements SubmitRequest {
  const factory _SubmitRequest({
    required final String choiceSetId,
    required final String selectedChoiceKey,
  }) = _$SubmitRequestImpl;

  factory _SubmitRequest.fromJson(Map<String, dynamic> json) =
      _$SubmitRequestImpl.fromJson;

  @override
  String get choiceSetId;
  @override
  String get selectedChoiceKey;

  /// Create a copy of SubmitRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SubmitRequestImplCopyWith<_$SubmitRequestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
