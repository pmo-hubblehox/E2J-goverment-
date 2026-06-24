package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "curricula")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Curriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    private Long programId;
    private String programName;
    private String academicYear;
    private String degree;
    private String major;
    private Integer duration;

    @Builder.Default
    private int version = 1;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.YET_TO_START;

    @Column(columnDefinition = "TEXT")
    private String curriculumJson;

    @Column(columnDefinition = "TEXT")
    private String rejectionRemarks;

    private String approvalType; // "ORIGINAL" or "AI_GENERATED"

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status {
        YET_TO_START, AI_PROCESSING, AI_COMPLETED,
        SENT_FOR_BOS_APPROVAL, REJECTED_BY_BOS, APPROVED_BY_BOS,
        SENT_FOR_VERIFIER_APPROVAL, REJECTED_BY_VERIFIER, APPROVED
    }
}
