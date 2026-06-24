package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StudentResumeRepository extends JpaRepository<StudentResume, Long> {
    List<StudentResume> findByStudentOrderByUploadedAtDesc(Student student);

    @Modifying
    @Query("UPDATE StudentResume r SET r.isPrimary = false WHERE r.student = :student")
    void clearPrimary(Student student);
}
