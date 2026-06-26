package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "institutes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Institute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    private String type;
    private String websiteUrl;
    private String phone;

    // Address
    private String buildingName;
    private String roomFloor;
    private String country;
    private String city;
    private String state;
    private String pincode;
    private String area;
    private String landmark;
    @Column(columnDefinition = "TEXT")
    private String locationPin;
    @Column(columnDefinition = "TEXT")
    private String address;

    // Documents
    private String accreditationBody;
    @Column(columnDefinition = "TEXT")
    private String accreditationCertUrl;
    @Column(columnDefinition = "TEXT")
    private String universityCertUrl;
    @Column(columnDefinition = "TEXT")
    private String ratingDocUrl;
    @Column(columnDefinition = "TEXT")
    private String ugcCertUrl;
    @Column(columnDefinition = "TEXT")
    private String mouUrl;

    // Placement contacts (JSON serialized list)
    @Column(columnDefinition = "TEXT")
    private String contactsJson;

    // Services
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "institute_services_avail", joinColumns = @JoinColumn(name = "institute_id"))
    @Column(name = "service")
    private List<String> servicesAvail;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "institute_services_offer", joinColumns = @JoinColumn(name = "institute_id"))
    @Column(name = "service")
    private List<String> servicesOffer;

    // Payment
    private String paymentMethod;
    private Double paymentAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    private Boolean onboardingComplete;
    private Boolean setupComplete;

    @Column(updatable = false)
    private LocalDateTime registrationDate;

    @PrePersist
    protected void onCreate() { registrationDate = LocalDateTime.now(); }

    public enum Status { PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, MORE_INFO }
}
