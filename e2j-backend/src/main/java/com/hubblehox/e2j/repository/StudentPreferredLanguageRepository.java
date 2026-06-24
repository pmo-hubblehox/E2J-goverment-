package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Student;
import com.hubblehox.e2j.entity.StudentPreferredLanguage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentPreferredLanguageRepository extends JpaRepository<StudentPreferredLanguage, Long> {
    List<StudentPreferredLanguage> findByStudent(Student student);
    void deleteByStudent(Student student);
}
