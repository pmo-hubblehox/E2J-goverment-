package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.JobApplication;
import com.hubblehox.e2j.entity.OfferLetter;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class JobApplicationDto {

    @Data
    public static class ApplyRequest {
        private Long resumeId;
        private List<Map<String, String>> questionAnswers;
    }

    // ── Student: my applications ──────────────────────────────
    @Data
    public static class Response {
        private Long id;
        private Long jobId;
        private String jobRole;
        private String companyName;
        private String location;
        private String workMode;
        private String department;
        private String postingType;
        private String resumeUrl;
        private String resumeFileName;
        private String stage;
        private Integer currentRound;
        private LocalDateTime appliedAt;
        // interview details (shown to student when scheduled)
        private LocalDateTime interviewScheduledAt;
        private String interviewMode;
        private String interviewLink;
        private String interviewVenue;
        private Integer interviewDurationMinutes;
        private String interviewerNames;
        private String interviewInstructions;
        // feedback flag (true = interview evaluated & candidate cleared this round)
        private Boolean feedbackReceived;
        private Integer feedbackOverallRating;
        private Integer feedbackTechRating;
        private Integer feedbackCommRating;
        private Integer feedbackProblemRating;
        private Integer feedbackCultureRating;
        private String feedbackStrengths;
        private String feedbackConcerns;
        private String feedbackNotes;
        // rejection
        private String rejectionMessage; // only populated when showRejectionToCandidate=true
        // offer letter
        private OfferLetterDto offerLetter;

        public static Response from(JobApplication a, OfferLetter offer) {
            Response r = new Response();
            r.id = a.getId();
            if (a.getJobPosting() != null) {
                r.jobId = a.getJobPosting().getId();
                r.jobRole = a.getJobPosting().getJobRole();
                r.location = a.getJobPosting().getLocation();
                r.workMode = a.getJobPosting().getWorkMode();
                r.department = a.getJobPosting().getDepartment();
                r.postingType = a.getJobPosting().getPostingType() != null ? a.getJobPosting().getPostingType().name() : null;
                if (a.getJobPosting().getPartner() != null)
                    r.companyName = a.getJobPosting().getPartner().getRegisteredName();
            }
            r.resumeUrl = a.getResumeUrl();
            r.resumeFileName = a.getResumeFileName();
            r.stage = a.getStage() != null ? a.getStage().name() : null;
            r.currentRound = a.getCurrentRound();
            r.appliedAt = a.getAppliedAt();
            r.interviewScheduledAt = a.getInterviewScheduledAt();
            r.interviewMode = a.getInterviewMode();
            r.interviewLink = a.getInterviewLink();
            r.interviewVenue = a.getInterviewVenue();
            r.interviewDurationMinutes = a.getInterviewDurationMinutes();
            r.interviewerNames = a.getInterviewerNames();
            r.interviewInstructions = a.getInterviewInstructions();
            r.feedbackReceived = a.getFeedbackOverallRating() != null && a.getFeedbackOverallRating() > 0;
            if (Boolean.TRUE.equals(r.feedbackReceived)) {
                r.feedbackOverallRating = a.getFeedbackOverallRating();
                r.feedbackTechRating = a.getFeedbackTechRating();
                r.feedbackCommRating = a.getFeedbackCommRating();
                r.feedbackProblemRating = a.getFeedbackProblemRating();
                r.feedbackCultureRating = a.getFeedbackCultureRating();
                r.feedbackStrengths = a.getFeedbackStrengths();
                r.feedbackConcerns = a.getFeedbackConcerns();
                r.feedbackNotes = a.getFeedbackNotes();
            }
            if (Boolean.TRUE.equals(a.getShowRejectionToCandidate()))
                r.rejectionMessage = a.getRejectionReason();
            if (offer != null)
                r.offerLetter = OfferLetterDto.from(offer);
            return r;
        }
    }

    // ── Industry: applicant view ──────────────────────────────
    @Data
    public static class ApplicantResponse {
        private Long applicationId;
        private Long jobId;
        private String jobRole;
        private String department;
        private String postingType;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String studentPhone;
        private String resumeUrl;
        private String resumeFileName;
        private String stage;
        private Integer currentRound;
        private LocalDateTime appliedAt;
        private String questionAnswers;
        // interview
        private LocalDateTime interviewScheduledAt;
        private String interviewMode;
        private String interviewLink;
        private String interviewVenue;
        private Integer interviewDurationMinutes;
        private String interviewerNames;
        private String interviewInstructions;
        // feedback
        private Integer feedbackOverallRating;
        private Integer feedbackTechRating;
        private Integer feedbackCommRating;
        private Integer feedbackProblemRating;
        private Integer feedbackCultureRating;
        private String feedbackStrengths;
        private String feedbackConcerns;
        private String feedbackNotes;
        // rejection
        private String rejectionReason;
        private Boolean showRejectionToCandidate;
        // offer
        private OfferLetterDto offerLetter;

        public static ApplicantResponse from(JobApplication a, OfferLetter offer) {
            ApplicantResponse r = new ApplicantResponse();
            r.applicationId = a.getId();
            if (a.getJobPosting() != null) {
                r.jobId = a.getJobPosting().getId();
                r.jobRole = a.getJobPosting().getJobRole();
                r.department = a.getJobPosting().getDepartment();
                r.postingType = a.getJobPosting().getPostingType() != null ? a.getJobPosting().getPostingType().name() : null;
            }
            if (a.getStudent() != null) {
                r.studentId = a.getStudent().getId();
                r.studentEmail = a.getStudent().getUser() != null ? a.getStudent().getUser().getEmail() : null;
                r.studentPhone = a.getStudent().getPhone();
                r.studentName = r.studentEmail;
            }
            r.resumeUrl = a.getResumeUrl();
            r.resumeFileName = a.getResumeFileName();
            r.stage = a.getStage() != null ? a.getStage().name() : null;
            r.currentRound = a.getCurrentRound();
            r.appliedAt = a.getAppliedAt();
            r.questionAnswers = a.getQuestionAnswers();
            r.interviewScheduledAt = a.getInterviewScheduledAt();
            r.interviewMode = a.getInterviewMode();
            r.interviewLink = a.getInterviewLink();
            r.interviewVenue = a.getInterviewVenue();
            r.interviewDurationMinutes = a.getInterviewDurationMinutes();
            r.interviewerNames = a.getInterviewerNames();
            r.interviewInstructions = a.getInterviewInstructions();
            r.feedbackOverallRating = a.getFeedbackOverallRating();
            r.feedbackTechRating = a.getFeedbackTechRating();
            r.feedbackCommRating = a.getFeedbackCommRating();
            r.feedbackProblemRating = a.getFeedbackProblemRating();
            r.feedbackCultureRating = a.getFeedbackCultureRating();
            r.feedbackStrengths = a.getFeedbackStrengths();
            r.feedbackConcerns = a.getFeedbackConcerns();
            r.feedbackNotes = a.getFeedbackNotes();
            r.rejectionReason = a.getRejectionReason();
            r.showRejectionToCandidate = a.getShowRejectionToCandidate();
            if (offer != null)
                r.offerLetter = OfferLetterDto.from(offer);
            return r;
        }
    }

    // ── Offer Letter DTO ──────────────────────────────────────
    @Data
    public static class OfferLetterDto {
        private Long id;
        private String designation;
        private String department;
        private Long ctc;
        private Long fixedCtc;
        private Long variableCtc;
        private LocalDate joiningDate;
        private String workLocation;
        private String workMode;
        private String benefits;
        private String specialNote;
        private LocalDate offerExpiry;
        private String status;
        private LocalDateTime respondedAt;
        private LocalDateTime createdAt;

        public static OfferLetterDto from(OfferLetter o) {
            OfferLetterDto d = new OfferLetterDto();
            d.id = o.getId();
            d.designation = o.getDesignation();
            d.department = o.getDepartment();
            d.ctc = o.getCtc();
            d.fixedCtc = o.getFixedCtc();
            d.variableCtc = o.getVariableCtc();
            d.joiningDate = o.getJoiningDate();
            d.workLocation = o.getWorkLocation();
            d.workMode = o.getWorkMode();
            d.benefits = o.getBenefits();
            d.specialNote = o.getSpecialNote();
            d.offerExpiry = o.getOfferExpiry();
            d.status = o.getStatus() != null ? o.getStatus().name() : null;
            d.respondedAt = o.getRespondedAt();
            d.createdAt = o.getCreatedAt();
            return d;
        }
    }

    // ── Request bodies ────────────────────────────────────────
    @Data
    public static class ScheduleInterviewRequest {
        private String interviewMode;
        private String interviewLink;
        private String interviewVenue;
        private String scheduledAt;         // ISO datetime string
        private Integer durationMinutes;
        private String interviewerNames;
        private String instructions;
    }

    @Data
    public static class FeedbackRequest {
        private Integer overallRating;
        private Integer techRating;
        private Integer commRating;
        private Integer problemRating;
        private Integer cultureRating;
        private String strengths;
        private String concerns;
        private String notes;
    }

    @Data
    public static class RejectRequest {
        private String reason;
        private Boolean showToCandidate;
    }

    @Data
    public static class OfferLetterRequest {
        private String designation;
        private String department;
        private Long ctc;
        private Long fixedCtc;
        private Long variableCtc;
        private String joiningDate;         // ISO date string
        private String workLocation;
        private String workMode;
        private String benefits;
        private String specialNote;
        private String offerExpiry;         // ISO date string
    }
}
