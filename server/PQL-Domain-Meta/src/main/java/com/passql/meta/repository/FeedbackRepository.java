package com.passql.meta.repository;

import com.passql.meta.constant.FeedbackStatus;
import com.passql.meta.entity.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByMemberUuidOrderByCreatedAtDesc(UUID memberUuid);

    Page<Feedback> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT f.status, COUNT(f) FROM Feedback f GROUP BY f.status")
    List<Object[]> countGroupByStatus();
}
