package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.InstituteLab;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstituteLabRepository extends JpaRepository<InstituteLab, Long> {
    List<InstituteLab> findByInstitute(Institute institute);
    Optional<InstituteLab> findByIdAndInstitute(Long id, Institute institute);
}
