package com.hubblehox.e2j.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "counsellor_reviews",
       uniqueConstraints = @UniqueConstraint(columnNames = "booking_id"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CounsellorReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private StudentBooking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counsellor_id", nullable = false)
    private Counsellor counsellor;

    private Integer q1; // How helpful was the session?
    private Integer q2; // How well did the counsellor understand your goals?
    private Integer q3; // Would you recommend this counsellor?
    private Integer q4; // Overall satisfaction?

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
