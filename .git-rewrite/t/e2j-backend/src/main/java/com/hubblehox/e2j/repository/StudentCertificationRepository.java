package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentCertification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentCertificationRepository extends JpaRepository<StudentCertification, Long> {
    List<StudentCertification> findByStudentOrderByCreatedAtAsc(Student student);
}
