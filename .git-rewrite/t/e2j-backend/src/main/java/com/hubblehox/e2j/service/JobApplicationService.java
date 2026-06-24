package com.hubblehox.e2j.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hubblehox.e2j.dto.JobApplicationDto;
import com.hubblehox.e2j.entity.*;
import com.hubblehox.e2j.exception.AppException;
import com.hubblehox.e2j.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository appRepo;
    private final JobPostingRepository jobRepo;
    private final StudentRepository studentRepo;
    private final StudentResumeRepository resumeRepo;
    private final IndustryPartnerRepository partnerRepo;
    private final UserRepository userRepo;
    private final ObjectMapper objectMapper;

    private Student getStudent(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return studentRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Student profile not found", HttpStatus.NOT_FOUND));
    }

    private IndustryPartner getPartner(String email) {
        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));
        return partnerRepo.findByUser(user)
                .orElseThrow(() -> new AppException("Partner profile not found", HttpStatus.NOT_FOUND));
    }

    public JobApplicationDto.Response apply(String email, Long jobId, JobApplicationDto.ApplyRequest req) {
        Student student = getStudent(email);
        JobPosting job = jobRepo.findByIdAndStatus(jobId, JobPosting.Status.PUBLISHED)
                .orElseThrow(() -> new AppException("Job not found or not open", HttpStatus.NOT_FOUND));

        if (appRepo.existsByStudentAndJobPosting(student, job)) {
            throw new AppException("Already applied to this job", HttpStatus.CONFLICT);
        }

        String resumeUrl = null;
        String resumeFileName = null;
        if (req.getResumeId() != null) {
            var resume = resumeRepo.findById(req.getResumeId())
                    .orElseThrow(() -> new AppException("Resume not found", HttpStatus.NOT_FOUND));
            resumeUrl = resume.getFileUrl();
            resumeFileName = resume.getFileName();
        }

        String qaJson = null;
        if (req.getQuestionAnswers() != null && !req.getQuestionAnswers().isEmpty()) {
            try { qaJson = objectMapper.writeValueAsString(req.getQuestionAnswers()); }
            catch (JsonProcessingException ignored) {}
        }

        JobApplication app = JobApplication.builder()
                .student(student)
                .jobPosting(job)
                .resumeUrl(resumeUrl)
                .resumeFileName(resumeFileName)
                .questionAnswers(qaJson)
                .stage(JobApplication.Stage.APPLIED)
                .build();

        return JobApplicationDto.Response.from(appRepo.save(app));
    }

    public List<JobApplicationDto.Response> myApplications(String email) {
        Student student = getStudent(email);
        return appRepo.findByStudentOrderByAppliedAtDesc(student)
                .stream().map(JobApplicationDto.Response::from).toList();
    }

    public boolean hasApplied(String email, Long jobId) {
        try {
            Student student = getStudent(email);
            JobPosting job = jobRepo.findById(jobId).orElse(null);
            if (job == null) return false;
            return appRepo.existsByStudentAndJobPosting(student, job);
        } catch (Exception e) { return false; }
    }

    // Industry partner: list applicants for their job
    public List<JobApplicationDto.ApplicantResponse> listApplicants(String email, Long jobId) {
        IndustryPartner partner = getPartner(email);
        JobPosting job = jobRepo.findByIdAndPartner(jobId, partner)
                .orElseThrow(() -> new AppException("Job not found", HttpStatus.NOT_FOUND));
        return appRepo.findByJobPostingOrderByAppliedAtDesc(job)
                .stream().map(JobApplicationDto.ApplicantResponse::from).toList();
    }

    // Industry partner: list all applicants across all their jobs
    public List<JobApplicationDto.ApplicantResponse> listAllApplicants(String email) {
        IndustryPartner partner = getPartner(email);
        var jobs = jobRepo.findByPartnerOrderByCreatedAtDesc(partner);
        return jobs.stream()
                .flatMap(job -> appRepo.findByJobPostingOrderByAppliedAtDesc(job).stream())
                .map(JobApplicationDto.ApplicantResponse::from)
                .toList();
    }

    // Industry partner: update applicant stage
    public JobApplicationDto.ApplicantResponse updateStage(String email, Long applicationId, String stage) {
        IndustryPartner partner = getPartner(email);
        JobApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new AppException("Application not found", HttpStatus.NOT_FOUND));
        // Verify the job belongs to this partner
        jobRepo.findByIdAndPartner(app.getJobPosting().getId(), partner)
                .orElseThrow(() -> new AppException("Unauthorized", HttpStatus.FORBIDDEN));
        app.setStage(JobApplication.Stage.valueOf(stage.toUpperCase()));
        return JobApplicationDto.ApplicantResponse.from(appRepo.save(app));
    }
}
