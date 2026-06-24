package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.Program;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    Page<Program> findByInstitute(Institute institute, Pageable pageable);
    java.util.Optional<Program> findByIdAndInstitute(Long id, Institute institute);
}
