package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private String targetRole;
    private String experienceLevel;

    @Column(columnDefinition = "TEXT")
    private String skills; // JSON array

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationMinutes;

    private Integer overallScore; // 0-100
    private String readinessBand; // BEGINNER, DEVELOPING, READY, STRONG

    @Column(columnDefinition = "TEXT")
    private String reportSummary;

    @Column(columnDefinition = "TEXT")
    private String strengths; // JSON array

    @Column(columnDefinition = "TEXT")
    private String improvements; // JSON array

    @Builder.Default
    private Integer violationCount = 0; // tab switches / fullscreen exits detected

    private String language; // e.g. "English", "Hindi", "Tamil"

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewTopicScore> topicScores = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); startedAt = LocalDateTime.now(); }

    public enum SessionStatus { IN_PROGRESS, COMPLETED, ABANDONED }
}
