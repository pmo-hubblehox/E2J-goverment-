package com.hubblehox.e2j.repository;

import com.hubblehox.e2j.entity.JobApplication;
import com.hubblehox.e2j.entity.JobPosting;
import com.hubblehox.e2j.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findByStudentOrderByAppliedAtDesc(Student student);
    List<JobApplication> findByJobPostingOrderByAppliedAtDesc(JobPosting jobPosting);
    Optional<JobApplication> findByStudentAndJobPosting(Student student, JobPosting jobPosting);
    boolean existsByStudentAndJobPosting(Student student, JobPosting jobPosting);
    long countByJobPosting(JobPosting jobPosting);
}
