package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.CampusRecruitment;
import com.hubblehox.e2j.entity.Institute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampusRecruitmentRepository extends JpaRepository<CampusRecruitment, Long> {
    Page<CampusRecruitment> findByInstitute(Institute institute, Pageable pageable);
    Page<CampusRecruitment> findByInstituteAndStatus(Institute institute, CampusRecruitment.Status status, Pageable pageable);
}
