package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "industry_sme")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IndustrySme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private IndustryPartner partner;

    private String smeName;

    @Column(columnDefinition = "TEXT")
    private String expertiseArea;   // JSON array of strings

    @Column(columnDefinition = "TEXT")
    private String bio;

    // Availability
    private LocalDate availableFrom;
    private LocalDate availableTo;
    private String recurEvery;      // e.g. "2" (weeks)

    @Column(columnDefinition = "TEXT")
    private String days;            // JSON array e.g. ["Monday","Thursday"]

    @Column(columnDefinition = "TEXT")
    private String timeSlots;       // JSON array of {from, to}

    // Delivery Mode
    private String mode;            // Online / Offline / Both
    private String locationName;
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Status { DRAFT, PUBLISHED, UNPUBLISHED }
}
