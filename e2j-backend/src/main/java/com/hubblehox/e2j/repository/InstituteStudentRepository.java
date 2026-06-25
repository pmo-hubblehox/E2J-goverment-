package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.InstituteStudent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstituteStudentRepository extends JpaRepository<InstituteStudent, Long> {
    Page<InstituteStudent> findByInstitute(Institute institute, Pageable pageable);
    long countByInstitute(Institute institute);
    java.util.List<InstituteStudent> findByEmailIgnoreCase(String email);
}
