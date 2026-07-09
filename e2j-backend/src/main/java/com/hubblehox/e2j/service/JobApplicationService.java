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

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final OfferLetterRepository offerRepo;
    private final ObjectMapper objectMapper;
    private final OfferLetterPdfService offerLetterPdfService;

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

    private JobApplication getAppForPartner(String email, Long applicationId) {
        IndustryPartner partner = getPartner(email);
        JobApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new AppException("Application not found", HttpStatus.NOT_FOUND));
        jobRepo.findByIdAndPartner(app.getJobPosting().getId(), partner)
                .orElseThrow(() -> new AppException("Unauthorized", HttpStatus.FORBIDDEN));
        return app;
    }

    // ── Student: apply ────────────────────────────────────────
    public JobApplicationDto.Response apply(String email, Long jobId, JobApplicationDto.ApplyRequest req) {
        Student student = getStudent(email);
        JobPosting job = jobRepo.findByIdAndStatus(jobId, JobPosting.Status.PUBLISHED)
                .orElseThrow(() -> new AppException("Job not found or not open", HttpStatus.NOT_FOUND));
        if (appRepo.existsByStudentAndJobPosting(student, job))
            throw new AppException("Already applied to this job", HttpStatus.CONFLICT);

        String resumeUrl = null, resumeFileName = null;
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
                .student(student).jobPosting(job)
                .resumeUrl(resumeUrl).resumeFileName(resumeFileName)
                .questionAnswers(qaJson).stage(JobApplication.Stage.APPLIED)
                .build();
        return JobApplicationDto.Response.from(appRepo.save(app), null);
    }

    // ── Student: my applications ──────────────────────────────
    public List<JobApplicationDto.Response> myApplications(String email) {
        Student student = getStudent(email);
        return appRepo.findByStudentOrderByAppliedAtDesc(student).stream()
                .map(a -> {
                    OfferLetter offer = offerRepo.findByJobApplication(a).orElse(null);
                    return JobApplicationDto.Response.from(a, offer);
                }).toList();
    }

    public boolean hasApplied(String email, Long jobId) {
        try {
            Student student = getStudent(email);
            JobPosting job = jobRepo.findById(jobId).orElse(null);
            return job != null && appRepo.existsByStudentAndJobPosting(student, job);
        } catch (Exception e) { return false; }
    }

    // ── Student: respond to offer ─────────────────────────────
    public JobApplicationDto.OfferLetterDto respondToOffer(String email, Long applicationId, String response) {
        Student student = getStudent(email);
        JobApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new AppException("Application not found", HttpStatus.NOT_FOUND));
        if (!app.getStudent().getId().equals(student.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        OfferLetter offer = offerRepo.findByJobApplication(app)
                .orElseThrow(() -> new AppException("Offer not found", HttpStatus.NOT_FOUND));
        offer.setStatus("ACCEPTED".equalsIgnoreCase(response) ? OfferLetter.Status.ACCEPTED : OfferLetter.Status.DECLINED);
        offer.setRespondedAt(LocalDateTime.now());
        return JobApplicationDto.OfferLetterDto.from(offerRepo.save(offer));
    }

    // ── Student: download offer letter PDF ────────────────────
    public byte[] downloadOfferLetterPdf(String email, Long applicationId) {
        Student student = getStudent(email);
        JobApplication app = appRepo.findById(applicationId)
                .orElseThrow(() -> new AppException("Application not found", HttpStatus.NOT_FOUND));
        if (!app.getStudent().getId().equals(student.getId()))
            throw new AppException("Unauthorized", HttpStatus.FORBIDDEN);
        OfferLetter offer = offerRepo.findByJobApplication(app)
                .orElseThrow(() -> new AppException("Offer not found", HttpStatus.NOT_FOUND));
        return offerLetterPdfService.generate(app, offer);
    }

    // ── Industry: list applicants ─────────────────────────────
    public List<JobApplicationDto.ApplicantResponse> listApplicants(String email, Long jobId) {
        IndustryPartner partner = getPartner(email);
        JobPosting job = jobRepo.findByIdAndPartner(jobId, partner)
                .orElseThrow(() -> new AppException("Job not found", HttpStatus.NOT_FOUND));
        return appRepo.findByJobPostingOrderByAppliedAtDesc(job).stream()
                .map(a -> JobApplicationDto.ApplicantResponse.from(a, offerRepo.findByJobApplication(a).orElse(null)))
                .toList();
    }

    public List<JobApplicationDto.ApplicantResponse> listAllApplicants(String email) {
        IndustryPartner partner = getPartner(email);
        return jobRepo.findByPartnerOrderByCreatedAtDesc(partner).stream()
                .flatMap(job -> appRepo.findByJobPostingOrderByAppliedAtDesc(job).stream())
                .map(a -> JobApplicationDto.ApplicantResponse.from(a, offerRepo.findByJobApplication(a).orElse(null)))
                .toList();
    }

    // ── Industry: get single applicant detail ─────────────────
    public JobApplicationDto.ApplicantResponse getApplicant(String email, Long applicationId) {
        JobApplication app = getAppForPartner(email, applicationId);
        return JobApplicationDto.ApplicantResponse.from(app, offerRepo.findByJobApplication(app).orElse(null));
    }

    // ── Industry: shortlist ───────────────────────────────────
    public JobApplicationDto.ApplicantResponse shortlist(String email, Long applicationId) {
        JobApplication app = getAppForPartner(email, applicationId);
        app.setStage(JobApplication.Stage.SHORTLISTED);
        return JobApplicationDto.ApplicantResponse.from(appRepo.save(app), null);
    }

    // ── Industry: schedule interview ──────────────────────────
    public JobApplicationDto.ApplicantResponse scheduleInterview(String email, Long applicationId,
                                                                  JobApplicationDto.ScheduleInterviewRequest req) {
        JobApplication app = getAppForPartner(email, applicationId);
        app.setInterviewScheduledAt(LocalDateTime.parse(req.getScheduledAt()));
        app.setInterviewMode(req.getInterviewMode());
        app.setInterviewLink(req.getInterviewLink());
        app.setInterviewVenue(req.getInterviewVenue());
        app.setInterviewDurationMinutes(req.getDurationMinutes());
        app.setInterviewerNames(req.getInterviewerNames());
        app.setInterviewInstructions(req.getInstructions());
        app.setCurrentRound(app.getCurrentRound() + 1);
        app.setStage(JobApplication.Stage.INTERVIEW_SCHEDULED);
        // clear previous round's feedback so the new round starts clean
        app.setFeedbackOverallRating(null);
        app.setFeedbackTechRating(null);
        app.setFeedbackCommRating(null);
        app.setFeedbackProblemRating(null);
        app.setFeedbackCultureRating(null);
        app.setFeedbackStrengths(null);
        app.setFeedbackConcerns(null);
        app.setFeedbackNotes(null);
        return JobApplicationDto.ApplicantResponse.from(appRepo.save(app),
                offerRepo.findByJobApplication(app).orElse(null));
    }

    // ── Industry: save feedback ───────────────────────────────
    public JobApplicationDto.ApplicantResponse saveFeedback(String email, Long applicationId,
                                                             JobApplicationDto.FeedbackRequest req) {
        JobApplication app = getAppForPartner(email, applicationId);
        app.setFeedbackOverallRating(req.getOverallRating());
        app.setFeedbackTechRating(req.getTechRating());
        app.setFeedbackCommRating(req.getCommRating());
        app.setFeedbackProblemRating(req.getProblemRating());
        app.setFeedbackCultureRating(req.getCultureRating());
        app.setFeedbackStrengths(req.getStrengths());
        app.setFeedbackConcerns(req.getConcerns());
        app.setFeedbackNotes(req.getNotes());
        return JobApplicationDto.ApplicantResponse.from(appRepo.save(app),
                offerRepo.findByJobApplication(app).orElse(null));
    }

    // ── Industry: reject ──────────────────────────────────────
    public JobApplicationDto.ApplicantResponse reject(String email, Long applicationId,
                                                       JobApplicationDto.RejectRequest req) {
        JobApplication app = getAppForPartner(email, applicationId);
        app.setStage(JobApplication.Stage.REJECTED);
        app.setRejectionReason(req.getReason());
        app.setShowRejectionToCandidate(Boolean.TRUE.equals(req.getShowToCandidate()));
        return JobApplicationDto.ApplicantResponse.from(appRepo.save(app), null);
    }

    // ── Industry: generate offer letter ──────────────────────
    public JobApplicationDto.OfferLetterDto generateOfferLetter(String email, Long applicationId,
                                                                  JobApplicationDto.OfferLetterRequest req) {
        JobApplication app = getAppForPartner(email, applicationId);
        OfferLetter offer = offerRepo.findByJobApplication(app).orElse(new OfferLetter());
        offer.setJobApplication(app);
        offer.setDesignation(req.getDesignation());
        offer.setDepartment(req.getDepartment());
        offer.setCtc(req.getCtc());
        offer.setFixedCtc(req.getFixedCtc());
        offer.setVariableCtc(req.getVariableCtc());
        offer.setJoiningDate(req.getJoiningDate() != null ? LocalDate.parse(req.getJoiningDate()) : null);
        offer.setWorkLocation(req.getWorkLocation());
        offer.setWorkMode(req.getWorkMode());
        offer.setBenefits(req.getBenefits());
        offer.setSpecialNote(req.getSpecialNote());
        offer.setOfferExpiry(req.getOfferExpiry() != null ? LocalDate.parse(req.getOfferExpiry()) : null);
        offer.setStatus(OfferLetter.Status.PENDING);
        app.setStage(JobApplication.Stage.OFFERED);
        appRepo.save(app);
        return JobApplicationDto.OfferLetterDto.from(offerRepo.save(offer));
    }

    // ── Industry: preview generated offer letter PDF ──────────
    public byte[] downloadOfferLetterPdfForPartner(String email, Long applicationId) {
        JobApplication app = getAppForPartner(email, applicationId);
        OfferLetter offer = offerRepo.findByJobApplication(app)
                .orElseThrow(() -> new AppException("Offer not found", HttpStatus.NOT_FOUND));
        return offerLetterPdfService.generate(app, offer);
    }
}
