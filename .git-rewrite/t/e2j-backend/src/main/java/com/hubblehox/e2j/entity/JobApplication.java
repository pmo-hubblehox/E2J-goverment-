package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // Snapshot of student info at time of application
    @Column(columnDefinition = "TEXT")
    private String profileSnapshot; // JSON snapshot

    // Answers to custom questions: stored as JSON array of {question, answer}
    @Column(columnDefinition = "TEXT")
    private String questionAnswers;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Stage stage = Stage.APPLIED;

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
        APPLIED, SHORTLISTED, INTERVIEW_ROUND_1, INTERVIEW_ROUND_2, OFFERED, REJECTED
    }
}
