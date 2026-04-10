package com.passql.question.repository;

import com.passql.question.constant.QuizSessionStatus;
import com.passql.question.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizSessionRepository extends JpaRepository<QuizSession, UUID> {

    List<QuizSession> findByStatus(QuizSessionStatus status);
}
