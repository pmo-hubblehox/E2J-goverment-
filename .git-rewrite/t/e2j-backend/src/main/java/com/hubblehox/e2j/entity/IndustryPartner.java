package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "industry_partners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IndustryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ── Company Information ──────────────────────────────────────────────────
    private String registeredName;
    private String registeringAs;       // RECRUITMENT_PARTNER | TRAINING_PARTNER | BOTH
    private String industrySector;
    private String organizationSize;
    private String websiteUrl;
    private String onlinePaymentLink;

    // Registered Address
    private String houseNumber;
    private String flatFloor;
    private String country;
    private String pinCode;
    private String state;
    private String district;
    private String city;
    private String taluka;
    private String areaLocality;
    private String landmark;

    // ── Business Details ─────────────────────────────────────────────────────
    private String pan;
    private String taxId;
    private Integer numberOfEmployees;
    private String annualRevenue;
    private String jobRolesAvailable;

    @ElementCollection
    @CollectionTable(name = "industry_partner_benefits", joinColumns = @JoinColumn(name = "partner_id"))
    @Column(name = "benefit")
    private List<String> employeeBenefits;

    @Column(columnDefinition = "TEXT")
    private String recruitmentVision;

    private String trainingSectors;

    @ElementCollection
    @CollectionTable(name = "industry_partner_training_methods", joinColumns = @JoinColumn(name = "partner_id"))
    @Column(name = "method")
    private List<String> trainingMethods;

    @Column(columnDefinition = "TEXT")
    private String trainingVision;

    // ── SPOC Details ─────────────────────────────────────────────────────────
    @ElementCollection
    @CollectionTable(name = "industry_partner_spoc", joinColumns = @JoinColumn(name = "partner_id"))
    @Builder.Default
    private List<SpocDetail> spocDetails = new ArrayList<>();

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SpocDetail {
        private String contactType;
        private String contactPersonName;
        private String emailAddress;
        private String contactNumber;
    }

    // ── Document URLs ────────────────────────────────────────────────────────
    private String panDocUrl;
    private String gstDocUrl;
    private String tanDocUrl;
    private String cinDocUrl;
    private String brochureUrl;

    // ── Application Status ───────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus applicationStatus = ApplicationStatus.DRAFT;

    private LocalDateTime submittedAt;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum ApplicationStatus { DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED }
}
