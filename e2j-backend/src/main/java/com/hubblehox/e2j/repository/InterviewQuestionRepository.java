package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.InterviewQuestion;
import com.hubblehox.e2j.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findBySessionOrderBySequenceNumber(InterviewSession session);
    int countBySession(InterviewSession session);
}
