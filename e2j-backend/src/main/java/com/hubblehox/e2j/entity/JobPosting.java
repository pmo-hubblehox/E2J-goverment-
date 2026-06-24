package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_postings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private IndustryPartner partner;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PostingType postingType = PostingType.JOB;

    private String jobId;

    // Core fields
    private String jobRole;
    private String department;
    private String employmentType;   // JOB only
    private String workMode;
    private String location;
    private Integer positions;
    private LocalDate targetDate;
    private String attachJd;

    // Walk-in Details (JOB)
    private LocalDate walkInStartDate;
    private String walkInDuration;
    private String walkInFrom;
    private String walkInTo;
    private String recruiterName;
    private String recruiterContact;
    private String venueAddress;
    private String venueMapsLink;

    // Internship only
    private String internshipDuration;
    private Boolean hasStipend;
    private String stipendAmount;

    // Complex fields stored as JSON strings
    @Column(columnDefinition = "TEXT")
    private String assessmentMappings; // JSON array of strings e.g. ["Psychometric","Physical Test"]

    @Column(columnDefinition = "TEXT")
    private String resumeWeightage;   // JSON array of {parameter,categories,weightage}

    @Column(columnDefinition = "TEXT")
    private String recruitmentSequence; // JSON array of ordered step names

    // Custom screening questions set by the industry partner
    @ElementCollection
    @CollectionTable(name = "job_posting_questions", joinColumns = @JoinColumn(name = "posting_id"))
    @Column(name = "question", columnDefinition = "TEXT")
    @OrderColumn(name = "question_order")
    @Builder.Default
    private List<String> customQuestions = new ArrayList<>();

    // Interview rounds
    @ElementCollection
    @CollectionTable(name = "job_posting_interview_rounds", joinColumns = @JoinColumn(name = "posting_id"))
    @OrderColumn(name = "round_order")
    @Builder.Default
    private List<InterviewRound> interviewRounds = new ArrayList<>();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class InterviewRound {
        private String roundName;
        private String mode;
        private String type;
    }

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        jobId = "JID" + String.format("%08d", (System.currentTimeMillis() % 100_000_000));
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum PostingType { JOB, INTERNSHIP }
    public enum Status { DRAFT, PUBLISHED, UNPUBLISHED }
}
