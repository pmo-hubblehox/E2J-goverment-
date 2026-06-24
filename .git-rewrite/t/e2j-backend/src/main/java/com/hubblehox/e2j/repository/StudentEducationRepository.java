package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentEducation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentEducationRepository extends JpaRepository<StudentEducation, Long> {
    List<StudentEducation> findByStudentOrderByCreatedAtAsc(Student student);
}
