package com.hubblehox.e2j.dto;

import com.hubblehox.e2j.entity.JobPosting;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class JobPostingDto {

    @Data
    public static class Request {
        private String postingType;       // JOB | INTERNSHIP
        private String jobRole;
        private String department;
        private String employmentType;
        private String workMode;
        private String location;
        private Integer positions;
        private LocalDate targetDate;
        private String attachJd;

        // Walk-in (JOB)
        private LocalDate walkInStartDate;
        private String walkInDuration;
        private String walkInFrom;
        private String walkInTo;
        private String recruiterName;
        private String recruiterContact;
        private String venueAddress;
        private String venueMapsLink;

        // Internship
        private String internshipDuration;
        private Boolean hasStipend;
        private String stipendAmount;

        // JSON strings
        private String assessmentMappings;
        private String resumeWeightage;
        private String recruitmentSequence;

        private List<InterviewRoundRequest> interviewRounds;
        private List<String> customQuestions;

        private String status; // DRAFT | PUBLISHED | UNPUBLISHED
    }

    @Data
    public static class InterviewRoundRequest {
        private String roundName;
        private String mode;
        private String type;
    }

    @Data
    public static class Response {
        private Long id;
        private String jobId;
        private String postingType;
        private String jobRole;
        private String department;
        private String employmentType;
        private String workMode;
        private String location;
        private Integer positions;
        private LocalDate targetDate;
        private String attachJd;

        private LocalDate walkInStartDate;
        private String walkInDuration;
        private String walkInFrom;
        private String walkInTo;
        private String recruiterName;
        private String recruiterContact;
        private String venueAddress;
        private String venueMapsLink;

        private String internshipDuration;
        private Boolean hasStipend;
        private String stipendAmount;

        private String assessmentMappings;
        private String resumeWeightage;
        private String recruitmentSequence;

        private List<InterviewRoundResponse> interviewRounds;
        private List<String> customQuestions;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        // company name for student view
        private String companyName;

        public static Response from(JobPosting p) {
            Response r = new Response();
            r.id = p.getId();
            r.jobId = p.getJobId();
            r.postingType = p.getPostingType() != null ? p.getPostingType().name() : null;
            r.jobRole = p.getJobRole();
            r.department = p.getDepartment();
            r.employmentType = p.getEmploymentType();
            r.workMode = p.getWorkMode();
            r.location = p.getLocation();
            r.positions = p.getPositions();
            r.targetDate = p.getTargetDate();
            r.attachJd = p.getAttachJd();
            r.walkInStartDate = p.getWalkInStartDate();
            r.walkInDuration = p.getWalkInDuration();
            r.walkInFrom = p.getWalkInFrom();
            r.walkInTo = p.getWalkInTo();
            r.recruiterName = p.getRecruiterName();
            r.recruiterContact = p.getRecruiterContact();
            r.venueAddress = p.getVenueAddress();
            r.venueMapsLink = p.getVenueMapsLink();
            r.internshipDuration = p.getInternshipDuration();
            r.hasStipend = p.getHasStipend();
            r.stipendAmount = p.getStipendAmount();
            r.assessmentMappings = p.getAssessmentMappings();
            r.resumeWeightage = p.getResumeWeightage();
            r.recruitmentSequence = p.getRecruitmentSequence();
            r.status = p.getStatus() != null ? p.getStatus().name() : null;
            r.createdAt = p.getCreatedAt();
            r.updatedAt = p.getUpdatedAt();
            r.customQuestions = p.getCustomQuestions();
            if (p.getPartner() != null) r.companyName = p.getPartner().getRegisteredName();
            if (p.getInterviewRounds() != null) {
                r.interviewRounds = p.getInterviewRounds().stream().map(ir -> {
                    InterviewRoundResponse irr = new InterviewRoundResponse();
                    irr.roundName = ir.getRoundName();
                    irr.mode = ir.getMode();
                    irr.type = ir.getType();
                    return irr;
                }).toList();
            }
            return r;
        }
    }

    @Data
    public static class InterviewRoundResponse {
        private String roundName;
        private String mode;
        private String type;
    }
}
