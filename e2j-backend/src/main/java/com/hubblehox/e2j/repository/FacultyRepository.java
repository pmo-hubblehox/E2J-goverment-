package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Faculty;
import com.hubblehox.e2j.entity.Institute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Page<Faculty> findByInstitute(Institute institute, Pageable pageable);
}
