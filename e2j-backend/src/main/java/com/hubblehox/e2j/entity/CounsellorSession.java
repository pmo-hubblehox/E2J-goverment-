package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "counsellor_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CounsellorSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    // Availability slot definition
    private String dateFrom;
    private String dateTo;
    private Integer recurWeeks;

    @ElementCollection
    @CollectionTable(name = "counsellor_session_days", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "day")
    private List<String> days;

    @ElementCollection
    @CollectionTable(name = "counsellor_session_slots", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "slot")
    private List<String> timeSlots;

    private Double feeAmount;
    private String feeType;

    // Booking details (populated when a student books)
    private String candidateName;
    private String candidateRole;
    private String sessionDate;
    private String sessionTimeSlot;
    private String mode;
    private String meetLink;
    private Integer feedbackRating;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.AVAILABLE;

    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }

    public enum Status { AVAILABLE, UPCOMING, COMPLETED, CANCELLED }
}
