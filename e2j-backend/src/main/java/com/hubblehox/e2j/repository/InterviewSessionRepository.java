package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.InterviewSession;
import com.hubblehox.e2j.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByStudentOrderByCreatedAtDesc(Student student);
    Optional<InterviewSession> findByIdAndStudent(Long id, Student student);
}
