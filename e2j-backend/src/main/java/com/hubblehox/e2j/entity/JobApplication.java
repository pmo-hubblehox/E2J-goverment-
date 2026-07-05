package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "job_posting_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    private String resumeUrl;
    private String resumeFileName;

    @Column(columnDefinition = "TEXT")
    private String profileSnapshot;

    @Column(columnDefinition = "TEXT")
    private String questionAnswers;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Stage stage = Stage.APPLIED;

    // ── Interview scheduling ──────────────────────────────────
    private LocalDateTime interviewScheduledAt;
    private String interviewMode;           // Online / Offline
    private String interviewLink;
    private String interviewVenue;
    private Integer interviewDurationMinutes;
    private String interviewerNames;
    @Column(columnDefinition = "TEXT")
    private String interviewInstructions;
    @Builder.Default
    private Integer currentRound = 0;       // increments each time interview is scheduled

    // ── Interview feedback ────────────────────────────────────
    private Integer feedbackOverallRating;
    private Integer feedbackTechRating;
    private Integer feedbackCommRating;
    private Integer feedbackProblemRating;
    private Integer feedbackCultureRating;
    @Column(columnDefinition = "TEXT")
    private String feedbackStrengths;
    @Column(columnDefinition = "TEXT")
    private String feedbackConcerns;
    @Column(columnDefinition = "TEXT")
    private String feedbackNotes;

    // ── Rejection ─────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
    @Builder.Default
    private Boolean showRejectionToCandidate = false;

    @Column(updatable = false)
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Stage {
        APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, OFFERED, REJECTED
    }
}
