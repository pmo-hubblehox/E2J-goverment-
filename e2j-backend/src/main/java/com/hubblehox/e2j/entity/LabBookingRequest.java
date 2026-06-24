package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lab_booking_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LabBookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private IndustryVenueSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;

    private java.time.LocalTime requestedStartTime;
    private java.time.LocalTime requestedEndTime;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private LocalDateTime respondedAt;

    @Column(updatable = false)
    private LocalDateTime requestedAt;

    @PrePersist
    protected void onCreate() { requestedAt = LocalDateTime.now(); }

    public enum RequestStatus { PENDING, ACCEPTED, REJECTED }
}
