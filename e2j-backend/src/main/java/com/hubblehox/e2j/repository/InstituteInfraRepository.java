package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.InstituteInfra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InstituteInfraRepository extends JpaRepository<InstituteInfra, Long> {
    Optional<InstituteInfra> findByInstitute(Institute institute);
}
