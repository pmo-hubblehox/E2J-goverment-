package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.JobPosting;
import com.hubblehox.e2j.entity.IndustryPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByPartnerOrderByCreatedAtDesc(IndustryPartner partner);
    List<JobPosting> findByPartnerAndPostingTypeOrderByCreatedAtDesc(IndustryPartner partner, JobPosting.PostingType type);
    Optional<JobPosting> findByIdAndPartner(Long id, IndustryPartner partner);
    long countByPartner(IndustryPartner partner);
    long countByPartnerAndStatus(IndustryPartner partner, JobPosting.Status status);
    long countByPartnerAndPostingType(IndustryPartner partner, JobPosting.PostingType type);
    // Student-facing: published jobs
    List<JobPosting> findByStatusOrderByCreatedAtDesc(JobPosting.Status status);
    Optional<JobPosting> findByIdAndStatus(Long id, JobPosting.Status status);
}
