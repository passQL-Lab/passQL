package com.passql.submission.repository;

import com.passql.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserUuidOrderBySubmittedAtDesc(String userUuid);
    long countByUserUuidAndIsCorrectTrue(String userUuid);
    long countByUserUuid(String userUuid);
}
