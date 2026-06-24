package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentWorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentWorkExperienceRepository extends JpaRepository<StudentWorkExperience, Long> {
    List<StudentWorkExperience> findByStudentOrderByCreatedAtAsc(Student student);
}
