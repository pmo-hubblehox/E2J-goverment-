package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"workshop_id", "student_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkshopEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workshop_id", nullable = false)
    private WorkshopPosting workshop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolled_by_institute_id")
    private Institute enrolledByInstitute;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.CONFIRMED;

    private Integer waitlistPosition;

    @Column(columnDefinition = "TEXT")
    private String formAnswer;

    private Double feeAmount;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { CONFIRMED, WAITLISTED, CANCELLED }
}
