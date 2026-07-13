package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_postings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkshopPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_partner_id")
    private IndustryPartner industryPartner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trainer_id")
    private WorkshopTrainer trainer;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String targetRole;

    /** Optional question the poster wants students to answer when enrolling; null/blank = no question shown */
    private String customQuestion;

    @Enumerated(EnumType.STRING)
    private Mode mode;

    private String sessionDate;
    private String sessionTime;
    private Integer durationMinutes;

    private String city;
    private String state;

    @Column(columnDefinition = "TEXT")
    private String venueAddress;

    private String meetingLink;

    private Double feeAmount;
    private Integer totalSeats;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private Double rating;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Mode { ONLINE, IN_PERSON }
    public enum Status { PENDING, APPROVED, REJECTED, UNPUBLISHED }
}
