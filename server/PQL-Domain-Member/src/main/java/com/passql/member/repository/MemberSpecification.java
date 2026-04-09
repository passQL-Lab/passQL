package com.passql.member.repository;

import com.passql.member.constant.MemberRole;
import com.passql.member.constant.MemberStatus;
import com.passql.member.entity.Member;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class MemberSpecification {

    public static Specification<Member> notDeleted() {
        return (root, query, cb) -> cb.equal(root.get("isDeleted"), false);
    }

    public static Specification<Member> nicknameContains(String nickname) {
        return (root, query, cb) ->
            nickname == null || nickname.isBlank()
                ? cb.conjunction()
                : cb.like(cb.lower(root.get("nickname")), "%" + nickname.toLowerCase() + "%");
    }

    public static Specification<Member> statusEquals(MemberStatus status) {
        return (root, query, cb) ->
            status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Member> roleEquals(MemberRole role) {
        return (root, query, cb) ->
            role == null ? cb.conjunction() : cb.equal(root.get("role"), role);
    }

    public static Specification<Member> joinedAfter(LocalDate from) {
        return (root, query, cb) ->
            from == null ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<Member> joinedBefore(LocalDate to) {
        return (root, query, cb) ->
            to == null ? cb.conjunction()
                : cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay());
    }

    public static Specification<Member> lastSeenAfter(LocalDate from) {
        return (root, query, cb) ->
            from == null ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("lastSeenAt"), from.atStartOfDay());
    }

    public static Specification<Member> lastSeenBefore(LocalDate to) {
        return (root, query, cb) ->
            to == null ? cb.conjunction()
                : cb.lessThan(root.get("lastSeenAt"), to.plusDays(1).atStartOfDay());
    }

    public static Specification<Member> excludeTest() {
        return (root, query, cb) -> cb.equal(root.get("isTestAccount"), false);
    }
}
