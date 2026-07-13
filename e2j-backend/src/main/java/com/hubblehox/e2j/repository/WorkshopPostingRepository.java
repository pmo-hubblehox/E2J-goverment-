package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.IndustryPartner;
import com.hubblehox.e2j.entity.Institute;
import com.hubblehox.e2j.entity.WorkshopPosting;
import com.hubblehox.e2j.entity.WorkshopTrainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkshopPostingRepository extends JpaRepository<WorkshopPosting, Long> {
    List<WorkshopPosting> findByIndustryPartnerOrderByCreatedAtDesc(IndustryPartner industryPartner);
    List<WorkshopPosting> findByInstituteOrderByCreatedAtDesc(Institute institute);
    List<WorkshopPosting> findByStatusOrderByCreatedAtDesc(WorkshopPosting.Status status);
    List<WorkshopPosting> findByTrainerOrderByCreatedAtDesc(WorkshopTrainer trainer);
}
