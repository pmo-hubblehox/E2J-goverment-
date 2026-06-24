package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.JobApplication;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class JobApplicationDto {

    @Data
    public static class ApplyRequest {
        private Long resumeId;
        private List<Map<String, String>> questionAnswers; // [{question, answer}, ...]
    }

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
        private LocalDateTime appliedAt;

        public static Response from(JobApplication a) {
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
            r.appliedAt = a.getAppliedAt();
            return r;
        }
    }

    @Data
    public static class ApplicantResponse {
        private Long applicationId;
        private Long jobId;
        private String jobRole;
        private String department;
        private String postingType;
        // Student info
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String studentPhone;
        private String resumeUrl;
        private String resumeFileName;
        private String stage;
        private LocalDateTime appliedAt;
        private String questionAnswers; // raw JSON

        public static ApplicantResponse from(JobApplication a) {
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
                // Name from StudentProfile if available (lazy load may not be present — use email fallback)
                r.studentName = r.studentEmail;
            }
            r.resumeUrl = a.getResumeUrl();
            r.resumeFileName = a.getResumeFileName();
            r.stage = a.getStage() != null ? a.getStage().name() : null;
            r.appliedAt = a.getAppliedAt();
            r.questionAnswers = a.getQuestionAnswers();
            return r;
        }
    }
}
