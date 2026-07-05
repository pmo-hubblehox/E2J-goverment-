package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offer_letters",
       uniqueConstraints = @UniqueConstraint(columnNames = "job_application_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfferLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id", nullable = false)
    private JobApplication jobApplication;

    private String designation;
    private String department;
    private Long ctc;
    private Long fixedCtc;
    private Long variableCtc;
    private LocalDate joiningDate;
    private String workLocation;
    private String workMode;            // Work from Office / Remote / Hybrid

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(columnDefinition = "TEXT")
    private String specialNote;

    private LocalDate offerExpiry;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    private LocalDateTime respondedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { PENDING, ACCEPTED, DECLINED }
}
