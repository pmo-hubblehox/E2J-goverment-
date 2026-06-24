package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "campus_recruitments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CampusRecruitment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    @Column(nullable = false)
    private String industryPartner;

    @Column(nullable = false)
    private String driveName;

    @Column(nullable = false)
    private String jobRole;

    private String programName;
    private String specialization;
    private LocalDate driveDate;
    private String eligibility;
    private String packageOffered;

    @Enumerated(EnumType.STRING)
    private Status status = Status.RECEIVED;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { RECEIVED, INVITED, ACCEPTED, REJECTED }
}
