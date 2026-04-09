package com.passql.member.repository;

import com.passql.member.entity.MemberSuspendHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MemberSuspendHistoryRepository extends JpaRepository<MemberSuspendHistory, UUID> {

    List<MemberSuspendHistory> findAllByMemberUuidOrderByActedAtDesc(UUID memberUuid);
}
