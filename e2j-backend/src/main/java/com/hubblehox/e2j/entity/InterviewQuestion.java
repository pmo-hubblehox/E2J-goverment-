package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    private Integer sequenceNumber;
    private String topicArea; // WARMUP, TECHNICAL, BEHAVIORAL, SITUATIONAL, ROLE_SPECIFIC

    @Column(columnDefinition = "TEXT")
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String studentAnswerTranscript;

    private Integer aiScore; // 1-10

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    @Builder.Default
    private Boolean isFollowUp = false;

    private LocalDateTime askedAt;
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() { askedAt = LocalDateTime.now(); }
}
