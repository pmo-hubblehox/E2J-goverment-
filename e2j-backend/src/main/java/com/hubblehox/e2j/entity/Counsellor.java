package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "counsellors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Counsellor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String phone;
    private String photoUrl;
    private String aadhaarUrl;
    private String gender;
    private String differentlyAbled;
    private String remarks;

    // Address
    private String houseNumber;
    private String flatNumber;
    private String country;
    private String pincode;
    private String state;
    private String city;
    private String area;
    private String landmark;

    // Social
    private String linkedinUrl;
    private String githubUrl;

    // Experience summary
    private String experienceCategory;
    private Integer experienceYears;
    private Integer experienceMonths;

    // Skills
    @ElementCollection
    @CollectionTable(name = "counsellor_skills", joinColumns = @JoinColumn(name = "counsellor_id"))
    @Column(name = "skill")
    private List<String> skills;

    // Languages spoken
    @ElementCollection
    @CollectionTable(name = "counsellor_languages", joinColumns = @JoinColumn(name = "counsellor_id"))
    @Column(name = "language")
    private List<String> languages;

    // Rating (0.0 – 5.0)
    @Builder.Default
    private Double rating = 0.0;

    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private boolean onboardingCompleted = false;

    @Column(columnDefinition = "boolean default false")
    @Builder.Default
    private boolean pendingProfileUpdate = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String pendingData;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { PENDING, APPROVED, REJECTED }
}
