package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "student_id", nullable = false, unique = true)
    private Student student;

    // ── Personal Information ─────────────────────────────────────────────
    private String title;
    private String firstName;
    private String middleName;
    private String lastName;
    private LocalDate dob;
    private String gender;
    private String nationality;
    private String maritalStatus;
    private String physChallenged;
    private String remark;
    private String mobilePrimary;
    private String mobileAlternate;
    private String alternateEmail;
    private String photoUrl;

    // ── Addresses ────────────────────────────────────────────────────────
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "addressLine1", column = @Column(name = "present_address_line1")),
        @AttributeOverride(name = "addressLine2", column = @Column(name = "present_address_line2")),
        @AttributeOverride(name = "city",         column = @Column(name = "present_city")),
        @AttributeOverride(name = "pincode",       column = @Column(name = "present_pincode")),
        @AttributeOverride(name = "state",         column = @Column(name = "present_state")),
        @AttributeOverride(name = "country",       column = @Column(name = "present_country")),
    })
    private Address presentAddress;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "addressLine1", column = @Column(name = "permanent_address_line1")),
        @AttributeOverride(name = "addressLine2", column = @Column(name = "permanent_address_line2")),
        @AttributeOverride(name = "city",         column = @Column(name = "permanent_city")),
        @AttributeOverride(name = "pincode",       column = @Column(name = "permanent_pincode")),
        @AttributeOverride(name = "state",         column = @Column(name = "permanent_state")),
        @AttributeOverride(name = "country",       column = @Column(name = "permanent_country")),
    })
    private Address permanentAddress;

    private boolean sameAddress;

    // ── Social Media ─────────────────────────────────────────────────────
    private String linkedinUrl;
    private String portfolioUrl;
    private String websiteUrl;

    // ── Preferences ──────────────────────────────────────────────────────
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_preferred_roles",
            joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "role_name")
    @Builder.Default
    private List<String> preferredJobRoles = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_preferred_locations",
            joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "location_name")
    @Builder.Default
    private List<String> preferredLocations = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "student_profile_skills",
            joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "skill_name")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    // ── Salary Expectations ──────────────────────────────────────────────
    private Long annualCtc;
    private Long variableCtc;
    private Long fixedCtc;
    private Long expectedCtc;
    private Integer noticePeriod;

    // ── Experience Summary ───────────────────────────────────────────────
    private String experienceCategory;
    private Integer totalExpYears;
    private Integer totalExpMonths;

    // ── Status ───────────────────────────────────────────────────────────
    @Column(nullable = false)
    @Builder.Default
    private boolean profileCompleted = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
