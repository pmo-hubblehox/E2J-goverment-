package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentAspiration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentAspirationRepository extends JpaRepository<StudentAspiration, Long> {
    List<StudentAspiration> findByStudentOrderByCreatedAtDesc(Student student);
    Optional<StudentAspiration> findByIdAndStudent(Long id, Student student);
}
