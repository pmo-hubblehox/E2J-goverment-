package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "industry_campus_invites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IndustryCampusInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private IndustryPartner partner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute;

    private String instituteName;
    private String programName;
    private String stream;
    private String areaOfSpecialization;
    private String naacAccreditation;
    private Integer rating;

    // Recruitment details
    private String employmentType;
    private String targetDate;
    @Column(columnDefinition = "TEXT")
    private String eligibilityCriteria;
    @Column(columnDefinition = "TEXT")
    private String jobRoles; // JSON array stored as text

    // Campus drive details
    private String driveDate;
    private String driveMode;
    private String venueAddress;
    private String meetingLink;
    private String contactPerson;
    private String contactNumber;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.INVITED;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Status { INVITED, RECEIVED, SUBMITTED, APPROVED, REJECTED }
}
